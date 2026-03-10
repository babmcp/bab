import { cp, mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type {
  CallToolRequest,
  CallToolResult,
  ListToolsResult,
} from "@modelcontextprotocol/sdk/types.js";
import { CallToolResultSchema } from "@modelcontextprotocol/sdk/types.js";

function currentProcessEnv(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(process.env).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return value !== undefined;
    }),
  );
}

export class BabTestHarness {
  private readonly client = new Client({
    name: "bab-test-harness",
    version: "0.1.0",
  });

  constructor(private readonly transport: StdioClientTransport) {}

  async connect(): Promise<void> {
    await this.client.connect(this.transport);
  }

  async listTools(): Promise<ListToolsResult> {
    return this.client.listTools();
  }

  async callTool(
    params: CallToolRequest["params"],
  ): Promise<CallToolResult> {
    return this.client.callTool(
      params,
      CallToolResultSchema,
    ) as Promise<CallToolResult>;
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

export async function createBabTestHarness(
  cwd = process.cwd(),
  pluginDirectories: string[] = [],
  env: Record<string, string> = {},
): Promise<BabTestHarness> {
  const homeDirectory = await mkdtemp(join(tmpdir(), "bab-harness-home-"));
  const pluginsHome = join(homeDirectory, ".config", "bab", "plugins");

  await mkdir(pluginsHome, { recursive: true });

  for (const pluginDirectory of pluginDirectories) {
    const pluginName = pluginDirectory.split("/").at(-1);

    if (!pluginName) {
      continue;
    }

    await cp(pluginDirectory, join(pluginsHome, pluginName), {
      recursive: true,
    });
  }

  const transport = new StdioClientTransport({
    args: ["run", "src/server.ts"],
    command: "bun",
    cwd,
    env: {
      ...currentProcessEnv(),
      ...env,
      HOME: homeDirectory,
    },
    stderr: "pipe",
  });
  const harness = new BabTestHarness(transport);

  await harness.connect();

  return harness;
}
