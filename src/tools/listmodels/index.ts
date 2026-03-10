import { z } from "zod/v4";

import type { BabConfig } from "../../config";
import { getBundledPluginsRoot } from "../../commands/shared";
import { discoverPluginDirectories } from "../../delegate/discovery";
import { loadPlugins } from "../../delegate/loader";
import type { ProviderRegistry } from "../../providers/registry";
import type { RegisteredTool } from "../../server";

export function createListModelsTool(
  providerRegistry: ProviderRegistry,
  config: BabConfig,
): RegisteredTool {
  return {
    description:
      "List models available from the configured AI providers and delegate plugins.",
    execute: async () => {
      const providerModels = providerRegistry.listModels();

      const bundledRoot = await getBundledPluginsRoot();
      const [bundled, installed] = await Promise.all([
        discoverPluginDirectories(bundledRoot),
        discoverPluginDirectories(config.paths.pluginsDir),
      ]);
      const allLoaded = await loadPlugins([...bundled, ...installed]);
      const byId = new Map(allLoaded.map((p) => [p.manifest.id, p]));
      const plugins = [...byId.values()];

      const pluginModels: Record<string, string[]> = {};

      const modelResults = await Promise.all(
        plugins
          .filter((p) => p.adapter?.listModels)
          .map(async (plugin) => {
            try {
              const models = await plugin.adapter!.listModels!();
              return { id: plugin.manifest.id, models };
            } catch {
              return { id: plugin.manifest.id, models: [] as string[] };
            }
          }),
      );

      for (const { id, models } of modelResults) {
        if (models.length > 0) {
          pluginModels[id] = models;
        }
      }

      const result = {
        providers: providerModels,
        plugins: pluginModels,
      };

      const totalCount =
        providerModels.length +
        Object.values(pluginModels).reduce((sum, m) => sum + m.length, 0);

      return {
        ok: true,
        value: {
          content: JSON.stringify(result),
          content_type: "json",
          metadata: {
            count: totalCount,
            provider_count: providerModels.length,
            plugin_count: Object.keys(pluginModels).length,
          },
          status: "success",
        },
      };
    },
    inputSchema: z.object({}),
    name: "list_models",
  };
}
