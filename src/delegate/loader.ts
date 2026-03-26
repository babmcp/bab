import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

import YAML from "yaml";
import { z } from "zod/v4";

import { PluginManifestSchema } from "../types";
import type { PluginManifest } from "../types";
import { readPluginEnv } from "../utils/env";
import { logger } from "../utils/logger";
import { assertPathContainment } from "../utils/path";
import { OVERRIDABLE_TOOL_NAMES } from "../tools/overridable-tools";
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

async function resolveToolPrompts(
  manifest: PluginManifest,
  pluginDirectory: string,
): Promise<Record<string, string> | undefined> {
  if (!manifest.tool_prompts) {
    return undefined;
  }

  const resolved: Record<string, string> = Object.create(null);

  for (const [toolName, promptPath] of Object.entries(manifest.tool_prompts)) {
    if (!OVERRIDABLE_TOOL_NAMES.has(toolName)) {
      logger.warn(
        `Unknown tool name "${toolName}" in tool_prompts for plugin "${manifest.id}" — prompt will never be used`,
      );
      continue;
    }
    try {
      const candidatePath = resolve(pluginDirectory, promptPath);
      const resolvedPromptPath = await assertPathContainment(
        candidatePath,
        pluginDirectory,
        `tool prompt "${toolName}"`,
      );
      resolved[toolName] = await Bun.file(resolvedPromptPath).text();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      logger.warn(
        `Skipping tool prompt "${toolName}" for plugin "${manifest.id}": ${message}`,
      );
    }
  }

  return Object.keys(resolved).length > 0 ? resolved : undefined;
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
  const parseResult = PluginManifestSchema.safeParse(parsedManifest);

  if (!parseResult.success) {
    const issues = z.prettifyError(parseResult.error);
    throw new Error(
      `Invalid plugin manifest at ${resolvedManifestPath}:\n${issues}`,
    );
  }

  const manifest = parseResult.data;
  const resolvedToolPrompts = await resolveToolPrompts(
    manifest,
    discoveredPlugin.directory,
  );
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
    resolvedToolPrompts,
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
