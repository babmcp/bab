# Bab (باب) — TypeScript MCP Server

## Product Requirements Document (PRD) v2.0

Status: Approved for implementation
Date: 2026-03-10
Revised: 2026-03-10 (v2.0 — full TS rewrite replacing PAL)

---

## Problem

pal-mcp-server (Python) is not owned by us. We depend on it for:
- **CLI bridging** (clink) — hardcoded to 3 providers, can't add new ones without PRs
- **AI tools** (chat, thinkdeep, consensus, codereview, etc.) — any bugs or changes require waiting or forking
- **Provider routing** — 7 hand-rolled provider classes we can't extend

We've already had to fork once to add Copilot support. New CLI agents appear regularly (OpenCode, etc.). We need to own the full stack.

## Solution

Build a standalone **TypeScript/Bun MCP server** that replaces pal-mcp-server entirely. Three phases:

1. **Phase 1**: delegate (CLI bridging with plugin system) + utility tools
2. **Phase 2**: Core tools (chat, thinkdeep, codereview, planner, consensus)
3. **Phase 3**: Specialized tools (debug, analyze, refactor, testgen, secaudit, docgen, tracer, precommit)

### Tech Stack
- **Runtime**: Bun
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **AI Providers**: Vercel AI SDK (`ai`) — 20+ providers, one interface
- **Validation**: Zod (+ zod-to-json-schema for MCP schemas)
- **CLI bridging**: Plugin system with manifest + optional adapter
- **Memory**: StorageAdapter interface (in-memory default, file/redis later)

### Distribution
Single compiled Bun binary. All config loaded from `~/.bab/`:
- `env` — API keys and settings
- `plugins/` — delegate CLI plugins (manifest.yaml + adapter.ts)
- `prompts/` — custom prompt overrides (optional)

User installs binary, creates config dir, drops in plugins and env file. No runtime dependencies.

### Architecture
```
MCP Client (Claude Code, Codex, etc.)
  |
  | stdio JSON-RPC (MCP protocol)
  v
Single Binary (compiled Bun)
  ├── Config loaded from ~/.bab/env
  ├── Tool Registry
  │     ├── delegate (CLI bridging via plugins)
  │     ├── chat, thinkdeep, codereview, ... (AI tools)
  │     └── listmodels, version (utilities)
  ├── Provider Router (Vercel AI SDK)
  │     └── Google, OpenAI, Anthropic, Ollama, OpenRouter, ...
  ├── Memory (StorageAdapter)
  │     └── Conversation threads, continuation IDs
  └── Delegate Plugin System
        ├── ~/.bab/plugins/claude/
        ├── ~/.bab/plugins/codex/
        ├── ~/.bab/plugins/copilot/
        └── ~/.bab/plugins/opencode/
```

## Goals

- Own the full stack — no upstream dependency on pal-mcp-server
- Plugin architecture for CLI providers — add new CLIs without touching server source
- Vercel AI SDK for all AI providers — one interface, 20+ providers
- Extensible role system — plugins define their own roles with custom prompts
- Feature parity with PAL tools we use (chat, thinkdeep, codereview, planner, consensus)
- Composition over inheritance — no mixin magic
- Result types over exceptions — explicit error handling

## Non-Goals (v1)

- Full parity with all 18 PAL tools on day one (phased approach)
- Plugin marketplace or registry
- Plugin sandboxing
- Streaming for delegate (batch capture first, streaming opt-in later)
- Windows support (macOS focus)

## Key Design Decisions

### Vercel AI SDK replaces provider layer
PAL has 7 hand-rolled provider classes (~2,500 lines). Vercel AI SDK provides unified `generateText()`/`streamText()` with `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/xai`, `ollama-ai-provider`, etc. We keep a thin registry for model capabilities metadata but delegate all API calls to the SDK.

### Zod replaces Pydantic + SchemaBuilder
All request/response types defined as Zod schemas. `zod-to-json-schema` generates MCP input schemas automatically. No custom schema builder needed.

### Composition over inheritance
PAL uses `WorkflowTool(BaseTool, BaseWorkflowMixin)` — implicit coupling. TS rewrite uses `WorkflowRunner` that takes `Tool` + `Provider` as injected dependencies.

### Result types over exceptions
PAL uses `raise ToolExecutionError(json_string)` for control flow. TS rewrite returns `Result<ToolOutput, ToolError>` discriminated unions.

### StorageAdapter for memory
PAL's in-memory conversation store breaks across restarts. Define `StorageAdapter` interface with `get/set/delete`. In-memory for dev, file-based or Redis for production.

### Extensible role system (delegate)
- Built-in roles: `default`, `planner`, `codereviewer`, `coding`
- Plugins declare custom roles in manifest with prompt paths + optional args
- Resolution: plugin role > built-in role > error
- `run.role` is a role **name** only (not arbitrary prompt override)
- `coding` role: delegates actual coding/implementation tasks to CLI agents

### Single run at a time (delegate)
Each delegate execution is isolated. Single concurrent run for v1. Include `run_id` for future concurrency.

## Phase 1: delegate + Utilities

### delegate (CLI bridging)
- Plugin discovery from `~/.bab/plugins/`
- Plugin types: config (zero code) and adapter (TypeScript)
- Plugins authored as `.ts` — loaded at runtime via `Bun.Transpiler` (works inside compiled binary)
- Manifest includes: id, name, version, command, roles, capabilities
- Manifest includes: `delegate_api_version` for compatibility
- Process runner: spawn CLI, pipe prompt to stdin, capture stdout/stderr, timeout
- Role resolution engine with built-in + plugin roles
- 5 event types: output, tool_activity, progress, error, done
- All events carry: run_id, provider_id, timestamp
- `done` event guaranteed exactly-once (including on cancel/error)
- All delegate logs go to stderr (stdout reserved for MCP)

### Target CLI Providers (in order)
1. Claude Code — JSON output, `--print --output-format json`
2. Codex — JSONL output, `exec --json`
3. Copilot — research needed, must verify headless mode
4. OpenCode — research needed, must verify headless mode

### Utility Tools
- `listmodels` — enumerate available AI models from Vercel AI SDK
- `version` — server version and runtime info

## Phase 2: Core Tools

- `chat` — AI chat with conversation memory and continuation
- `thinkdeep` — extended reasoning workflow with expert analysis
- `codereview` — multi-step code review workflow
- `planner` — interactive sequential planning workflow
- `consensus` — multi-model consensus via structured debate

All workflow tools use WorkflowRunner (composition pattern, not mixin).

## Phase 3: Specialized Tools

- `debug`, `analyze`, `refactor`, `testgen`, `secaudit`, `docgen`, `tracer`, `precommit`, `challenge`

## Success Criteria

### Phase 1
- MCP server starts, responds to list_tools/call_tool
- delegate tool runs prompts through Claude Code plugin with correct parsed output
- delegate tool runs prompts through Codex, Copilot, OpenCode plugins
- New delegate plugin can be created by dropping files in ~/.bab/plugins/ — no server changes
- listmodels, version tools work
- Roles resolve correctly (built-in + plugin-defined + custom)

### Phase 2
- chat, thinkdeep, codereview, planner, consensus tools work with conversation memory
- Workflow tools use composition pattern (WorkflowRunner)
- Feature parity with PAL for these 5 tools

### Phase 3
- Remaining specialized tools ported
- Full feature parity with PAL tools we use
