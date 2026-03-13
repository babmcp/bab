# Milestone 5 — OpenCode Plugin

status: completed
progress: 2/3
last_updated: 2026-03-10
last_task: M5-T03
blocked_by: m1_mcp_server_core
unlocks: none (independent)

---

## Goal

Fourth delegate plugin. NEW provider requiring research. OpenCode can use Ollama and potentially other backends.

Exit criteria: delegate tool runs a prompt through OpenCode CLI, gets back correctly parsed events.

---

## Tasks

### M5-T01: OpenCode CLI research
- [ ] How to invoke opencode CLI
- [ ] Output format: plain text? JSON?
- [ ] Args, prompt injection method
- [ ] Auth requirements
- [ ] **BLOCKING**: Does it have headless/auto-approve mode?
- [ ] PTY vs pipe: does it work with stdout as a pipe?
- [ ] What custom roles make sense? (e.g., researcher for deep search via Ollama)
- [ ] Decide: adapter or config plugin
- [ ] Document in plugins/opencode/RESEARCH.md
- Deps: none (can start anytime)
- Status: completed

### M5-T02: OpenCode plugin
- [ ] Implement based on research
- [ ] manifest.yaml + adapter.ts or config only
- [ ] Declare roles (built-in + opencode-specific custom roles)
- [ ] validate(): check binary + auth
- Output: plugins/opencode/
- Deps: M5-T01, M1-T05
- Status: completed

### M5-T03: OpenCode e2e test
- [ ] Uses test harness (M1-T09)
- [ ] Run prompt, verify events
- Output: passing e2e test
- Deps: M5-T02, M1-T09
- Status: completed
