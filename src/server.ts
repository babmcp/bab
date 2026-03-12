import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  type CallToolRequest,
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
  type ListToolsResult,
  type Tool as McpTool,
  type TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod/v4";

import {
  discoverBundledPluginRecords,
  discoverInstalledPluginRecords,
} from "./commands/shared";
import { loadConfig } from "./config";
import { ConversationStore } from "./memory/conversations";
import { createProviderRegistry } from "./providers/registry";
import { generateSkillContent } from "./skills/generator";
import { regenerateSkills } from "./skills/index";
import { createAnalyzeTool } from "./tools/analyze";
import { createChallengeTool } from "./tools/challenge";
import { createChatTool } from "./tools/chat";
import { createCodeReviewTool } from "./tools/codereview";
import { createConsensusTool } from "./tools/consensus";
import { createDebugTool } from "./tools/debug";
import { createDelegateTool } from "./tools/delegate";
import { createDocgenTool } from "./tools/docgen";
import { createListModelsTool } from "./tools/listmodels";
import { createPlannerTool } from "./tools/planner";
import { createPrecommitTool } from "./tools/precommit";
import { createRefactorTool } from "./tools/refactor";
import { createSecauditTool } from "./tools/secaudit";
import { createTestgenTool } from "./tools/testgen";
import { createThinkDeepTool } from "./tools/thinkdeep";
import { createTracerTool } from "./tools/tracer";
import { createVersionTool } from "./tools/version";
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

  private isConnected = false;
  private isClosing = false;

  constructor() {
    this.protocolServer = new Server(SERVER_INFO, {
      capabilities: {
        tools: {},
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
  }

  registerTool(tool: RegisteredTool): void {
    if (this.toolRegistry.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`);
    }

    this.toolRegistry.set(tool.name, tool);
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
    const tool = this.toolRegistry.get(name);

    logger.info("Tool call received", { tool: name });

    if (!tool) {
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

export function registerCoreTools(
  server: BabServer,
  config: Awaited<ReturnType<typeof loadConfig>>,
): void {
  const providerRegistry = createProviderRegistry(config);
  const conversationStore = new ConversationStore();
  const toolContext = {
    conversationStore,
    providerRegistry,
  };

  server.registerTool(createDelegateTool(config));
  server.registerTool(createAnalyzeTool(toolContext));
  server.registerTool(createChallengeTool());
  server.registerTool(createChatTool(toolContext));
  server.registerTool(createCodeReviewTool(toolContext));
  server.registerTool(createConsensusTool(toolContext));
  server.registerTool(createDebugTool(toolContext));
  server.registerTool(createDocgenTool(toolContext));
  server.registerTool(createPlannerTool(toolContext));
  server.registerTool(createPrecommitTool(toolContext));
  server.registerTool(createRefactorTool(toolContext));
  server.registerTool(createSecauditTool(toolContext));
  server.registerTool(createTestgenTool(toolContext));
  server.registerTool(createThinkDeepTool(toolContext));
  server.registerTool(createTracerTool(toolContext));
  server.registerTool(createListModelsTool(providerRegistry, config));
  server.registerTool(createVersionTool());
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
    const toolNames = Array.from(server.toolRegistry.keys()).sort();
    const [bundled, installed] = await Promise.all([
      discoverBundledPluginRecords(),
      discoverInstalledPluginRecords(config.paths),
    ]);
    const pluginIds = [...bundled, ...installed]
      .map((p) => p.manifest.id)
      .sort();

    await regenerateSkills(
      config,
      (pIds, tNames) => generateSkillContent(config, pIds, tNames),
      { toolNames, pluginIds },
    );
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
