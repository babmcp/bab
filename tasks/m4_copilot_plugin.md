# Milestone 4 — Copilot Plugin

status: completed
progress: 2/3
last_updated: 2026-03-10
last_task: M4-T03
blocked_by: m1_mcp_server_core
unlocks: none (independent)

---

## Goal

Third delegate plugin. NEW provider requiring research. Must verify headless/auto-approve mode exists.

Exit criteria: delegate tool runs a prompt through Copilot CLI, gets back correctly parsed events.

---

## Tasks

### M4-T01: Copilot CLI research
- [ ] How to invoke: `gh copilot suggest` / `gh copilot explain` or standalone?
- [ ] Output format: plain text? JSON? streaming?
- [ ] Args, prompt injection method (stdin, flag, positional)
- [ ] Auth: gh auth? API key?
- [ ] **BLOCKING**: Does it have headless/auto-approve mode? (required for unidirectional flow)
- [ ] PTY vs pipe: does it work with stdout as a pipe? (NO_COLOR, CI flags?)
- [ ] What roles make sense? (suggest/explain map to roles?)
- [ ] Decide: adapter or config plugin
- [ ] Document in plugins/copilot/RESEARCH.md
- Deps: none (can start anytime)
- Status: completed

### M4-T02: Copilot plugin
- [ ] Implement based on research
- [ ] manifest.yaml + adapter.ts (or config only)
- [ ] validate(): check binary + auth
- [ ] Declare roles (built-in + copilot-specific)
- Output: plugins/copilot/
- Deps: M4-T01, M1-T05
- Status: completed

### M4-T03: Copilot e2e test
- [ ] Uses test harness (M1-T09)
- [ ] Run prompt, verify events
- Output: passing e2e test
- Deps: M4-T02, M1-T09
- Status: completed
