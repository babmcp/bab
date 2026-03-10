import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { parseEnvFile } from "../src/config";
import { loadPlugin, loadPlugins } from "../src/delegate/loader";
import { mergeEnv, readPluginEnv } from "../src/utils/env";

describe("env utilities", () => {
  test("parseEnvFile reports malformed lines with a filename and line number", () => {
    expect(() =>
      parseEnvFile("BROKEN LINE", { source: "/tmp/example.env" }),
    ).toThrow("/tmp/example.env: line 1: expected KEY=VALUE assignment");
  });

  test("readPluginEnv returns an empty map when the env file is missing", async () => {
    const pluginDirectory = await mkdtemp(
      join(tmpdir(), "bab-plugin-env-missing-"),
    );

    expect(await readPluginEnv(pluginDirectory)).toEqual({});
  });

  test("readPluginEnv accepts duplicate keys and empty values", async () => {
    const pluginDirectory = await mkdtemp(join(tmpdir(), "bab-plugin-env-"));

    await writeFile(
      join(pluginDirectory, "env"),
      ["FOO=one", "FOO=two", "EMPTY="].join("\n"),
    );

    expect(await readPluginEnv(pluginDirectory)).toEqual({
      EMPTY: "",
      FOO: "two",
    });
  });

  test("mergeEnv applies precedence and denylists file-based overrides", () => {
    const processEnv = {
      BAB_RESERVED: "process-kept",
      GLOBAL_ONLY: "process",
      PATH: "/usr/bin",
      SHARED: "process",
    };
    const globalEnv = {
      BAB_RESERVED: "global-blocked",
      GLOBAL_ONLY: "global",
      PATH: "/blocked-global",
      SHARED: "global",
    };
    const pluginEnv = {
      BAB_PLUGIN_PRIVATE: "plugin-blocked",
      PATH: "/blocked-plugin",
      PLUGIN_ONLY: "plugin",
      SHARED: "plugin",
    };

    const merged = mergeEnv(processEnv, globalEnv, pluginEnv);

    expect(merged.BAB_RESERVED).toBe("process-kept");
    expect(merged.BAB_PLUGIN_PRIVATE).toBeUndefined();
    expect(merged.GLOBAL_ONLY).toBe("global");
    expect(merged.PATH).toBe("/usr/bin");
    expect(merged.PLUGIN_ONLY).toBe("plugin");
    expect(merged.SHARED).toBe("plugin");
    expect(globalEnv.PATH).toBe("/blocked-global");
    expect(pluginEnv.PATH).toBe("/blocked-plugin");
  });
});

describe("delegate loader env integration", () => {
  test("loadPlugin includes parsed plugin env on the internal record", async () => {
    const pluginDirectory = await mkdtemp(join(tmpdir(), "bab-loader-env-"));

    await writeFile(
      join(pluginDirectory, "manifest.yaml"),
      [
        "id: echo-env",
        "name: Echo Env",
        "version: 1.0.0",
        "command: echo",
        "roles:",
        "  - default",
      ].join("\n"),
    );
    await writeFile(join(pluginDirectory, "env"), "PLUGIN_TOKEN=secret\n");

    const loaded = await loadPlugin({
      directory: pluginDirectory,
      manifestPath: join(pluginDirectory, "manifest.yaml"),
    });

    expect(loaded.env).toEqual({
      PLUGIN_TOKEN: "secret",
    });
  });

  test("loadPlugins skips plugins with malformed env files", async () => {
    const pluginsRoot = await mkdtemp(join(tmpdir(), "bab-loader-bad-env-"));
    const pluginDirectory = join(pluginsRoot, "broken");

    await mkdir(pluginDirectory, { recursive: true });
    await writeFile(
      join(pluginDirectory, "manifest.yaml"),
      [
        "id: broken-env",
        "name: Broken Env",
        "version: 1.0.0",
        "command: echo",
        "roles:",
        "  - default",
      ].join("\n"),
    );
    await writeFile(join(pluginDirectory, "env"), "BROKEN LINE\n");

    const loaded = await loadPlugins([
      {
        directory: pluginDirectory,
        manifestPath: join(pluginDirectory, "manifest.yaml"),
      },
    ]);

    expect(loaded).toHaveLength(0);
  });
});
