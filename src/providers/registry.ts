import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter, openrouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI, openai } from "@ai-sdk/openai";
import {
  generateText as aiGenerateText,
  type LanguageModel,
} from "ai";

import type { BabConfig } from "../config";
import type { ModelInfo, ProviderId } from "../types";
import { estimateTokenCount } from "../utils/tokens";

type GenerateTextFn = typeof aiGenerateText;

export interface ProviderRegistryOptions {
  config: BabConfig;
  generateTextFn?: GenerateTextFn;
}

export type ThinkingMode = "minimal" | "low" | "medium" | "high" | "max";

export interface GenerateTextOptions {
  abortSignal?: AbortSignal;
  maxOutputTokens?: number;
  temperature?: number;
  thinkingMode?: ThinkingMode;
}

export interface GenerateTextResult {
  model: string;
  provider: ProviderId;
  text: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

interface LanguageModelProvider {
  languageModel(modelId: string): LanguageModel;
}

type ProviderFactory = LanguageModelProvider;

const STATIC_MODEL_REGISTRY: ReadonlyArray<ModelInfo> = [
  {
    id: "gemini-2.5-pro",
    provider: "google",
    display_name: "Gemini 2.5 Pro",
    capabilities: {
      aliases: ["google/gemini-2.5-pro"],
      context_window: 1_048_576,
      description: "High-end reasoning and coding model from Google.",
      score: 100,
      supports_images: true,
      supports_thinking: true,
      supports_vision: true,
    },
  },
  {
    id: "gpt-5.2",
    provider: "openai",
    display_name: "GPT-5.2",
    capabilities: {
      aliases: ["openai/gpt-5.2"],
      context_window: 400_000,
      description: "General-purpose flagship OpenAI model.",
      score: 100,
      supports_images: true,
      supports_thinking: true,
      supports_vision: true,
    },
  },
  {
    id: "claude-sonnet-4-20250514",
    provider: "anthropic",
    display_name: "Claude Sonnet 4",
    capabilities: {
      aliases: ["anthropic/claude-sonnet-4"],
      context_window: 200_000,
      description: "Balanced Anthropic model for coding and reasoning.",
      score: 95,
      supports_images: true,
      supports_thinking: true,
      supports_vision: true,
    },
  },
  {
    id: "openai/gpt-5.2",
    provider: "openrouter",
    display_name: "OpenRouter GPT-5.2",
    capabilities: {
      aliases: ["openrouter/openai/gpt-5.2"],
      context_window: 400_000,
      description: "OpenRouter-hosted GPT-5.2 compatible endpoint.",
      score: 100,
      supports_images: true,
      supports_thinking: true,
      supports_vision: true,
    },
  },
  {
    id: "custom/default",
    provider: "custom",
    display_name: "Custom Default Model",
    capabilities: {
      aliases: ["custom/default-model"],
      context_window: 128_000,
      description: "OpenAI-compatible custom endpoint model.",
      score: 50,
      supports_images: false,
      supports_thinking: false,
      supports_vision: false,
    },
  },
] as const;

const MODEL_PREFIX_TO_PROVIDER: ReadonlyArray<[RegExp, ProviderId]> = [
  [/^claude-/, "anthropic"],
  [/^gpt-/, "openai"],
  [/^o\d+-/, "openai"],
  [/^gemini-/, "google"],
];

function inferProvider(modelId: string): ProviderId | undefined {
  for (const [pattern, provider] of MODEL_PREFIX_TO_PROVIDER) {
    if (pattern.test(modelId)) return provider;
  }
  return undefined;
}

const SYNTHETIC_DEFAULTS: ModelInfo["capabilities"] = {
  context_window: 128_000,
  score: 50,
  supports_thinking: false,
  supports_vision: false,
  supports_images: false,
  aliases: [],
};

const PROVIDER_ENV_CONFIG = {
  anthropic: { apiKey: "ANTHROPIC_API_KEY" },
  custom: { apiKey: "CUSTOM_API_KEY", baseUrl: "CUSTOM_API_URL" },
  google: { apiKey: "GOOGLE_API_KEY" },
  openai: { apiKey: "OPENAI_API_KEY" },
  openrouter: { apiKey: "OPENROUTER_API_KEY" },
} as const satisfies Record<
  ProviderId,
  { apiKey?: string; baseUrl?: string }
>;

export class ProviderRegistry {
  private readonly config: BabConfig;
  private readonly generateTextFn: GenerateTextFn;
  private readonly providerFactories = new Map<ProviderId, ProviderFactory>();

  constructor({ config, generateTextFn = aiGenerateText }: ProviderRegistryOptions) {
    this.config = config;
    this.generateTextFn = generateTextFn;
  }

  listModels(): ModelInfo[] {
    return STATIC_MODEL_REGISTRY.filter((model) => this.isProviderConfigured(model.provider));
  }

  getModelInfo(modelIdOrAlias: string): ModelInfo | undefined {
    // Prefer exact id match over alias match to avoid cross-provider collisions
    const exactMatch = STATIC_MODEL_REGISTRY.find(
      (model) => model.id === modelIdOrAlias,
    );
    if (exactMatch) return exactMatch;

    const aliasMatch = STATIC_MODEL_REGISTRY.find(
      (model) => model.capabilities.aliases.includes(modelIdOrAlias),
    );
    if (aliasMatch) return aliasMatch;

    // Inferred models are config-gated here (unlike static models) because
    // ModelGateway uses getModelInfo() to decide SDK vs delegate routing -
    // returning an unconfigured inferred model would prevent delegate fallback.
    const inferred = inferProvider(modelIdOrAlias);
    if (inferred && this.isProviderConfigured(inferred)) {
      return {
        id: modelIdOrAlias,
        provider: inferred,
        display_name: modelIdOrAlias,
        capabilities: { ...SYNTHETIC_DEFAULTS },
      };
    }

    return undefined;
  }

  isProviderConfigured(providerId: ProviderId): boolean {
    const providerConfig = PROVIDER_ENV_CONFIG[providerId];

    if (providerId === "custom") {
      return Boolean(
        "baseUrl" in providerConfig &&
          providerConfig.baseUrl &&
          this.config.env[providerConfig.baseUrl],
      );
    }

    return Boolean(providerConfig.apiKey && this.config.env[providerConfig.apiKey]);
  }

  async generateText(
    modelIdOrAlias: string,
    prompt: string,
    systemPrompt?: string,
    options: GenerateTextOptions = {},
  ): Promise<GenerateTextResult> {
    const modelInfo = this.getModelInfo(modelIdOrAlias);

    if (!modelInfo) {
      throw new Error(`Unknown model: ${modelIdOrAlias}`);
    }

    if (!this.isProviderConfigured(modelInfo.provider)) {
      throw new Error(`Provider not configured: ${modelInfo.provider}`);
    }

    const provider = this.getProviderFactory(modelInfo.provider);
    const model = provider.languageModel(modelInfo.id) as LanguageModel;
    const providerOptions = this.buildProviderOptions(
      modelInfo.provider,
      options.thinkingMode,
    );
    const result = await this.generateTextFn({
      abortSignal: options.abortSignal,
      maxOutputTokens: options.maxOutputTokens,
      model,
      prompt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(Object.keys(providerOptions).length > 0 && { providerOptions: providerOptions as any }),
      system: systemPrompt,
      temperature: options.temperature,
    });

    const inputTokens = result.usage?.inputTokens ?? estimateTokenCount(prompt);
    const outputTokens =
      result.usage?.outputTokens ?? estimateTokenCount(result.text);

    return {
      model: modelInfo.id,
      provider: modelInfo.provider,
      text: result.text,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens:
          result.usage?.totalTokens ?? inputTokens + outputTokens,
      },
    };
  }

  private buildProviderOptions(
    provider: ProviderId,
    thinkingMode: ThinkingMode | undefined,
  ): Record<string, Record<string, unknown>> {
    if (!thinkingMode) {
      return {};
    }

    const ANTHROPIC_BUDGET: Record<ThinkingMode, number> = {
      minimal: 1_024,
      low: 5_000,
      medium: 20_000,
      high: 50_000,
      max: 80_000,
    };

    const OPENAI_EFFORT: Record<ThinkingMode, string> = {
      minimal: "low",
      low: "low",
      medium: "medium",
      high: "high",
      max: "high",
    };

    switch (provider) {
      case "anthropic":
        return {
          anthropic: {
            thinking: {
              type: "enabled",
              budgetTokens: ANTHROPIC_BUDGET[thinkingMode],
            },
          },
        };
      case "openai":
        return { openai: { reasoningEffort: OPENAI_EFFORT[thinkingMode] } };
      // Google thinking is implicit; custom/openrouter: silently ignore
      default:
        return {};
    }
  }

  private getProviderFactory(providerId: ProviderId): ProviderFactory {
    const existingProvider = this.providerFactories.get(providerId);

    if (existingProvider) {
      return existingProvider;
    }

    const provider = this.createProviderFactory(providerId);
    this.providerFactories.set(providerId, provider);
    return provider;
  }

  private createProviderFactory(providerId: ProviderId): ProviderFactory {
    switch (providerId) {
      case "google": {
        const apiKey = this.config.env.GOOGLE_API_KEY;
        return apiKey ? createGoogleGenerativeAI({ apiKey }) : google;
      }
      case "openai": {
        const apiKey = this.config.env.OPENAI_API_KEY;
        return apiKey ? createOpenAI({ apiKey }) : openai;
      }
      case "anthropic": {
        const apiKey = this.config.env.ANTHROPIC_API_KEY;
        return apiKey ? createAnthropic({ apiKey }) : anthropic;
      }
      case "openrouter":
        return this.config.env.OPENROUTER_API_KEY
          ? createOpenRouter({
              apiKey: this.config.env.OPENROUTER_API_KEY,
            })
          : openrouter;
      case "custom":
        return createOpenAICompatible({
          apiKey: this.config.env.CUSTOM_API_KEY,
          baseURL: this.config.env.CUSTOM_API_URL ?? "http://localhost:11434/v1",
          name: "custom",
        });
    }
  }
}

export function createProviderRegistry(config: BabConfig): ProviderRegistry {
  return new ProviderRegistry({ config });
}
