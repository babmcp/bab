import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { logger } from "../utils/logger";

const FALLBACK_REPORTS_DIR = join(homedir(), ".config", "bab", "reports");

/** Continuation IDs for which a persistence warning has already been emitted. */
const warnedIds = new Set<string>();

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .slice(0, 50);
}

function buildFilename(promptText: string, continuationId: string): string {
  const now = new Date();
  const timestamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
  ].join("-");

  const slug = toSlug(promptText) || continuationId;
  return `${timestamp}-${slug}.md`;
}

async function resolveTargetPath(
  toolName: string,
  filename: string,
  projectRoot?: string,
): Promise<string> {
  const base = projectRoot ?? FALLBACK_REPORTS_DIR;
  const dir = join(base, ".bab", toolName);
  await mkdir(dir, { recursive: true });

  const target = join(dir, filename);

  // Avoid overwriting existing files — append numeric suffix
  let candidate = target;
  let suffix = 2;
  while (await Bun.file(candidate).exists()) {
    const baseName = target.replace(/\.md$/u, "");
    candidate = `${baseName}-${suffix}.md`;
    suffix++;
  }

  return candidate;
}

/**
 * Persist a tool result report to <projectRoot>/.bab/<toolName>/<timestamp>-<slug>.md.
 * Falls back to ~/.config/bab/reports/ when no project root is available.
 * Never throws — all errors are logged as warnings (once per continuation ID).
 */
export async function persistReport(
  toolName: string,
  promptText: string,
  continuationId: string,
  content: string,
  projectRoot?: string,
): Promise<void> {
  try {
    const filename = buildFilename(promptText, continuationId);
    const targetPath = await resolveTargetPath(toolName, filename, projectRoot);
    await writeFile(targetPath, content, "utf8");
    logger.debug("Persistence report written", { continuationId, path: targetPath, tool: toolName });
  } catch (error) {
    if (!warnedIds.has(continuationId)) {
      warnedIds.add(continuationId);
      logger.warn("Failed to persist report", {
        continuationId,
        error: error instanceof Error ? error.message : String(error),
        tool: toolName,
      });
    }
  }
}

/** Clear the warned IDs set — exposed for testing only. */
export function clearPersistenceWarnings(): void {
  warnedIds.clear();
}
