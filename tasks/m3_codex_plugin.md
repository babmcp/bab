# Milestone 3 — Codex Plugin

status: completed
progress: 2/2
last_updated: 2026-03-10
last_task: M3-T02
blocked_by: m1_mcp_server_core
unlocks: none (independent)

---

## Goal

Second delegate plugin. Codex uses JSONL output (different from Claude's JSON), validating the adapter interface handles different output formats.

Exit criteria: delegate tool sends a prompt through Codex CLI, gets back events matching CodexJSONLParser behavior.

---

## Tasks

### M3-T01: Codex adapter
- [ ] Study code/pal-mcp-server/delegate/agents/codex.py
- [ ] Study code/pal-mcp-server/delegate/parsers/codex.py
- [ ] Study code/pal-mcp-server/conf/cli_clients/codex.json
- [ ] plugins/codex/manifest.yaml: id=codex, command=codex, roles
- [ ] plugins/codex/adapter.ts:
      - Build command: codex exec --json + args
      - Parse JSONL: extract agent_message items -> output events, errors -> error events, usage -> done metadata
      - JSONL error recovery: parse even on non-zero exit
      - validate(): check `codex` binary
- [ ] Declare roles (default, planner, codereviewer)
- Output: working Codex plugin
- Deps: M1-T05, M1-T06
- Status: completed

### M3-T02: Codex e2e test
- [ ] Uses test harness (M1-T09) to run prompt through Codex
- [ ] Verify: output matches CodexJSONLParser behavior
- [ ] Verify: error recovery works
- [ ] Verify: role-based prompt resolution works
- Output: passing e2e test
- Deps: M3-T01, M1-T09
- Status: completed
