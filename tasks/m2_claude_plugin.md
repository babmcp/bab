# Milestone 2 — Claude Code Plugin

status: completed
progress: 2/2
last_updated: 2026-03-10
last_task: M2-T02
blocked_by: m1_mcp_server_core
unlocks: none (independent)

---

## Goal

First delegate plugin end-to-end. Claude Code adapter parses JSON output, handles error recovery, supports roles.

Exit criteria: delegate tool sends a prompt through Claude Code CLI, gets back parsed output matching ClaudeJSONParser behavior.

---

## Tasks

### M2-T01: Claude Code adapter
- [ ] Study code/pal-mcp-server/delegate/agents/claude.py
- [ ] Study code/pal-mcp-server/delegate/parsers/claude.py
- [ ] Study code/pal-mcp-server/conf/cli_clients/claude.json
- [ ] Study code/pal-mcp-server/systemprompts/delegate/ for role prompts
- [ ] plugins/claude/manifest.yaml: id=claude, command=claude, roles (default, planner, codereviewer)
- [ ] plugins/claude/adapter.ts:
      - discover(): return provider info + available roles
      - validate(): check `claude` binary via Bun.which()
      - run(prompt, role): build command (claude --print --output-format json + --append-system-prompt for role)
      - Parse JSON output -> output event (content) + done event (metadata)
      - Extract: result text, model_used, duration_ms, usage, session_id
      - Error recovery: if non-zero exit but output parseable, recover content
      - cancel(): kill subprocess
- [ ] plugins/claude/prompts/ — role prompt files
- Output: working Claude Code plugin
- Deps: M1-T05, M1-T06
- Status: completed

### M2-T02: Claude Code e2e test
- [ ] Uses test harness (M1-T09) to run prompt through Claude Code
- [ ] Verify: output matches ClaudeJSONParser behavior
- [ ] Verify: role-based prompt injection works
- [ ] Verify: error recovery works (non-zero exit with parseable output)
- [ ] Verify: done event metadata (model_used, usage, duration)
- Output: passing e2e test
- Deps: M2-T01, M1-T09
- Status: completed
