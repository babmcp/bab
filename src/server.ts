import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  type CallToolRequest,
  CallToolRequestSchema,
  type CallToolResult,
  type GetPromptRequest,
  GetPromptRequestSchema,
  type GetPromptResult,
  type ListPromptsResult,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
  type ListToolsResult,
  type Tool as McpTool,
  type TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod/v4";

import type { BabConfig } from "./config";
import { loadConfig } from "./config";
import { ConversationStore } from "./memory/conversations";
import { persistReport } from "./memory/persistence";
import { createModelGateway } from "./providers/model-gateway";
import { createProviderRegistry } from "./providers/registry";
import { generateSkillContent } from "./skills/generator";
import { regenerateSkills } from "./skills/index";
import { ALWAYS_LOADED_TOOLS, buildToolManifest, type ToolManifestEntry } from "./tools/manifest";
import { createToolsTool } from "./tools/tools";
import { getPrompt, listPrompts } from "./prompts/slash-commands";
import {
  type Result,
  type ToolError,
  ToolErrorSchema,
  type ToolOutput,
} from "./types";
import { configureLogging, logger } from "./utils/logger";
import { VERSION } from "./version";

const SERVER_INFO = {
  name: "bab",
  version: VERSION,
} as const;

const EmptyInputSchema = z.object({});

export interface RegisteredTool {
  name: string;
  description?: string;
  inputSchema: z.ZodObject;
  outputSchema?: z.ZodObject;
  execute: (
    args: Record<string, unknown>,
  ) => Promise<Result<ToolOutput, ToolError>> | Result<ToolOutput, ToolError>;
}

function toToolError(error: unknown): ToolError {
  if (error instanceof z.ZodError) {
    return {
      type: "validation",
      message: "Invalid tool arguments",
      details: error.flatten(),
      retryable: false,
    };
  }

  const parsedToolError = ToolErrorSchema.safeParse(error);

  if (parsedToolError.success) {
    return parsedToolError.data;
  }

  if (error instanceof Error) {
    return {
      type: "execution",
      message: error.message,
      details: {
        name: error.name,
        stack: error.stack,
      },
      retryable: false,
    };
  }

  return {
    type: "unknown",
    message: "Unknown tool execution failure",
    details: error,
    retryable: false,
  };
}

function toTextContent(payload: ToolOutput | ToolError): TextContent[] {
  return [
    {
      type: "text",
      text: JSON.stringify(payload),
    },
  ];
}

function toMcpSchema(schema?: z.ZodObject): McpTool["inputSchema"] {
  return (schema ?? EmptyInputSchema).toJSONSchema() as McpTool["inputSchema"];
}

function toMcpTool(tool: RegisteredTool): McpTool {
  return {
    name: tool.name,
    description: tool.description,
    inputSchema: toMcpSchema(tool.inputSchema),
    outputSchema: tool.outputSchema
      ? toMcpSchema(tool.outputSchema)
      : undefined,
  };
}

export class BabServer {
  readonly toolRegistry = new Map<string, RegisteredTool>();
  readonly protocolServer: Server;
  manifest = new Map<string, ToolManifestEntry>();
  config: BabConfig | undefined;

  private isConnected = false;
  private isClosing = false;
  private readonly loadingPromises = new Map<string, Promise<RegisteredTool>>();

  shouldPersistTool(toolName: string): boolean {
    if (!this.config?.persistence.enabled) return false;
    const entry = this.manifest.get(toolName);
    if (!entry) return false;
    if (entry.persist === "never") return false;
    if (entry.persist === "default") {
      return !this.config.persistence.disabledTools.has(toolName);
    }
    // optional
    return this.config.persistence.enabledTools.has(toolName);
  }

  constructor() {
    this.protocolServer = new Server(SERVER_INFO, {
      capabilities: {
        prompts: {},
        tools: { listChanged: true },
      },
    });

    this.protocolServer.onerror = (error) => {
      logger.error("MCP protocol error", {
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
      });
    };

    this.protocolServer.onclose = () => {
      this.isConnected = false;
      logger.info("MCP server closed");
    };

    this.protocolServer.setRequestHandler(ListToolsRequestSchema, async () =>
      this.handleListToolsRequest(),
    );
    this.protocolServer.setRequestHandler(
      CallToolRequestSchema,
      async (request) => this.handleCallToolRequest(request),
    );
    this.protocolServer.setRequestHandler(
      ListPromptsRequestSchema,
      async () => this.handleListPromptsRequest(),
    );
    this.protocolServer.setRequestHandler(
      GetPromptRequestSchema,
      async (request) => this.handleGetPromptRequest(request),
    );
  }

  registerTool(tool: RegisteredTool): void {
    if (this.toolRegistry.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }

    this.toolRegistry.set(tool.name, tool);
  }

  async sendToolListChanged(): Promise<void> {
    await this.protocolServer.sendToolListChanged();
  }

  async loadFromManifest(name: string): Promise<RegisteredTool | null> {
    const existing = this.toolRegistry.get(name);
    if (existing) return existing;

    const inFlight = this.loadingPromises.get(name);
    if (inFlight) return inFlight;

    const entry = this.manifest.get(name);
    if (!entry) return null;

    const promise = Promise.resolve(entry.factory()).then((tool) => {
      this.registerTool(tool);
      this.loadingPromises.delete(name);
      return tool;
    });

    this.loadingPromises.set(name, promise);
    const tool = await promise;
    void this.sendToolListChanged();
    return tool;
  }

  async handleListPromptsRequest(): Promise<ListPromptsResult> {
    return { prompts: listPrompts() };
  }

  async handleGetPromptRequest(
    request: GetPromptRequest,
  ): Promise<GetPromptResult> {
    const { name, arguments: args } = request.params;
    logger.info("Prompt requested", { prompt: name });
    return getPrompt(name, args);
  }

  async handleListToolsRequest(): Promise<ListToolsResult> {
    return {
      tools: Array.from(this.toolRegistry.values(), toMcpTool),
    };
  }

  async handleCallToolRequest(
    request: CallToolRequest,
  ): Promise<CallToolResult> {
    const { arguments: rawArguments = {}, name } = request.params;
    logger.info("Tool call received", { tool: name });

    let tool = this.toolRegistry.get(name);

    if (!tool) {
      const loaded = await this.loadFromManifest(name);
      if (!loaded) {
        logger.warn("Unknown tool requested", { tool: name });
        return {
          content: toTextContent({
            type: "not_found",
            message: `Unknown tool: ${name}`,
            retryable: false,
          }),
          isError: true,
        };
      }
      tool = loaded;
    }

    const startedAt = Date.now();

    try {
      const parsedArguments = tool.inputSchema.parse(rawArguments) as Record<
        string,
        unknown
      >;
      const result = await tool.execute(parsedArguments);
      const durationMs = Date.now() - startedAt;

      if (result.ok) {
        logger.info("Tool call succeeded", {
          tool: name,
          duration_ms: durationMs,
        });

        if (this.shouldPersistTool(name)) {
          const promptText = typeof rawArguments.prompt === "string" ? rawArguments.prompt : "";
          const continuationId =
            typeof rawArguments.continuation_id === "string"
              ? rawArguments.continuation_id
              : `${name}-${Date.now()}`;
          void persistReport(
            name,
            promptText,
            continuationId,
            result.value.content ?? JSON.stringify(result.value),
            process.cwd(),
          );
        }

        return {
          content: toTextContent(result.value),
          isError: false,
        };
      }

      logger.warn("Tool call returned error", {
        tool: name,
        duration_ms: durationMs,
      });
      return {
        content: toTextContent(result.error),
        isError: true,
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      logger.error("Tool call threw exception", {
        tool: name,
        duration_ms: durationMs,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        content: toTextContent(toToolError(error)),
        isError: true,
      };
    }
  }

  async connect(
    transport = new StdioServerTransport(),
  ): Promise<StdioServerTransport> {
    await this.protocolServer.connect(transport);
    this.isConnected = true;
    logger.info("MCP server connected", {
      tool_count: this.toolRegistry.size,
    });

    return transport;
  }

  async close(): Promise<void> {
    if (!this.isConnected || this.isClosing) {
      return;
    }

    this.isClosing = true;

    try {
      await this.protocolServer.close();
    } finally {
      this.isClosing = false;
      this.isConnected = false;
    }
  }
}

export const CORE_TOOL_NAMES = [
  "analyze",
  "challenge",
  "chat",
  "codereview",
  "consensus",
  "debug",
  "delegate",
  "docgen",
  "list_models",
  "planner",
  "precommit",
  "refactor",
  "secaudit",
  "testgen",
  "thinkdeep",
  "tracer",
  "version",
] as const;

// Additional tools registered only in lazy mode
export const LAZY_MODE_TOOL_NAMES = ["tools"] as const;

export function parseDisabledTools(raw?: string): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function registerCoreTools(
  server: BabServer,
  config: Awaited<ReturnType<typeof loadConfig>>,
): void {
  const providerRegistry = createProviderRegistry(config);
  const modelGateway = createModelGateway(providerRegistry, config);
  const conversationStore = new ConversationStore();
  const toolContext = {
    conversationStore,
    modelGateway,
    providerRegistry,
  };

  const disabled = parseDisabledTools(config.env.BAB_DISABLED_TOOLS);
  const manifest = buildToolManifest(toolContext, providerRegistry, config);

  // Filter disabled tools out of the manifest entirely
  for (const name of disabled) {
    if (manifest.has(name)) {
      logger.info("Tool disabled via BAB_DISABLED_TOOLS", { tool: name });
      manifest.delete(name);
    }
  }

  server.manifest = manifest;
  server.config = config;

  // Log effective persistence config at startup
  const defaultTools = [...manifest.values()]
    .filter((e) => e.persist === "default")
    .map((e) => e.name);
  const optionalEnabled = [...config.persistence.enabledTools].filter((t) => {
    const entry = manifest.get(t);
    return entry?.persist === "optional";
  });
  const disabledFromDefaults = [...config.persistence.disabledTools].filter((t) =>
    manifest.get(t)?.persist === "default",
  );
  logger.debug("Persistence config", {
    enabled: config.persistence.enabled,
    default_tools: defaultTools,
    optional_enabled: optionalEnabled,
    disabled: disabledFromDefaults,
  });

  if (config.lazyTools) {
    // Lazy mode: register always-loaded tools + the tools meta-tool
    for (const entry of manifest.values()) {
      if (ALWAYS_LOADED_TOOLS.has(entry.name)) {
        server.registerTool(entry.factory());
      }
    }
    server.registerTool(createToolsTool(server));
    logger.info("Lazy tool loading enabled", {
      always_loaded: Array.from(ALWAYS_LOADED_TOOLS),
    });
  } else {
    // Eager mode (default): register all tools from manifest
    for (const entry of manifest.values()) {
      server.registerTool(entry.factory());
    }
  }
}

function installSignalHandlers(server: BabServer): () => void {
  const shutdown = (signal: NodeJS.Signals) => {
    logger.info("Received shutdown signal", { signal });
    void server
      .close()
      .catch((error: unknown) => {
        logger.error("Failed to close MCP server cleanly", {
          error: toToolError(error),
        });
      })
      .finally(() => {
        process.exit(0);
      });
  };

  const handleSigint = () => shutdown("SIGINT");
  const handleSigterm = () => shutdown("SIGTERM");

  process.once("SIGINT", handleSigint);
  process.once("SIGTERM", handleSigterm);

  return () => {
    process.off("SIGINT", handleSigint);
    process.off("SIGTERM", handleSigterm);
  };
}

export async function main(): Promise<void> {
  await configureLogging();
  const config = await loadConfig();
  const server = new BabServer();
  registerCoreTools(server, config);
  const removeSignalHandlers = installSignalHandlers(server);

  try {
    await regenerateSkills(() => generateSkillContent(config));
  } catch (error) {
    logger.warn("Failed to auto-update agent skills on startup", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    await server.connect();
    logger.info("Bab MCP server running on stdio", {
      config_dir: config.paths.baseDir,
    });
  } catch (error) {
    removeSignalHandlers();
    throw error;
  }
}

if (import.meta.main) {
  main().catch((error: unknown) => {
    logger.error("Failed to start MCP server", {
      error: toToolError(error),
    });
    process.exit(1);
  });
}
