import { pathToFileURL } from "node:url";

import YAML from "yaml";

import { PluginManifestSchema } from "../types";
import type { PluginManifest } from "../types";
import { readPluginEnv } from "../utils/env";
import { logger } from "../utils/logger";
import { assertPathContainment } from "../utils/path";
import { wrapSimpleAdapter } from "./adapter-wrapper";
import type {
  DelegatePluginAdapter,
  DiscoveredPlugin,
  LoadedPlugin,
  SimpleAdapter,
} from "./types";

function resolveAdapter(
  raw: unknown,
  manifest: PluginManifest,
): DelegatePluginAdapter | undefined {
  if (!raw || typeof raw !== "object") {
    logger.warn("Skipping plugin with invalid adapter export", {
      plugin_id: manifest.id,
    });
    return undefined;
  }

  const adapter = raw as Record<string, unknown>;

  if (typeof adapter.run === "function") {
    return raw as DelegatePluginAdapter;
  }

  if (
    typeof adapter.buildCommand === "function" &&
    typeof adapter.parseResult === "function"
  ) {
    return wrapSimpleAdapter(raw as SimpleAdapter, manifest);
  }

  logger.warn(
    "Skipping adapter without run() or buildCommand()+parseResult()",
    { plugin_id: manifest.id },
  );
  return undefined;
}


async function loadAdapterModule(
  adapterPath: string,
  pluginDirectory: string,
): Promise<DelegatePluginAdapter | undefined> {
  const resolvedPath = await assertPathContainment(
    adapterPath,
    pluginDirectory,
    "adapter",
  );
  const module = await import(pathToFileURL(resolvedPath).href);

  return (module.default ?? module.adapter ?? module) as DelegatePluginAdapter;
}

export async function loadPlugin(
  discoveredPlugin: DiscoveredPlugin,
): Promise<LoadedPlugin & { env: Record<string, string> }> {
  const resolvedManifestPath = await assertPathContainment(
    discoveredPlugin.manifestPath,
    discoveredPlugin.directory,
    "manifest",
  );
  const manifestSource = await Bun.file(resolvedManifestPath).text();
  const parsedManifest = YAML.parse(manifestSource, { maxAliasCount: 10 });
  const manifest = PluginManifestSchema.parse(parsedManifest);
  const env = await readPluginEnv(discoveredPlugin.directory);

  if (!Bun.which(manifest.command)) {
    throw new Error(
      `Plugin "${manifest.name}" requires CLI command "${manifest.command}" which was not found on PATH. Please install it before using this plugin.`,
    );
  }

  const adapter = discoveredPlugin.adapterPath
    ? resolveAdapter(
        await loadAdapterModule(
          discoveredPlugin.adapterPath,
          discoveredPlugin.directory,
        ),
        manifest,
      )
    : undefined;

  if (adapter?.validate) {
    await adapter.validate();
  }

  return {
    adapter,
    adapterPath: discoveredPlugin.adapterPath,
    directory: discoveredPlugin.directory,
    env,
    manifest,
    manifestPath: discoveredPlugin.manifestPath,
  };
}

export async function loadPlugins(
  discoveredPlugins: DiscoveredPlugin[],
): Promise<Array<LoadedPlugin & { env: Record<string, string> }>> {
  const results = await Promise.allSettled(
    discoveredPlugins.map((plugin) => loadPlugin(plugin)),
  );

  const loadedPlugins: Array<LoadedPlugin & { env: Record<string, string> }> =
    [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];

    if (result.status === "fulfilled") {
      loadedPlugins.push(result.value);
    } else {
      const message =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);

      logger.warn(`Skipping plugin: ${message}`, {
        manifest_path: discoveredPlugins[i].manifestPath,
      });
    }
  }

  return loadedPlugins;
}
