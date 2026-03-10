# Milestone 1 — MCP Server Core + delegate + Utilities

status: completed
progress: 9/9
last_updated: 2026-03-10
last_task: M1-T09
blocked_by: none
unlocks: m2_claude_plugin, m3_codex_plugin, m4_copilot_plugin, m5_opencode_plugin, m6_core_tools

---

## Goal

Build the MCP server shell, delegate plugin infrastructure, and utility tools. After this milestone, the server starts, discovers plugins, and exposes delegate + utility tools via MCP.

Exit criteria: `bun run src/server.ts` starts an MCP server that responds to list_tools (delegate, listmodels, version) and can load plugin manifests from disk. Test harness can spawn server and validate tool calls.

---

## Tasks

### M1-T01: Project scaffold
- [ ] Init Bun project (package name: bab)
- [ ] tsconfig.json, biome.json, package.json
- [ ] Pin @modelcontextprotocol/sdk to latest stable (check npm before starting)
- [ ] Dependencies: @modelcontextprotocol/sdk, ai, zod, zod-to-json-schema, yaml
- [ ] Directory structure: src/, src/types/, src/tools/, src/delegate/, src/providers/, src/memory/, src/utils/, src/prompts/
- [ ] Config dir: ~/.config/bab/ with env, plugins/, prompts/
- [ ] src/config.ts — load env from ~/.config/bab/env (dotenv style), fall back to process.env
- [ ] Config dir auto-creation on first run (mkdir -p for plugins/ and prompts/)
- [ ] src/utils/logger.ts — structured logger to stderr with levels (debug, info, warn, error)
- Output: `bun build` compiles with zero errors, config dir resolves correctly
- Deps: none
- Status: completed

### M1-T02: Core types (Zod schemas)
- [ ] src/types/tools.ts — ToolOutput, ContinuationOffer, ToolError, Result<T,E>
- [ ] src/types/events.ts — 5 delegate event types (output, tool_activity, progress, error, done) with common metadata (run_id, provider_id, timestamp)
- [ ] src/types/roles.ts — RoleDefinition, built-in role names (default, planner, codereviewer, coding)
- [ ] src/types/manifest.ts — Plugin manifest schema (id, name, version, command, roles, capabilities, delegate_api_version)
- [ ] src/types/providers.ts — ModelCapabilities, ModelInfo
- [ ] Unit tests: schema validation edge cases, JSON schema generation
- Output: all types compile, Zod schemas generate valid JSON schemas
- Deps: M1-T01
- Status: completed

### M1-T03: MCP server shell
- [ ] src/server.ts — @modelcontextprotocol/sdk Server over stdio
- [ ] Tool registry: Map<string, Tool>
- [ ] list_tools handler: generates MCP schemas from Zod via zod-to-json-schema
- [ ] call_tool handler: routes to tool.execute(), returns TextContent
- [ ] Graceful shutdown on SIGTERM/SIGINT
- [ ] All logs via logger (stderr only, stdout = MCP protocol)
- [ ] Unit tests: tool registration, list_tools response shape, call_tool routing
- Output: server starts, responds to list_tools with empty tool list
- Deps: M1-T01, M1-T02
- Status: completed

### M1-T04: Provider registry (Vercel AI SDK)
- [ ] src/providers/registry.ts — thin wrapper around AI SDK
- [ ] Configure providers from env vars (GOOGLE_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY, CUSTOM_API_URL)
- [ ] Static model registry: known models per provider with capabilities metadata
- [ ] listModels(): return models from static registry, filtered by which providers have API keys configured
- [ ] generateText(model, prompt, systemPrompt, options): unified call via AI SDK
- [ ] Model capabilities metadata (context_window, supports_thinking, score)
- [ ] Token counting: chars/4 heuristic for v1 (src/utils/tokens.ts)
- [ ] Unit tests: env-gated provider filtering, model capability lookup, generateText mock
- Output: can list models and generate text with at least one provider
- Deps: M1-T01, M1-T02
- Status: completed

### M1-T05: delegate plugin system
- [ ] src/delegate/discovery.ts — scan ~/.config/bab/plugins/ for manifest.yaml
- [ ] src/delegate/loader.ts — parse YAML, validate with Zod, load adapter.ts via Bun.Transpiler (for compiled binary compat)
- [ ] src/delegate/roles.ts — role resolution engine (plugin > built-in > error)
- [ ] src/delegate/process-runner.ts — spawn CLI subprocess, pipe stdin, capture stdout/stderr, timeout (30min default), SIGTERM/SIGKILL escalation, accepts cwd option
- [ ] Extract built-in prompts from code/pal-mcp-server/systemprompts/clink/ -> src/prompts/delegate/default.txt, planner.txt, codereviewer.txt, coding.txt
- [ ] Plugin adapter interface: discover(), validate(), run(prompt, role), cancel()
- [ ] Plugins are TS source files (Bun imports .ts natively)
- [ ] Skip invalid plugins with stderr warning
- [ ] Unit tests: manifest validation, role resolution, discovery with mock dirs, process runner timeout/signal handling
- Output: plugin system loads manifests and validates adapters
- Deps: M1-T02
- Status: completed

### M1-T06: delegate MCP tool
- [ ] src/tools/delegate/ — MCP tool that bridges to delegate plugins
- [ ] Schema: prompt (required), cli_name, role (defaults to "default"), working_directory (optional, defaults to process.cwd())
- [ ] Execute: resolve plugin -> resolve role -> call adapter.run() -> collect events -> format ToolOutput
- [ ] Output limiting (20k chars), summary extraction (<SUMMARY> tags), truncation with excerpt
- [ ] Error handling: unknown plugin, unknown role, adapter failure, timeout
- [ ] done event exactly-once guarantee
- [ ] Unit tests: output limiting, summary extraction, error cases
- Output: delegate tool registered in MCP server, callable via call_tool
- Deps: M1-T03, M1-T05
- Status: completed

### M1-T07: Utility tools
- [ ] src/tools/listmodels/ — list available models from provider registry (static registry, env-gated)
- [ ] src/tools/version/ — server version, runtime info (Bun version, OS)
- Output: 2 utility tools registered and working
- Deps: M1-T03, M1-T04
- Status: completed

### M1-T08: Memory system
- [ ] src/memory/interface.ts — StorageAdapter interface (get, set, delete, list)
- [ ] src/memory/memory.ts — in-memory implementation
- [ ] src/memory/conversations.ts — conversation thread management (create, addTurn, getThread, 20 turn limit)
- [ ] Cross-tool continuation via continuation_id
- [ ] Unit tests: thread CRUD, 20 turn limit, continuation_id lookup, StorageAdapter contract
- Output: memory system works, conversations persist within process
- Deps: M1-T02
- Status: completed

### M1-T09: Test harness
- [ ] tests/harness.ts — spawns MCP server, sends tool calls, validates responses
- [ ] Reusable for all future plugin and tool e2e tests
- [ ] Supports: list_tools validation, call_tool with assertions, shutdown
- [ ] Integration test: server starts, lists tools (delegate, listmodels, version), shuts down cleanly
- Output: reusable test harness + passing integration test
- Deps: M1-T03
- Status: completed
