# M15 — Plugin Tool Prompts

**Status:** completed
**Progress:** 4/4
**Last Updated:** 2026-03-14
**Last Task:** M15-T04
**Plan:** `plans/20260314_plugin_tool_prompts.md`
**Branch:** `m15/plugin-tool-prompts`

## Goal
Allow plugins to provide custom system prompts for workflow tools via text files in their manifest. Falls back to built-in prompts when not provided.

## Tasks

### M15-T01: Manifest schema + loader caching
**Status:** completed | **Deps:** none

- Add `tool_prompts: z.record(z.string(), z.string()).optional()` to `PluginManifestSchema` in `src/types/manifest.ts`
- Add `resolvedToolPrompts?: Record<string, string>` to `LoadedPlugin` in `src/delegate/types.ts`
- In `src/delegate/loader.ts`: after parsing manifest, validate all `tool_prompts` paths exist and pass containment check, read file contents, store on `LoadedPlugin`

### M15-T02: ModelGateway toolName + prompt resolution
**Status:** completed | **Deps:** M15-T01

- Add `toolName?: string` to `ModelQueryOptions` in `src/providers/model-gateway.ts`
- In `queryViaDelegate`, after resolving the plugin, check `plugin.resolvedToolPrompts?.[toolName]`
- If found, use plugin prompt instead of passed-in `systemPrompt`
- SDK models unchanged — use systemPrompt as-is

### M15-T03: Wire toolName through tools
**Status:** completed | **Deps:** M15-T02

- `src/tools/workflow/runner.ts` — pass `toolName: this.config.name` in options to `generateText`
- `src/tools/simple.ts` — pass `toolName: name` in options
- `src/tools/consensus/index.ts` — pass `toolName: "consensus"` in `modelGateway.query()` calls

### M15-T04: Tests
**Status:** completed | **Deps:** M15-T03

- Manifest with tool_prompts parses correctly
- Manifest without tool_prompts still works (optional)
- Loader reads + caches prompt file contents at load time
- Path containment rejects escaping paths
- ModelGateway uses plugin prompt when available for delegate models
- ModelGateway uses default systemPrompt for SDK models
- ModelGateway uses default systemPrompt when tool_prompts key missing

## Exit Criteria
- Plugin manifests can declare `tool_prompts` mapping tool names to prompt files
- Plugin prompt files are validated and cached at load time
- When a tool uses a plugin model, the plugin's prompt replaces the built-in
- When a tool uses an SDK model or plugin has no prompt for that tool, built-in is used
- All tests pass
