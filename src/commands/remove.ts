import { lstat, realpath, rm } from "node:fs/promises";
import { createInterface } from "node:readline/promises";

import type { BabConfig } from "../config";
import { generateSkillContent, STATIC_TOOL_NAMES } from "../skills/generator";
import { regenerateSkills } from "../skills/index";
import { CommandError } from "./errors";
import {
  BUNDLED_PLUGIN_IDS,
  discoverBundledPluginRecords,
  discoverInstalledPluginRecords,
  type WritableLike,
  writeLine,
} from "./shared";

interface RemoveCommandContext {
  config: BabConfig;
  isTty?: boolean;
  stderr: WritableLike;
  stdin: NodeJS.ReadableStream;
  stdout: WritableLike;
}

function normalizeCommandArgs(args: string[]): {
  pluginId: string;
  yes: boolean;
} {
  let pluginId: string | undefined;
  let yes = false;

  for (const argument of args) {
    if (argument === "--yes") {
      yes = true;
      continue;
    }

    if (argument.startsWith("--")) {
      throw new CommandError(`Unknown option for remove: ${argument}`);
    }

    if (pluginId) {
      throw new CommandError("Only one plugin id can be removed at a time");
    }

    pluginId = argument;
  }

  if (!pluginId) {
    throw new CommandError("Plugin ID is required");
  }

  return { pluginId, yes };
}

async function confirmRemoval(
  pluginId: string,
  context: RemoveCommandContext,
): Promise<void> {
  if (!context.isTty) {
    throw new CommandError(
      "Confirmation required in non-interactive mode; re-run with --yes",
    );
  }

  const prompt = createInterface({
    input: context.stdin,
    output: context.stderr as NodeJS.WritableStream,
  });

  try {
    const answer = await prompt.question(`Remove plugin "${pluginId}"? [y/N] `);

    if (!/^y(?:es)?$/iu.test(answer.trim())) {
      throw new CommandError("Removal cancelled");
    }
  } finally {
    prompt.close();
  }
}

export async function runRemoveCommand(
  args: string[],
  context: RemoveCommandContext,
): Promise<number> {
  const { pluginId, yes } = normalizeCommandArgs(args);

  if (BUNDLED_PLUGIN_IDS.includes(pluginId as "opencode")) {
    throw new CommandError("cannot remove bundled plugin");
  }

  const plugins = await discoverInstalledPluginRecords(context.config.paths);
  const plugin = plugins.find(
    (candidate) => candidate.manifest.id === pluginId,
  );

  if (!plugin) {
    throw new CommandError(`Installed plugin not found: ${pluginId}`);
  }

  const directoryStats = await lstat(plugin.directory);

  if (directoryStats.isSymbolicLink()) {
    throw new CommandError(
      `Refusing to remove symlinked plugin directory: ${plugin.directory}`,
    );
  }

  const realPluginsRoot = await realpath(context.config.paths.pluginsDir);
  const realPluginDirectory = await realpath(plugin.directory);

  if (
    realPluginDirectory !== realPluginsRoot &&
    !realPluginDirectory.startsWith(`${realPluginsRoot}/`)
  ) {
    throw new CommandError(
      `Refusing to remove plugin outside ${context.config.paths.pluginsDir}`,
    );
  }

  if (!yes) {
    await confirmRemoval(pluginId, context);
  }

  await rm(plugin.directory, { force: false, recursive: true });
  writeLine(context.stdout, `Removed plugin ${pluginId}`);

  try {
    const [bundled, installed] = await Promise.all([
      discoverBundledPluginRecords(),
      discoverInstalledPluginRecords(context.config.paths),
    ]);
    const allPluginIds = [...bundled, ...installed]
      .map((p) => p.manifest.id)
      .sort();

    await regenerateSkills(
      context.config,
      () => generateSkillContent(context.config),
      {
        stderr: context.stderr,
        toolNames: STATIC_TOOL_NAMES,
        pluginIds: allPluginIds,
      },
    );
  } catch (error) {
    context.stderr.write(
      `Warning: failed to update agent skills: ${error instanceof Error ? error.message : String(error)}\n`,
    );
  }

  return 0;
}
