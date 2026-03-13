# Milestone 8 — Polish + Distribution

status: completed
progress: 3/3
last_updated: 2026-03-10
last_task: M8-T03
blocked_by: m7_specialized_tools, m2_claude_plugin, m3_codex_plugin, m4_copilot_plugin, m5_opencode_plugin
unlocks: none (final milestone)

---

## Goal

Single binary distribution, plugin SDK, documentation.

Exit criteria: a user can install the binary, drop plugins in config dir, and run the MCP server.

---

## Tasks

### M8-T01: Distribution
- [ ] Primary: npm package (`npx bab` or global install)
- [ ] Stretch: `bun build --compile src/server.ts` -> single executable
- [ ] Config dir: ~/.config/bab/
      - env (or .env) for API keys
      - plugins/ for delegate plugins
      - prompts/ for custom prompt overrides
- [ ] Loads env from config dir
- [ ] Discovers plugins from config dir
- [ ] Install script or brew formula (stretch)
- Output: distributable package (binary is bonus)
- Deps: M1-T03
- Status: completed

### M8-T02: Plugin SDK
- [ ] Published types package (npm or local)
- [ ] Adapter interface, event types, manifest schema
- [ ] Test utilities (mock process runner, event validator)
- [ ] Plugin conformance test: `<binary> test-plugin ./my-plugin/`
- Output: plugin authors can create plugins without reading server source
- Deps: M1-T05
- Status: completed

### M8-T03: Documentation
- [ ] Getting started: install + configure
- [ ] Plugin authoring: create a config plugin in 5 minutes
- [ ] Adapter tutorial: custom parsing
- [ ] Tool reference: all tools with schemas
- Output: docs/ directory
- Deps: M8-T01, M8-T02
- Status: completed
