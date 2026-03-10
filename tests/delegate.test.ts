import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { discoverPluginDirectories } from "../src/delegate/discovery";
import { loadPlugin, loadPlugins } from "../src/delegate/loader";
import { ProcessRunner } from "../src/delegate/process-runner";
import { resolveRole } from "../src/delegate/roles";

describe("delegate discovery and loading", () => {
  test("discovers plugin directories with manifest.yaml", async () => {
    const pluginsRoot = await mkdtemp(join(tmpdir(), "bab-plugins-"));
    const pluginDirectory = join(pluginsRoot, "example");

    await mkdir(pluginDirectory, { recursive: true });
    await writeFile(
      join(pluginDirectory, "manifest.yaml"),
      [
        "id: example",
        "name: Example Plugin",
        "version: 1.0.0",
        "command: example",
        "roles:",
        "  - default",
      ].join("\n"),
    );

    const discoveredPlugins = await discoverPluginDirectories(pluginsRoot);

    expect(discoveredPlugins).toHaveLength(1);
    expect(discoveredPlugins[0]?.manifestPath.endsWith("manifest.yaml")).toBeTrue();
  });

  test("skips invalid plugins while loading", async () => {
    const pluginsRoot = await mkdtemp(join(tmpdir(), "bab-invalid-plugins-"));
    const invalidPluginDirectory = join(pluginsRoot, "invalid");
    const validPluginDirectory = join(pluginsRoot, "valid");

    await mkdir(invalidPluginDirectory, { recursive: true });
    await mkdir(validPluginDirectory, { recursive: true });

    await writeFile(join(invalidPluginDirectory, "manifest.yaml"), "id: invalid");
    await writeFile(
      join(validPluginDirectory, "manifest.yaml"),
      [
        "id: valid",
        "name: Valid Plugin",
        "version: 1.0.0",
        "command: echo",
        "roles:",
        "  - default",
      ].join("\n"),
    );

    const discoveredPlugins = await discoverPluginDirectories(pluginsRoot);
    const loadedPlugins = await loadPlugins(discoveredPlugins);

    expect(loadedPlugins).toHaveLength(1);
    expect(loadedPlugins[0]?.manifest.id).toBe("valid");
  });

  test("skips plugins whose CLI command is not on PATH", async () => {
    const pluginsRoot = await mkdtemp(join(tmpdir(), "bab-missing-cli-"));
    const pluginDirectory = join(pluginsRoot, "missing");

    await mkdir(pluginDirectory, { recursive: true });
    await writeFile(
      join(pluginDirectory, "manifest.yaml"),
      [
        "id: missing",
        "name: Missing CLI Plugin",
        "version: 1.0.0",
        "command: nonexistent-cli-tool-xyz",
        "roles:",
        "  - default",
      ].join("\n"),
    );

    const discoveredPlugins = await discoverPluginDirectories(pluginsRoot);
    const loadedPlugins = await loadPlugins(discoveredPlugins);

    expect(loadedPlugins).toHaveLength(0);
  });

  test("loadPlugin throws with actionable message for missing CLI", async () => {
    const pluginDirectory = await mkdtemp(join(tmpdir(), "bab-throw-cli-"));

    await writeFile(
      join(pluginDirectory, "manifest.yaml"),
      [
        "id: ghost",
        "name: Ghost Plugin",
        "version: 1.0.0",
        "command: ghost-cli-not-installed",
        "roles:",
        "  - default",
      ].join("\n"),
    );

    await expect(
      loadPlugin({
        adapterPath: undefined,
        directory: pluginDirectory,
        manifestPath: join(pluginDirectory, "manifest.yaml"),
      }),
    ).rejects.toThrow(
      'Plugin "Ghost Plugin" requires CLI command "ghost-cli-not-installed" which was not found on PATH',
    );
  });

  test("loadPlugin succeeds when CLI command exists on PATH", async () => {
    const pluginDirectory = await mkdtemp(join(tmpdir(), "bab-valid-cli-"));

    await writeFile(
      join(pluginDirectory, "manifest.yaml"),
      [
        "id: valid-cli",
        "name: Valid CLI Plugin",
        "version: 1.0.0",
        "command: echo",
        "roles:",
        "  - default",
      ].join("\n"),
    );

    const loaded = await loadPlugin({
      adapterPath: undefined,
      directory: pluginDirectory,
      manifestPath: join(pluginDirectory, "manifest.yaml"),
    });

    expect(loaded.manifest.id).toBe("valid-cli");
    expect(loaded.manifest.command).toBe("echo");
  });
});

describe("delegate role resolution", () => {
  test("prefers plugin-defined roles over built-in prompts", async () => {
    const pluginDirectory = await mkdtemp(join(tmpdir(), "bab-role-plugin-"));

    await writeFile(join(pluginDirectory, "research.txt"), "Plugin research prompt");
    await writeFile(
      join(pluginDirectory, "manifest.yaml"),
      [
        "id: role-plugin",
        "name: Role Plugin",
        "version: 1.0.0",
        "command: echo",
        "roles:",
        "  - default",
        "  - name: planner",
        "    inherits: planner",
        "    prompt_file: research.txt",
      ].join("\n"),
    );

    const [plugin] = await loadPlugins([
      {
        adapterPath: undefined,
        directory: pluginDirectory,
        manifestPath: join(pluginDirectory, "manifest.yaml"),
      },
    ]);

    const resolvedRole = await resolveRole(plugin, "planner");

    expect(resolvedRole.source).toBe("plugin");
    expect(resolvedRole.prompt).toContain("Plugin research prompt");
    expect(resolvedRole.prompt).toContain("planning agent");
  });

  test("falls back to built-in roles when the plugin does not override them", async () => {
    const pluginDirectory = await mkdtemp(join(tmpdir(), "bab-role-builtin-"));

    await writeFile(
      join(pluginDirectory, "manifest.yaml"),
      [
        "id: builtin-plugin",
        "name: Builtin Plugin",
        "version: 1.0.0",
        "command: echo",
        "roles:",
        "  - default",
      ].join("\n"),
    );

    const [plugin] = await loadPlugins([
      {
        adapterPath: undefined,
        directory: pluginDirectory,
        manifestPath: join(pluginDirectory, "manifest.yaml"),
      },
    ]);
    const resolvedRole = await resolveRole(plugin, "default");

    expect(resolvedRole.source).toBe("built_in");
    expect(resolvedRole.prompt).toContain("external CLI agent");
  });
});

describe("ProcessRunner", () => {
  test("captures stdout and stderr", async () => {
    const runner = new ProcessRunner();
    const result = await runner.run("test-stdout", {
      args: [
        "-e",
        "console.log('hello'); console.error('oops');",
      ],
      command: "bun",
      timeoutMs: 1_000,
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("hello");
    expect(result.stderr).toContain("oops");
    expect(result.timedOut).toBeFalse();
  });

  test("terminates timed-out processes", async () => {
    const runner = new ProcessRunner();
    const result = await runner.run("test-timeout", {
      args: [
        "-e",
        "setTimeout(() => console.log('done'), 5000);",
      ],
      command: "bun",
      killGraceMs: 50,
      timeoutMs: 100,
    });

    expect(result.timedOut).toBeTrue();
    expect(result.exitCode === null || result.exitCode !== 0).toBeTrue();
  });
});
