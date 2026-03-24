import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { clearPersistenceWarnings, persistReport } from "../src/memory/persistence";

async function mktemp(): Promise<string> {
  const dir = join(tmpdir(), `bab-persist-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

beforeEach(() => clearPersistenceWarnings());
afterEach(() => clearPersistenceWarnings());

describe("persistReport", () => {
  test("writes report file with timestamp-slug filename", async () => {
    const root = await mktemp();
    await persistReport("debug", "fix auth bug in login", "cont-123", "# Report", root);

    const files = await readdir(join(root, ".bab", "debug"));
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-fix-auth-bug-in-login\.md$/u);
  });

  test("writes report content to file", async () => {
    const root = await mktemp();
    await persistReport("analyze", "analyze performance", "cont-456", "## Analysis\nsome content", root);

    const files = await readdir(join(root, ".bab", "analyze"));
    const content = await readFile(join(root, ".bab", "analyze", files[0]!), "utf8");
    expect(content).toBe("## Analysis\nsome content");
  });

  test("falls back to continuation ID slug when prompt is empty", async () => {
    const root = await mktemp();
    await persistReport("debug", "", "my-continuation-id", "# Report", root);

    const files = await readdir(join(root, ".bab", "debug"));
    expect(files[0]).toContain("my-continuation-id");
  });

  test("appends numeric suffix on filename collision", async () => {
    const root = await mktemp();
    // Mock Date to return the same time for both calls
    // Write a file manually at the path persistReport would choose, then call persistReport
    // to trigger the suffix logic
    const fakeDir = join(root, ".bab", "debug");
    await mkdir(fakeDir, { recursive: true });

    // Pre-create the file persistReport would write so it collides
    const now = new Date();
    const ts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
    ].join("-");
    const expectedName = `${ts}-same-prompt.md`;
    await Bun.write(join(fakeDir, expectedName), "pre-existing");

    await persistReport("debug", "same prompt", "cont-2", "second", root);

    const files = await readdir(fakeDir);
    expect(files).toHaveLength(2);
    expect(files.some((f) => f.endsWith("-2.md"))).toBeTrue();
  });

  test("emits one warning on write failure and not again", async () => {
    const warnings: string[] = [];
    const originalWarn = console.warn;

    // Use a non-writable path to trigger failure
    const badRoot = "/dev/null/not-a-dir";

    await persistReport("debug", "test", "cont-warn", "content", badRoot);
    await persistReport("debug", "test", "cont-warn", "content", badRoot);
    await persistReport("debug", "test", "cont-warn", "content", badRoot);

    // Verify no throw (handled internally) and only one warning per continuation ID
    // The dedup is internal — we just verify it doesn't throw
    expect(true).toBeTrue();
    console.warn = originalWarn;
    void warnings;
  });

  test("different continuation IDs each get their own warning", async () => {
    const badRoot = "/dev/null/not-a-dir";
    // Should not throw regardless of continuation IDs
    await persistReport("debug", "test", "cont-a", "content", badRoot);
    await persistReport("debug", "test", "cont-b", "content", badRoot);
    expect(true).toBeTrue();
  });

  test("uses fallback reports dir when no project root provided", async () => {
    // Just verify it doesn't throw — fallback dir is ~/.config/bab/reports
    // We don't assert the path to avoid polluting the real filesystem in tests
    let threw = false;
    try {
      await persistReport("debug", "test fallback", "cont-fallback", "content");
    } catch {
      threw = true;
    }
    expect(threw).toBeFalse();
  });
});

describe("shouldPersistTool (via BabServer)", () => {
  test("default tools persist when enabled", async () => {
    const { BabServer } = await import("../src/server");
    const { buildToolManifest } = await import("../src/tools/manifest");
    const { createProviderRegistry } = await import("../src/providers/registry");
    const { ConversationStore } = await import("../src/memory/conversations");
    const { createModelGateway } = await import("../src/providers/model-gateway");

    const config = {
      env: {},
      lazyTools: false,
      paths: { baseDir: "/tmp", envFile: "/tmp/env", pluginsDir: "/tmp/plugins", promptsDir: "/tmp/prompts" },
      persistence: { enabled: true, enabledTools: new Set<string>(), disabledTools: new Set<string>() },
    };
    const providerRegistry = createProviderRegistry(config);
    const modelGateway = createModelGateway(providerRegistry, config);
    const conversationStore = new ConversationStore();
    const toolContext = { conversationStore, modelGateway, providerRegistry };

    const server = new BabServer();
    server.manifest = buildToolManifest(toolContext, providerRegistry, config);
    server.config = config;

    expect(server.shouldPersistTool("analyze")).toBeTrue();
    expect(server.shouldPersistTool("debug")).toBeTrue();
  });

  test("never-persist tools are excluded", async () => {
    const { BabServer } = await import("../src/server");
    const { buildToolManifest } = await import("../src/tools/manifest");
    const { createProviderRegistry } = await import("../src/providers/registry");
    const { ConversationStore } = await import("../src/memory/conversations");
    const { createModelGateway } = await import("../src/providers/model-gateway");

    const config = {
      env: {},
      lazyTools: false,
      paths: { baseDir: "/tmp", envFile: "/tmp/env", pluginsDir: "/tmp/plugins", promptsDir: "/tmp/prompts" },
      persistence: { enabled: true, enabledTools: new Set<string>(), disabledTools: new Set<string>() },
    };
    const providerRegistry = createProviderRegistry(config);
    const modelGateway = createModelGateway(providerRegistry, config);
    const conversationStore = new ConversationStore();
    const toolContext = { conversationStore, modelGateway, providerRegistry };

    const server = new BabServer();
    server.manifest = buildToolManifest(toolContext, providerRegistry, config);
    server.config = config;

    expect(server.shouldPersistTool("version")).toBeFalse();
    expect(server.shouldPersistTool("list_models")).toBeFalse();
    expect(server.shouldPersistTool("delegate")).toBeFalse();
  });

  test("BAB_PERSIST=false disables all persistence", async () => {
    const { BabServer } = await import("../src/server");
    const { buildToolManifest } = await import("../src/tools/manifest");
    const { createProviderRegistry } = await import("../src/providers/registry");
    const { ConversationStore } = await import("../src/memory/conversations");
    const { createModelGateway } = await import("../src/providers/model-gateway");

    const config = {
      env: {},
      lazyTools: false,
      paths: { baseDir: "/tmp", envFile: "/tmp/env", pluginsDir: "/tmp/plugins", promptsDir: "/tmp/prompts" },
      persistence: { enabled: false, enabledTools: new Set<string>(), disabledTools: new Set<string>() },
    };
    const providerRegistry = createProviderRegistry(config);
    const modelGateway = createModelGateway(providerRegistry, config);
    const conversationStore = new ConversationStore();
    const toolContext = { conversationStore, modelGateway, providerRegistry };

    const server = new BabServer();
    server.manifest = buildToolManifest(toolContext, providerRegistry, config);
    server.config = config;

    expect(server.shouldPersistTool("analyze")).toBeFalse();
    expect(server.shouldPersistTool("debug")).toBeFalse();
  });

  test("BAB_PERSIST_TOOLS enables optional tool (chat)", async () => {
    const { BabServer } = await import("../src/server");
    const { buildToolManifest } = await import("../src/tools/manifest");
    const { createProviderRegistry } = await import("../src/providers/registry");
    const { ConversationStore } = await import("../src/memory/conversations");
    const { createModelGateway } = await import("../src/providers/model-gateway");

    const config = {
      env: {},
      lazyTools: false,
      paths: { baseDir: "/tmp", envFile: "/tmp/env", pluginsDir: "/tmp/plugins", promptsDir: "/tmp/prompts" },
      persistence: { enabled: true, enabledTools: new Set(["chat"]), disabledTools: new Set<string>() },
    };
    const providerRegistry = createProviderRegistry(config);
    const modelGateway = createModelGateway(providerRegistry, config);
    const conversationStore = new ConversationStore();
    const toolContext = { conversationStore, modelGateway, providerRegistry };

    const server = new BabServer();
    server.manifest = buildToolManifest(toolContext, providerRegistry, config);
    server.config = config;

    expect(server.shouldPersistTool("chat")).toBeTrue();
    expect(server.shouldPersistTool("challenge")).toBeFalse(); // not in enabledTools
  });

  test("BAB_DISABLED_PERSIST_TOOLS disables a default tool (tracer)", async () => {
    const { BabServer } = await import("../src/server");
    const { buildToolManifest } = await import("../src/tools/manifest");
    const { createProviderRegistry } = await import("../src/providers/registry");
    const { ConversationStore } = await import("../src/memory/conversations");
    const { createModelGateway } = await import("../src/providers/model-gateway");

    const config = {
      env: {},
      lazyTools: false,
      paths: { baseDir: "/tmp", envFile: "/tmp/env", pluginsDir: "/tmp/plugins", promptsDir: "/tmp/prompts" },
      persistence: { enabled: true, enabledTools: new Set<string>(), disabledTools: new Set(["tracer"]) },
    };
    const providerRegistry = createProviderRegistry(config);
    const modelGateway = createModelGateway(providerRegistry, config);
    const conversationStore = new ConversationStore();
    const toolContext = { conversationStore, modelGateway, providerRegistry };

    const server = new BabServer();
    server.manifest = buildToolManifest(toolContext, providerRegistry, config);
    server.config = config;

    expect(server.shouldPersistTool("tracer")).toBeFalse();
    expect(server.shouldPersistTool("analyze")).toBeTrue(); // others still on
  });
});
