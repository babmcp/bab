#!/usr/bin/env node

import { runAddCommand as executeAddCommand } from "./commands/add";
import { CommandError } from "./commands/errors";
import { runListCommand as executeListCommand } from "./commands/list";
import { runRemoveCommand as executeRemoveCommand } from "./commands/remove";
import { loadConfig } from "./config";
import { validatePluginDirectory } from "./plugin-sdk/conformance";
import { main as startServer } from "./server";
import { VERSION } from "./version";

interface WritableLike {
  write(chunk: string): unknown;
}

export interface CliDependencies {
  loadConfig: typeof loadConfig;
  runAddCommand: typeof executeAddCommand;
  runListCommand: typeof executeListCommand;
  runRemoveCommand: typeof executeRemoveCommand;
  startServer: typeof startServer;
  stdin: NodeJS.ReadStream;
  stdout: WritableLike;
  stderr: WritableLike;
  validatePluginDirectory: typeof validatePluginDirectory;
}

type CliCommandHandler = (
  args: string[],
  dependencies: CliDependencies,
) => Promise<number>;

class CliCommandError extends Error {
  readonly exitCode: number;
  readonly helpText?: string;

  constructor(
    message: string,
    options: { exitCode?: number; helpText?: string } = {},
  ) {
    super(message);
    this.name = "CliCommandError";
    this.exitCode = options.exitCode ?? 1;
    this.helpText = options.helpText;
  }
}

const defaultCliDependencies: CliDependencies = {
  loadConfig,
  runAddCommand: executeAddCommand,
  runListCommand: executeListCommand,
  runRemoveCommand: executeRemoveCommand,
  startServer,
  stderr: process.stderr,
  stdin: process.stdin,
  stdout: process.stdout,
  validatePluginDirectory,
};

function writeLine(stream: WritableLike, message: string): void {
  stream.write(`${message}\n`);
}

function isHelpFlag(argument?: string): boolean {
  return argument === "--help" || argument === "-h" || argument === "help";
}

export function getCliHelpText(): string {
  return [
    "Bab CLI",
    "",
    "Usage:",
    "  bab",
    "  bab --version",
    "  bab serve",
    "  bab add <source>",
    "  bab remove <plugin-id>",
    "  bab list",
    "  bab help",
    "  bab test-plugin <plugin-directory>",
    "",
    "Commands:",
    "  add                   Install plugin(s) from a git source",
    "  remove                Remove an installed plugin",
    "  list                  List bundled and installed plugins",
    "  help                  Show CLI usage information",
    "  serve                 Start the Bab MCP server over stdio",
    "  test-plugin <dir>     Validate a delegate plugin directory",
    "  --version             Print the Bab CLI version",
  ].join("\n");
}

export function getAddHelpText(): string {
  return [
    "Usage:",
    "  bab add <source> [--yes]",
    "",
    "Install plugin(s) from a git repository source.",
  ].join("\n");
}

export function getRemoveHelpText(): string {
  return [
    "Usage:",
    "  bab remove <plugin-id> [--yes]",
    "",
    "Remove an installed plugin by ID.",
  ].join("\n");
}

export function getListHelpText(): string {
  return [
    "Usage:",
    "  bab list",
    "",
    "List bundled and installed plugins.",
  ].join("\n");
}

export function getTestPluginHelpText(): string {
  return [
    "Usage:",
    "  bab test-plugin <plugin-directory>",
    "",
    "Validate a delegate plugin directory.",
  ].join("\n");
}

async function runServeCommand(
  _args: string[],
  dependencies: CliDependencies,
): Promise<number> {
  await dependencies.startServer();
  return 0;
}

async function runHelpCommand(
  _args: string[],
  dependencies: CliDependencies,
): Promise<number> {
  writeLine(dependencies.stdout, getCliHelpText());
  return 0;
}

async function runVersionCommand(
  _args: string[],
  dependencies: CliDependencies,
): Promise<number> {
  writeLine(dependencies.stdout, VERSION);
  return 0;
}

async function runAddCommand(
  args: string[],
  dependencies: CliDependencies,
): Promise<number> {
  if (isHelpFlag(args[0])) {
    writeLine(dependencies.stdout, getAddHelpText());
    return 0;
  }

  if (!args[0]) {
    throw new CliCommandError("Plugin source is required", {
      helpText: getAddHelpText(),
    });
  }

  const config = await dependencies.loadConfig();

  return dependencies.runAddCommand(args, {
    config,
    isTty: dependencies.stdin.isTTY,
    stderr: dependencies.stderr,
    stdin: dependencies.stdin,
    stdout: dependencies.stdout,
  });
}

async function runRemoveCommand(
  args: string[],
  dependencies: CliDependencies,
): Promise<number> {
  if (isHelpFlag(args[0])) {
    writeLine(dependencies.stdout, getRemoveHelpText());
    return 0;
  }

  if (!args[0]) {
    throw new CliCommandError("Plugin ID is required", {
      helpText: getRemoveHelpText(),
    });
  }

  const config = await dependencies.loadConfig();

  return dependencies.runRemoveCommand(args, {
    config,
    isTty: dependencies.stdin.isTTY,
    stderr: dependencies.stderr,
    stdin: dependencies.stdin,
    stdout: dependencies.stdout,
  });
}

async function runListCommand(
  args: string[],
  dependencies: CliDependencies,
): Promise<number> {
  if (isHelpFlag(args[0])) {
    writeLine(dependencies.stdout, getListHelpText());
    return 0;
  }

  const config = await dependencies.loadConfig();

  return dependencies.runListCommand(args, {
    config,
    stdout: dependencies.stdout,
  });
}

async function runTestPluginCommand(
  args: string[],
  dependencies: CliDependencies,
): Promise<number> {
  if (isHelpFlag(args[0])) {
    writeLine(dependencies.stdout, getTestPluginHelpText());
    return 0;
  }

  const pluginDirectory = args[0];

  if (!pluginDirectory) {
    throw new CliCommandError("Plugin directory is required", {
      helpText: getTestPluginHelpText(),
    });
  }

  const result = await dependencies.validatePluginDirectory(pluginDirectory);
  writeLine(dependencies.stdout, JSON.stringify(result, null, 2));
  return result.valid ? 0 : 1;
}

const commandHandlers: Record<string, CliCommandHandler> = {
  add: runAddCommand,
  list: runListCommand,
  remove: runRemoveCommand,
  serve: runServeCommand,
  "test-plugin": runTestPluginCommand,
};

export async function runCli(
  argv = process.argv.slice(2),
  dependencies: CliDependencies = defaultCliDependencies,
): Promise<number> {
  const [command, ...args] = argv;

  if (!command) {
    return runServeCommand(args, dependencies);
  }

  if (isHelpFlag(command)) {
    return runHelpCommand(args, dependencies);
  }

  if (command === "--version") {
    return runVersionCommand(args, dependencies);
  }

  const handler = commandHandlers[command];

  if (!handler) {
    writeLine(dependencies.stderr, `Unknown command: ${command}`);
    writeLine(dependencies.stderr, getCliHelpText());
    return 1;
  }

  try {
    return await handler(args, dependencies);
  } catch (error) {
    if (error instanceof CliCommandError || error instanceof CommandError) {
      writeLine(dependencies.stderr, error.message);

      if (error.helpText) {
        writeLine(dependencies.stderr, error.helpText);
      }

      return error.exitCode;
    }

    throw error;
  }
}

function isServeMode(argv: string[]): boolean {
  const command = argv[0];
  return !command || command === "serve";
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const serve = isServeMode(argv);

  runCli(argv)
    .then((exitCode) => {
      if (serve) {
        return;
      }
      process.exit(exitCode);
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `Fatal: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exit(1);
    });
}
