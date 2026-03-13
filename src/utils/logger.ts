import { mkdirSync } from "node:fs";
import { createWriteStream, type WriteStream } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  configure,
  getJsonLinesFormatter,
  getLogger,
  getStreamSink,
  type LogLevel as LogTapeLevel,
  type LogRecord,
  type Sink,
} from "@logtape/logtape";
import { getRotatingFileSink } from "@logtape/file";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  [key: string]: unknown;
}

export interface WrappedLogger {
  debug(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
}

const LOGTAPE_LEVELS: Record<LogLevel, LogTapeLevel> = {
  debug: "debug",
  info: "info",
  warn: "warning",
  error: "error",
};

const LOGS_DIR = join(homedir(), ".config", "bab", "logs");
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 3;

function resolveLevel(): LogTapeLevel {
  const raw = process.env.BAB_LOG_LEVEL?.toLowerCase();
  if (raw && raw in LOGTAPE_LEVELS) {
    return LOGTAPE_LEVELS[raw as LogLevel];
  }
  return "info";
}

function wrap(category: string[]): WrappedLogger {
  const lt = getLogger(category);
  return {
    debug: (msg, ctx) => (ctx ? lt.with(ctx) : lt).debug(msg),
    error: (msg, ctx) => (ctx ? lt.with(ctx) : lt).error(msg),
    info: (msg, ctx) => (ctx ? lt.with(ctx) : lt).info(msg),
    warn: (msg, ctx) => (ctx ? lt.with(ctx) : lt).warn(msg),
  };
}

/**
 * A sink that routes client logs to per-plugin files based on the
 * third element of the log category: ["bab", "client", pluginId].
 */
function createPerClientFileSink(): Sink & Disposable {
  const formatter = getJsonLinesFormatter();
  const streams = new Map<string, WriteStream>();

  const sink = (record: LogRecord) => {
    const pluginId = record.category[2];
    if (!pluginId) return;

    let stream = streams.get(pluginId);
    if (!stream) {
      stream = createWriteStream(join(LOGS_DIR, `${pluginId}.log`), {
        flags: "a",
      });
      streams.set(pluginId, stream);
    }

    stream.write(formatter(record));
  };

  const dispose = (): void => {
    for (const stream of streams.values()) {
      stream.end();
    }
    streams.clear();
  };

  return Object.assign(sink, { [Symbol.dispose]: dispose });
}

/**
 * Initialise LogTape. Call once at startup before any logging.
 *
 * Log files in ~/.config/bab/logs/:
 *   - mcp.log — server lifecycle, tool calls, protocol events
 *   - <pluginId>.log — per-plugin delegate I/O (opencode.log, copilot.log, etc.)
 *
 * All logs also go to stderr as JSON lines.
 * Set BAB_CLIENT_LOG=false to disable client file logging.
 */
export async function configureLogging(): Promise<void> {
  mkdirSync(LOGS_DIR, { recursive: true });

  const level = resolveLevel();
  const formatter = getJsonLinesFormatter();

  const stderrSink = getStreamSink(
    new WritableStream({ write: (c: string) => void process.stderr.write(c) }),
    { formatter },
  );
  const mcpFileSink = getRotatingFileSink(join(LOGS_DIR, "mcp.log"), {
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    formatter,
  });

  const clientLogging = process.env.BAB_CLIENT_LOG?.toLowerCase() !== "false";

  const sinks: Record<string, Sink> = {
    stderr: stderrSink,
    mcpFile: mcpFileSink,
  };

  if (clientLogging) {
    sinks.clientFile = createPerClientFileSink();
  }

  await configure({
    sinks,
    loggers: [
      {
        category: ["bab", "mcp"],
        lowestLevel: level,
        sinks: ["stderr", "mcpFile"],
      },
      {
        category: ["bab", "client"],
        lowestLevel: level,
        sinks: clientLogging ? ["stderr", "clientFile"] : ["stderr"],
      },
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning" as LogTapeLevel,
        sinks: ["stderr"],
      },
    ],
  });
}

/** MCP server logger — server lifecycle, tool calls, protocol events. */
export const logger: WrappedLogger = wrap(["bab", "mcp"]);

/** Per-plugin client logger (e.g. opencode, copilot). Writes to <pluginId>.log */
export function getClientLogger(pluginId: string): WrappedLogger {
  return wrap(["bab", "client", pluginId]);
}
