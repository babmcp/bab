import { join } from "node:path";

import { assertPathContainment } from "../utils/path";
import { parseEnvFile } from "../config";

/** Vars that can inject code into spawned processes. */
const RUNTIME_INJECTION_VARS = [
  "LD_PRELOAD",
  "LD_LIBRARY_PATH",
  "DYLD_INSERT_LIBRARIES",
  "DYLD_LIBRARY_PATH",
  "NODE_OPTIONS",
  "NODE_PATH",
  "BUN_OPTIONS",
] as const;

const FILE_ENV_DENYLIST = new Set([
  ...RUNTIME_INJECTION_VARS,
  "HOME",
  "PWD",
  "PATH",
  "SHELL",
  "USER",
  "LOGNAME",
  "NODE_EXTRA_CA_CERTS",
  "GIT_SSH_COMMAND",
  "GIT_ASKPASS",
  "GIT_DIR",
  "GIT_WORK_TREE",
  "http_proxy",
  "https_proxy",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "no_proxy",
  "NO_PROXY",
  "SSL_CERT_FILE",
  "SSL_CERT_DIR",
  "REQUESTS_CA_BUNDLE",
  "CURL_CA_BUNDLE",
]);

/** Env var prefixes stripped from the merged env before passing to delegates. */
const PROCESS_ENV_STRIP_PREFIXES = ["CLAUDE_", "CLAUDECODE"];

/** Dangerous env vars stripped from process env before passing to delegates. */
const DELEGATE_ENV_DENYLIST: Set<string> = new Set(RUNTIME_INJECTION_VARS);

function isFileEnvDenied(key: string): boolean {
  return FILE_ENV_DENYLIST.has(key) || key.startsWith("BAB_");
}

export function currentProcessEnv(
  processEnv:
    | NodeJS.ProcessEnv
    | Record<string, string | undefined> = process.env,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(processEnv).filter((entry): entry is [string, string] => {
      const [, value] = entry;
      return value !== undefined;
    }),
  );
}

export function sanitizeFileEnv(
  values: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => !isFileEnvDenied(key)),
  );
}

export async function readPluginEnv(
  directory: string,
): Promise<Record<string, string>> {
  const envPath = join(directory, "env");

  try {
    const realEnvPath = await assertPathContainment(envPath, directory, "env");
    const contents = await Bun.file(realEnvPath).text();
    return parseEnvFile(contents, { source: envPath });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

export function mergeEnv(
  processEnv: NodeJS.ProcessEnv | Record<string, string | undefined>,
  globalEnv: Record<string, string>,
  pluginEnv: Record<string, string>,
): Record<string, string> {
  const base = currentProcessEnv(processEnv);

  for (const key of Object.keys(base)) {
    if (
      PROCESS_ENV_STRIP_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
      DELEGATE_ENV_DENYLIST.has(key)
    ) {
      delete base[key];
    }
  }

  return {
    ...base,
    ...sanitizeFileEnv(globalEnv),
    ...sanitizeFileEnv(pluginEnv),
  };
}
