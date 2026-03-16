# Lazy Tool Loading

## Problem

Bab registers all 17 tools eagerly on startup. Every tool's name, description, and full JSON schema is sent to the client on `tools/list`. For LLM-based clients (Claude Code, Copilot, etc.), this bloats the system prompt context — most sessions only use 2-3 tools.

## Solution

Opt-in lazy mode (`BAB_LAZY_TOOLS=1`). On startup, register only essential + one meta-tool. Remaining tools auto-load transparently on first `callTool`, or explicitly via the `tools` meta-tool. Client is notified via `tools/list_changed`.

## Design

### New concept: Tool Manifest

A map of tool name → `{ description, category, factory }` built from existing `createXxxTool` factories. Cheap — no schemas materialized, no tools instantiated until needed.

```ts
interface ToolManifestEntry {
  name: string;
  description: string;
  category: ToolCategory;
  factory: () => RegisteredTool;
}

type ToolCategory = "analysis" | "generation" | "review" | "planning" | "delegation" | "info";
```

Categories (explicit per-entry, not inferred):
- `analysis`: analyze, debug, tracer, secaudit
- `generation`: testgen, docgen, refactor
- `review`: codereview, precommit, challenge
- `planning`: planner, thinkdeep, consensus
- `delegation`: delegate, chat
- `info`: version, list_models

### Startup behavior

| Mode | Behavior |
|------|----------|
| Default (`BAB_LAZY_TOOLS` unset) | Register all tools eagerly (current behavior, no breaking change) |
| `BAB_LAZY_TOOLS=1` | Register only always-loaded tools + `tools` meta-tool |

**Always-loaded tools** (registered in lazy mode):
- `version` — lightweight, useful for diagnostics
- `delegate` — primary tool, frequently used
- `secaudit` — security is always relevant
- `analyze` — common entry point for most tasks
- `tools` — meta-tool for discovery and activation (lazy mode only)

### Auto-load on callTool

When `handleCallToolRequest` receives a call for an unregistered tool name:
1. Check if the name exists in the manifest
2. If yes: load from manifest (concurrency-safe), execute the call, send `tools/list_changed`
3. If no: return "unknown tool" error (existing behavior)

This makes lazy loading **transparent** — the LLM doesn't need to call `tools` first. It can call any tool directly after discovering it via `tools`. The `tools` meta-tool is a convenience for browsing what's available and pre-loading before complex workflows.

**Concurrency-safe loading**: Use a `loadingPromises: Map<string, Promise<RegisteredTool>>` to coalesce concurrent loads for the same tool, preventing double registration.

```ts
async loadFromManifest(name: string): Promise<RegisteredTool | null> {
  if (this.toolRegistry.has(name)) return this.toolRegistry.get(name)!;
  const existing = this.loadingPromises.get(name);
  if (existing) return existing;
  const entry = this.manifest.get(name);
  if (!entry) return null;
  const promise = Promise.resolve(entry.factory());
  this.loadingPromises.set(name, promise);
  const tool = await promise;
  this.registerTool(tool);
  this.loadingPromises.delete(name);
  return tool;
}
```

### The `tools` meta-tool

A single deep meta-tool replacing the earlier `list_available` + `activate` split.

**Input schema:**
```ts
z.object({
  activate: z.array(z.string()).optional(),       // tool names to load
  activate_category: z.string().optional(),        // load all tools in a category
  activate_all: z.boolean().optional(),            // load everything
})
```

**Behavior:**
- `tools()` — no args: list all tools with `{ name, description, category, loaded }`
- `tools({ activate: ["codereview", "testgen"] })` — load specific tools, return results + full listing
- `tools({ activate_category: "analysis" })` — load all tools in a category
- `tools({ activate_all: true })` — load everything

**Output** always includes the full tool listing so the LLM has context. When activating, also includes `{ loaded: string[], already_loaded: string[] }`.

**Graceful degradation note**: When tools are activated, include in output: "If your client doesn't auto-refresh tools after list_changed, you may need to re-fetch the tool list."

### Server changes

1. Declare `listChanged` capability: `tools: { listChanged: true }` (both modes — harmless in eager mode)
2. Store `manifest: Map<string, ToolManifestEntry>` on `BabServer`
3. Store `loadingPromises: Map<string, Promise<RegisteredTool>>` for concurrency safety
4. Add `BabServer.loadFromManifest(name): Promise<RegisteredTool | null>` — concurrency-safe load
5. Add `BabServer.sendToolListChanged()` wrapper around `protocolServer.sendToolListChanged()`
6. Modify `handleCallToolRequest`: if tool not in registry, try `loadFromManifest` before returning error

### Config changes

- Add `BAB_LAZY_TOOLS` to env schema in `src/config.ts`
- `BAB_DISABLED_TOOLS` filters the manifest — disabled tools never appear in `tools` or auto-load

### Interaction with existing features

- `BAB_DISABLED_TOOLS` filters manifest before build — disabled tools invisible everywhere (including auto-load — returns not_found)
- Skills/prompts remain eagerly loaded (lightweight)
- `toolContext` (modelGateway, conversationStore, providerRegistry) created at startup regardless — factories capture via closure
- `CORE_TOOL_NAMES` updated to include `tools`

## Steps

1. Add `BAB_LAZY_TOOLS` to env schema in `src/config.ts`
2. Create `src/tools/manifest.ts` — `ToolManifestEntry` type, `ToolCategory` type, `buildToolManifest()` fn (category defined per-entry)
3. Refactor `registerCoreTools` in `src/server.ts` to build manifest first, then register from it
4. Add `listChanged: true` to server capabilities in `BabServer` constructor
5. Add `BabServer.manifest`, `BabServer.loadingPromises`, `BabServer.loadFromManifest()`, `BabServer.sendToolListChanged()`
6. Modify `handleCallToolRequest` to auto-load from manifest on unknown tool (concurrency-safe)
7. Create `src/tools/tools/index.ts` — `createToolsTool(server)` (the single meta-tool)
8. Wire lazy mode in `registerCoreTools`: if `BAB_LAZY_TOOLS=1`, register only always-loaded + meta-tool
9. Tests: lazy mode registers only 5 tools, `tools()` lists all, `tools({ activate })` registers + notifies, auto-load on callTool works, concurrent auto-load coalesces
10. Add context-size benchmark test: measure total JSON schema bytes in eager vs lazy mode
11. Update `CORE_TOOL_NAMES` to include `tools`
12. Docs: update README / changelog
