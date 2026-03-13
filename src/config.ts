import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { currentProcessEnv, sanitizeFileEnv } from "./utils/env";

const CONFIG_ROOT_DIR = ".config";
const CONFIG_DIR_NAME = "bab";

export interface BabConfigPaths {
  baseDir: string;
  envFile: string;
  pluginsDir: string;
  promptsDir: string;
}

export interface BabConfig {
  env: Record<string, string>;
  paths: BabConfigPaths;
}

export interface ParseEnvFileOptions {
  source?: string;
}

const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/u;

export function getConfigPaths(homeDirectory = homedir()): BabConfigPaths {
  const baseDir = join(homeDirectory, CONFIG_ROOT_DIR, CONFIG_DIR_NAME);

  return {
    baseDir,
    envFile: join(baseDir, "env"),
    pluginsDir: join(baseDir, "plugins"),
    promptsDir: join(baseDir, "prompts"),
  };
}

function normalizeEnvValue(rawValue: string): string {
  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function parseEnvFile(
  contents: string,
  options: ParseEnvFileOptions = {},
): Record<string, string> {
  const parsed: Record<string, string> = {};
  const source = options.source ?? "env";
  const lines = contents.split(/\r?\n/u);

  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const normalizedLine = line.startsWith("export ")
      ? line.slice("export ".length).trim()
      : line;
    const separatorIndex = normalizedLine.indexOf("=");

    if (separatorIndex <= 0) {
      throw new Error(
        `${source}: line ${index + 1}: expected KEY=VALUE assignment`,
      );
    }

    const key = normalizedLine.slice(0, separatorIndex).trim();
    const value = normalizedLine.slice(separatorIndex + 1);

    if (!ENV_KEY_PATTERN.test(key)) {
      throw new Error(
        `${source}: line ${index + 1}: invalid environment variable name "${key}"`,
      );
    }

    parsed[key] = normalizeEnvValue(value);
  }

  return parsed;
}

export async function ensureConfigDirectories(
  paths = getConfigPaths(),
): Promise<BabConfigPaths> {
  await mkdir(paths.baseDir, { recursive: true });
  await Promise.all([
    mkdir(paths.pluginsDir, { recursive: true }),
    mkdir(paths.promptsDir, { recursive: true }),
  ]);

  return paths;
}

async function readConfigEnvFile(
  envFile: string,
): Promise<Record<string, string>> {
  try {
    const contents = await Bun.file(envFile).text();
    return parseEnvFile(contents, { source: envFile });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

export async function loadConfig(homeDirectory?: string): Promise<BabConfig> {
  const paths = await ensureConfigDirectories(getConfigPaths(homeDirectory));
  const fileEnv = await readConfigEnvFile(paths.envFile);
  const processEnv = currentProcessEnv();

  return {
    env: {
      ...sanitizeFileEnv(fileEnv),
      ...processEnv,
    },
    paths,
  };
}
