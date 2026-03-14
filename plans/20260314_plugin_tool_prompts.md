# Plugin Tool Prompts

## Goal
Allow plugins to provide custom system prompts for workflow tools (codereview, debug, thinkdeep, etc.) via text files. Falls back to built-in prompts when not provided.

## Manifest Example
```yaml
id: copilot
name: GitHub Copilot CLI
version: 0.1.0
command: copilot
roles:
  - name: default
    inherits: default
tool_prompts:
  codereview: prompts/codereview.txt
  debug: prompts/debug.txt
  secaudit: prompts/secaudit.txt
```

## Behavior
- Plugin provides `tool_prompts.<tool_name>: <path>` -> use that file as system prompt (replaces built-in)
- Key not present -> fall back to built-in from `src/prompts/*.ts`
- Path must be relative to plugin directory (same containment check as role prompt_file)
- Prompt file contents cached at plugin load time (read once, validate once)

## Design Decisions (from review)

### Prompt resolution lives in ModelGateway, not tools
The gateway already knows the plugin (parses `pluginId/modelName`), has config, and resolves the model.
Putting resolution in tools would leak plugin ID parsing into the tool layer (information leakage).
Adding `toolName` to `ModelGateway.query()` options keeps plugin knowledge contained.

### No ToolContext change needed
Gateway already has `config` via constructor. No need to expose config to all tools.

### Consensus gets it for free
Each `modelGateway.query()` call resolves the correct plugin prompt per model automatically.
No special wiring needed for consensus.

### Cache at load time
Read and store prompt file contents when loading the plugin manifest.
Eliminates redundant file reads on every tool call and runtime path containment checks.

### Full replacement, not inheritance
Built-in prompts are 2-3 lines. Plugin authors provide their own complete prompt.
Plugin authors who want the base text can copy it.

## Steps

### 1. Add `tool_prompts` to manifest schema + cache at load time
**File:** `src/types/manifest.ts`
- Add `tool_prompts: z.record(z.string(), z.string()).optional()` to `PluginManifestSchema`

**File:** `src/delegate/loader.ts`
- After parsing manifest, validate all `tool_prompts` file paths exist and pass containment check
- Read file contents, store as `resolvedToolPrompts: Record<string, string>` on `LoadedPlugin`

**File:** `src/delegate/types.ts`
- Add `resolvedToolPrompts?: Record<string, string>` to `LoadedPlugin`

### 2. Add `toolName` to ModelGateway and resolve prompts
**File:** `src/providers/model-gateway.ts`
- Add optional `toolName?: string` to `ModelQueryOptions`
- In `queryViaDelegate`, after resolving plugin, check `plugin.resolvedToolPrompts?.[toolName]`
- If found, use plugin prompt instead of the passed-in systemPrompt
- SDK models: no change, use systemPrompt as-is

### 3. Pass toolName through tool calls
**File:** `src/tools/workflow/runner.ts`
- Pass `toolName: this.config.name` in options to `generateText` / `modelGateway.query()`

**File:** `src/tools/simple.ts`
- Pass `toolName: name` in options

**File:** `src/tools/consensus/index.ts`
- Pass `toolName: "consensus"` in `modelGateway.query()` calls

### 4. Tests
- Manifest with tool_prompts parses correctly
- Manifest without tool_prompts still works (optional)
- Loader reads + caches prompt file contents at load time
- Path containment rejects escaping paths
- ModelGateway uses plugin prompt when available for delegate models
- ModelGateway uses default systemPrompt for SDK models
- ModelGateway uses default systemPrompt when tool_prompts key missing
