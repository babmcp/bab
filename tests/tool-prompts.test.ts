import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { PluginManifestSchema } from "../src/types";
import { discoverPluginDirectories } from "../src/delegate/discovery";
import { loadPlugin } from "../src/delegate/loader";

const BASE_MANIFEST = {
  id: "test-plugin",
  name: "Test Plugin",
  version: "1.0.0",
  command: "echo",
  roles: ["default"],
};

describe("tool_prompts manifest schema", () => {
  test("parses manifest with tool_prompts", () => {
    const parsed = PluginManifestSchema.parse({
      ...BASE_MANIFEST,
      tool_prompts: {
        codereview: "prompts/codereview.txt",
        debug: "prompts/debug.txt",
      },
    });

    expect(parsed.tool_prompts).toEqual({
      codereview: "prompts/codereview.txt",
      debug: "prompts/debug.txt",
    });
  });

  test("parses manifest without tool_prompts (optional)", () => {
    const parsed = PluginManifestSchema.parse(BASE_MANIFEST);

    expect(parsed.tool_prompts).toBeUndefined();
  });

  test("rejects tool_prompts with empty key or value", () => {
    expect(() =>
      PluginManifestSchema.parse({
        ...BASE_MANIFEST,
        tool_prompts: { "": "prompts/codereview.txt" },
      }),
    ).toThrow();

    expect(() =>
      PluginManifestSchema.parse({
        ...BASE_MANIFEST,
        tool_prompts: { codereview: "" },
      }),
    ).toThrow();
  });

  test("rejects tool_prompts with non-string values", () => {
    expect(() =>
      PluginManifestSchema.parse({
        ...BASE_MANIFEST,
        tool_prompts: { codereview: 42 },
      }),
    ).toThrow();
  });
});

describe("tool_prompts loader caching", () => {
  test("reads and caches prompt file contents at load time", async () => {
    const pluginsRoot = await mkdtemp(join(tmpdir(), "bab-tp-"));
    const pluginDir = join(pluginsRoot, "test-plugin");
    const promptsDir = join(pluginDir, "prompts");

    await mkdir(promptsDir, { recursive: true });
    await writeFile(
      join(promptsDir, "codereview.txt"),
      "You are a strict code reviewer for this plugin.",
    );
    await writeFile(
      join(promptsDir, "debug.txt"),
      "You are a debugging specialist for this plugin.",
    );
    await writeFile(
      join(pluginDir, "manifest.yaml"),
      [
        "id: test-plugin",
        "name: Test Plugin",
        "version: 1.0.0",
        "command: echo",
        "roles:",
        "  - default",
        "tool_prompts:",
        "  codereview: prompts/codereview.txt",
        "  debug: prompts/debug.txt",
      ].join("\n"),
    );

    const discovered = await discoverPluginDirectories(pluginsRoot);
    const loaded = await loadPlugin(discovered[0]!);

    expect(loaded.resolvedToolPrompts).toBeDefined();
    expect(loaded.resolvedToolPrompts!.codereview).toBe(
      "You are a strict code reviewer for this plugin.",
    );
    expect(loaded.resolvedToolPrompts!.debug).toBe(
      "You are a debugging specialist for this plugin.",
    );
  });

  test("resolvedToolPrompts is undefined when manifest has no tool_prompts", async () => {
    const pluginsRoot = await mkdtemp(join(tmpdir(), "bab-tp-none-"));
    const pluginDir = join(pluginsRoot, "no-prompts");

    await mkdir(pluginDir, { recursive: true });
    await writeFile(
      join(pluginDir, "manifest.yaml"),
      [
        "id: no-prompts",
        "name: No Prompts Plugin",
        "version: 1.0.0",
        "command: echo",
        "roles:",
        "  - default",
      ].join("\n"),
    );

    const discovered = await discoverPluginDirectories(pluginsRoot);
    const loaded = await loadPlugin(discovered[0]!);

    expect(loaded.resolvedToolPrompts).toBeUndefined();
  });

  test("rejects prompt file paths that escape plugin directory", async () => {
    const pluginsRoot = await mkdtemp(join(tmpdir(), "bab-tp-escape-"));
    const pluginDir = join(pluginsRoot, "escaper");
    const outsideDir = join(pluginsRoot, "outside");

    await mkdir(pluginDir, { recursive: true });
    await mkdir(outsideDir, { recursive: true });
    await writeFile(join(outsideDir, "evil.txt"), "malicious prompt");

    // Create a symlink inside the plugin dir that points outside
    await symlink(
      join(outsideDir, "evil.txt"),
      join(pluginDir, "evil-link.txt"),
    );

    await writeFile(
      join(pluginDir, "manifest.yaml"),
      [
        "id: escaper",
        "name: Escaper Plugin",
        "version: 1.0.0",
        "command: echo",
        "roles:",
        "  - default",
        "tool_prompts:",
        "  codereview: evil-link.txt",
      ].join("\n"),
    );

    const discovered = await discoverPluginDirectories(pluginsRoot);
    const loaded = await loadPlugin(discovered[0]!);

    // Bad prompt entry is skipped; plugin still loads
    expect(loaded.resolvedToolPrompts).toBeUndefined();
  });
});
