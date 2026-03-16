# M16 — Lazy Tool Loading

**Status:** completed
**Progress:** 12/12
**Last Updated:** 2026-03-16
**Last Task:** M16-T12
**Plan:** `plans/20260316_lazy_tool_loading.md`
**Branch:** `m16/lazy-tool-loading`

## Goal
Opt-in lazy tool loading (`BAB_LAZY_TOOLS=1`) to reduce startup context. Only essential tools registered on startup; remaining tools auto-load on first call or via a `tools` meta-tool. Client notified via `tools/list_changed`.

## Tasks

### M16-T01: Add BAB_LAZY_TOOLS to env schema
**Status:** completed | **Deps:** none

- Add `BAB_LAZY_TOOLS` to env schema in `src/config.ts`
- Boolean-ish string: `"1"`, `"true"` → enabled; absent/other → disabled
- Expose as `config.env.BAB_LAZY_TOOLS` (or a parsed `config.lazyTools: boolean`)

### M16-T02: Create tool manifest module
**Status:** completed | **Deps:** none

- Create `src/tools/manifest.ts`
- Define `ToolCategory` type: `"analysis" | "generation" | "review" | "planning" | "delegation" | "info"`
- Define `ToolManifestEntry`: `{ name, description, category, factory: () => RegisteredTool }`
- Define `ALWAYS_LOADED_TOOLS`: `["version", "delegate", "secaudit", "analyze"]`
- Export `buildToolManifest(toolContext, config)` — returns `Map<string, ToolManifestEntry>` with all tools, category defined per-entry

### M16-T03: Refactor registerCoreTools to use manifest
**Status:** completed | **Deps:** M16-T02

- Refactor `registerCoreTools` in `src/server.ts` to build manifest via `buildToolManifest()`, then register from it
- Eager mode (default): iterate manifest, register all (preserves current behavior)
- No functional change yet — pure refactor, all existing tests must pass

### M16-T04: Add listChanged capability
**Status:** completed | **Deps:** none

- Change `tools: {}` → `tools: { listChanged: true }` in `BabServer` constructor capabilities
- Add `BabServer.sendToolListChanged()` wrapper that calls `this.protocolServer.sendToolListChanged()`
- Harmless in eager mode — no notifications sent if tool list doesn't change

### M16-T05: Add manifest + loadFromManifest to BabServer
**Status:** completed | **Deps:** M16-T03, M16-T04

- Add `manifest: Map<string, ToolManifestEntry>` to `BabServer`
- Add `loadingPromises: Map<string, Promise<RegisteredTool>>` for concurrency safety
- Add `loadFromManifest(name): Promise<RegisteredTool | null>` — check registry → check loadingPromises → check manifest → call factory → register → send listChanged → cleanup promise
- BAB_DISABLED_TOOLS entries excluded from manifest (already filtered)

### M16-T06: Auto-load on callTool
**Status:** completed | **Deps:** M16-T05

- Modify `handleCallToolRequest`: when tool not in registry, call `loadFromManifest(name)` before returning "unknown tool" error
- If manifest has it: load, execute, return result (transparent to caller)
- If manifest doesn't have it: return existing "unknown tool" error
- Send `tools/list_changed` after auto-load

### M16-T07: Create tools meta-tool
**Status:** completed | **Deps:** M16-T05

- Create `src/tools/tools/index.ts` — `createToolsTool(server: BabServer)`
- Input: `{ activate?: string[], activate_category?: string, activate_all?: boolean }`
- No args → list all tools: `{ name, description, category, loaded }[]`
- With activate args → load requested tools, return `{ loaded, already_loaded }` + full listing
- Include graceful degradation note in activation output
- Send `tools/list_changed` after activation

### M16-T08: Wire lazy mode in registerCoreTools
**Status:** completed | **Deps:** M16-T06, M16-T07

- If `BAB_LAZY_TOOLS` enabled: register only `ALWAYS_LOADED_TOOLS` + `tools` meta-tool from manifest
- Store full manifest on server for auto-load + meta-tool access
- If `BAB_LAZY_TOOLS` disabled (default): register all tools eagerly (current behavior)

### M16-T09: Unit + integration tests
**Status:** completed | **Deps:** M16-T08

- Lazy mode startup registers exactly 5 tools (version, delegate, secaudit, analyze, tools)
- `tools()` with no args lists all available tools with correct metadata
- `tools({ activate: ["chat"] })` registers chat tool + sends listChanged
- `tools({ activate_category: "review" })` loads codereview, precommit, challenge
- `tools({ activate_all: true })` loads everything
- Auto-load on callTool: calling unloaded tool transparently loads and executes
- Auto-load for disabled tool returns "unknown tool" error
- Eager mode still registers all tools (no regression)

### M16-T10: Concurrent auto-load test
**Status:** completed | **Deps:** M16-T09

- Simulate concurrent `callTool` for the same unloaded tool
- Verify tool is registered exactly once (no double-registration)
- Verify both calls succeed with correct results

### M16-T11: Context-size benchmark test
**Status:** completed | **Deps:** M16-T09

- Measure total JSON schema bytes from `handleListToolsRequest` in eager vs lazy mode
- Assert lazy mode payload is < 50% of eager mode payload
- Log both values for visibility

### M16-T12: Update CORE_TOOL_NAMES + docs
**Status:** completed | **Deps:** M16-T08

- Add `"tools"` to `CORE_TOOL_NAMES` in `src/server.ts`
- Update changelog
- Update README if it references tool count or startup behavior

## Exit Criteria
- Default mode (no env var): all tools registered eagerly, no behavior change
- `BAB_LAZY_TOOLS=1`: only 5 tools in initial `tools/list` response
- Any unloaded tool auto-loads transparently on `callTool`
- `tools` meta-tool lists all available tools and supports activation by name/category/all
- `tools/list_changed` sent after any dynamic registration
- Concurrent auto-loads are safe (no double registration)
- Lazy mode context payload < 50% of eager mode
- All tests pass in both modes
