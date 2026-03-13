import type { BabConfig } from "../config";
import { CommandError } from "./errors";
import {
  discoverBundledPluginRecords,
  discoverInstalledPluginRecords,
  formatTable,
  sourceLabel,
  type WritableLike,
  writeLine,
} from "./shared";

interface ListCommandContext {
  config: BabConfig;
  stdout: WritableLike;
}

export async function runListCommand(
  args: string[],
  context: ListCommandContext,
): Promise<number> {
  if (args.length > 0) {
    throw new CommandError("`bab list` does not accept additional arguments");
  }

  const bundled = await discoverBundledPluginRecords();
  const installed = await discoverInstalledPluginRecords(context.config.paths);
  const rows = [
    ["ID", "Name", "Version", "Command", "Source Type", "Source Repo"],
    ...[...bundled, ...installed]
      .sort((left, right) => left.manifest.id.localeCompare(right.manifest.id))
      .map((plugin) => [
        plugin.manifest.id,
        plugin.manifest.name,
        plugin.manifest.version,
        plugin.manifest.command,
        plugin.sourceType,
        sourceLabel(plugin),
      ]),
  ];

  writeLine(context.stdout, formatTable(rows));
  return 0;
}
