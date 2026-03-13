import { describe, expect, test } from "bun:test";

import type { BabConfig } from "../src/config";
import { ProviderRegistry } from "../src/providers/registry";
import { estimateTokenCount } from "../src/utils/tokens";

function createConfig(env: Record<string, string> = {}): BabConfig {
  return {
    env,
    paths: {
      baseDir: "/tmp/.config/bab",
      envFile: "/tmp/.config/bab/env",
      pluginsDir: "/tmp/.config/bab/plugins",
      promptsDir: "/tmp/.config/bab/prompts",
    },
  };
}

describe("estimateTokenCount", () => {
  test("uses a simple chars-per-token heuristic", () => {
    expect(estimateTokenCount("")).toBe(0);
    expect(estimateTokenCount("1234")).toBe(1);
    expect(estimateTokenCount("12345")).toBe(2);
  });
});

describe("ProviderRegistry", () => {
  test("filters model list by configured providers", () => {
    const registry = new ProviderRegistry({
      config: createConfig({
        OPENAI_API_KEY: "openai-key",
        CUSTOM_API_URL: "http://localhost:11434/v1",
      }),
    });

    const models = registry.listModels();

    expect(models.map((model) => model.provider)).toEqual(["openai", "custom"]);
  });

  test("resolves model aliases", () => {
    const registry = new ProviderRegistry({
      config: createConfig({
        OPENAI_API_KEY: "openai-key",
      }),
    });

    const model = registry.getModelInfo("anthropic/claude-sonnet-4");

    expect(model?.id).toBe("claude-sonnet-4-20250514");
    expect(model?.provider).toBe("anthropic");
  });

  test("prefers exact id match over alias match", () => {
    const registry = new ProviderRegistry({
      config: createConfig({
        OPENROUTER_API_KEY: "key",
      }),
    });

    // "openai/gpt-5.2" is both an alias for the OpenAI model and the
    // exact id of the OpenRouter model — exact id should win
    const model = registry.getModelInfo("openai/gpt-5.2");

    expect(model?.id).toBe("openai/gpt-5.2");
    expect(model?.provider).toBe("openrouter");
  });

  test("calls the AI SDK through an injected generateText implementation", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const registry = new ProviderRegistry({
      config: createConfig({
        OPENAI_API_KEY: "openai-key",
      }),
      generateTextFn: async (args) => {
        calls.push(args as Record<string, unknown>);

        return {
          finishReason: "stop",
          providerMetadata: undefined,
          reasoning: [],
          request: {},
          response: {
            id: "resp_123",
            modelId: "gpt-5.2",
            timestamp: new Date("2026-03-10T12:00:00.000Z"),
          },
          steps: [],
          text: "hello back",
          usage: {
            inputTokens: 12,
            outputTokens: 4,
            totalTokens: 16,
          },
          warnings: undefined,
        } as never;
      },
    });

    const result = await registry.generateText(
      "gpt-5.2",
      "hello",
      "system text",
      {
        temperature: 0.2,
      },
    );

    expect(calls).toHaveLength(1);
    expect(calls[0]?.prompt).toBe("hello");
    expect(calls[0]?.system).toBe("system text");
    expect(result).toEqual({
      model: "gpt-5.2",
      provider: "openai",
      text: "hello back",
      usage: {
        input_tokens: 12,
        output_tokens: 4,
        total_tokens: 16,
      },
    });
  });

  test("rejects generateText when provider is not configured", async () => {
    const registry = new ProviderRegistry({
      config: createConfig(),
    });

    await expect(registry.generateText("gpt-5.2", "hello")).rejects.toThrow(
      "Provider not configured: openai",
    );
  });
});
