import { z } from "zod/v4";

import type { BabServer, RegisteredTool } from "../../server";
import type { ToolCategory } from "../manifest";

const ToolsInputSchema = z.object({
  activate: z
    .array(z.string().min(1))
    .optional()
    .describe("Tool names to load. Omit to just list available tools."),
  activate_all: z
    .boolean()
    .optional()
    .describe("Load all available tools at once."),
  activate_category: z
    .string()
    .optional()
    .describe(
      "Load all tools in a category: analysis, generation, review, planning, delegation, info.",
    ),
});

interface ToolEntry {
  name: string;
  description: string;
  category: ToolCategory;
  loaded: boolean;
}

function buildListing(server: BabServer): ToolEntry[] {
  return Array.from(server.manifest.values()).map((entry) => ({
    name: entry.name,
    description: entry.description,
    category: entry.category,
    loaded: server.toolRegistry.has(entry.name),
  }));
}

export function createToolsTool(server: BabServer): RegisteredTool {
  return {
    name: "tools",
    description:
      "Discover and load Bab tools on demand. Call with no arguments to list all available tools. Use activate, activate_category, or activate_all to load tools before use.",
    inputSchema: ToolsInputSchema,
    execute: async (args) => {
      const { activate, activate_all, activate_category } = args as z.infer<
        typeof ToolsInputSchema
      >;

      const shouldActivate =
        activate !== undefined ||
        activate_all !== undefined ||
        activate_category !== undefined;

      const loaded: string[] = [];
      const already_loaded: string[] = [];

      if (shouldActivate) {
        let namesToLoad: string[];

        if (activate_all) {
          namesToLoad = Array.from(server.manifest.keys());
        } else if (activate_category) {
          namesToLoad = Array.from(server.manifest.values())
            .filter((entry) => entry.category === activate_category)
            .map((entry) => entry.name);
        } else {
          namesToLoad = activate ?? [];
        }

        // Separate already-loaded from those that need loading
        const toLoad: string[] = [];
        for (const name of namesToLoad) {
          if (server.toolRegistry.has(name)) {
            already_loaded.push(name);
          } else {
            toLoad.push(name);
          }
        }

        // Batch load: single listChanged notification for all newly loaded tools
        const batchLoaded = await server.batchLoadFromManifest(toLoad);
        for (const tool of batchLoaded) {
          loaded.push(tool.name);
        }
      }

      const tools = buildListing(server);

      const payload: Record<string, unknown> = { tools };

      if (shouldActivate) {
        payload.loaded = loaded.sort();
        payload.already_loaded = already_loaded.sort();
        if (loaded.length > 0) {
          payload.note =
            "Tools activated. If your client does not auto-refresh after tools/list_changed, re-fetch the tool list to see updated schemas.";
        }
      }

      return {
        ok: true,
        value: {
          content: JSON.stringify(payload),
          content_type: "json",
          metadata: {},
          status: "success",
        },
      };
    },
  };
}
