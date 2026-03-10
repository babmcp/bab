# Bab — Task Index

## Dependency Graph

```
M1 (MCP Server Core)
├── M2 (Claude Plugin) ─────┐
├── M3 (Codex Plugin) ──────┤
├── M4 (Copilot Plugin) ────┼── all parallel after M1
├── M5 (OpenCode Plugin) ───┤
├── M6 (Core Tools) ────────┘
│   └── M7 (Specialized Tools)
│
├── M8 (Polish) ── after M7 + all plugins done
│
└── M9 (Plugin Env & Install) ── after M8
    ├── Phase 0: T01 (CLI routing)
    ├── Phase 1: T02→T03→T04→T05→T06 (env files)
    ├── Phase 2: T07→T08→T09→T10 (install)  ── parallel with Phase 1 after T01
    ├── Phase 3: T11, T12 (stretch)          ── after Phase 2
    └── Phase 4: T13→T14 (extract plugins)   ── after T06 + T10 (env frozen + install verified)
```

Notes:
- M1-M8 complete.
- M9 Phase 1 and Phase 2 can run in parallel after T01 (CLI routing).
- M9 Phase 3 (remove, list) is stretch — depends on Phase 2.
- M9 Phase 4 (extract) requires BOTH T06 (env frozen) AND T10 (install verified).

---

## Milestones

| # | Milestone | Status | Progress | Blocked By | Unlocks |
|---|-----------|--------|----------|------------|---------|
| M1 | MCP Server Core | completed | 9/9 | — | M2, M3, M4, M5, M6 |
| M2 | Claude Plugin | completed | 2/2 | M1 | M8 |
| M3 | Codex Plugin | completed | 2/2 | M1 | M8 |
| M4 | Copilot Plugin | completed | 3/3 | M1 | M8 |
| M5 | OpenCode Plugin | completed | 3/3 | M1 | M8 |
| M6 | Core Tools | completed | 6/6 | M1 | M7 |
| M7 | Specialized Tools | completed | 3/3 | M6 | M8 |
| M8 | Polish | completed | 3/3 | M7 + all plugins | — |
| M9 | Plugin Env & Install | completed | 14/14 | M8 | — |

---

## Tasks

### M1 — MCP Server Core

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| M1-T01 | Project scaffold | — | completed |
| M1-T02 | Core types (Zod schemas) | M1-T01 | completed |
| M1-T03 | MCP server shell | M1-T01, M1-T02 | completed |
| M1-T04 | Provider registry (Vercel AI SDK) | M1-T01, M1-T02 | completed |
| M1-T05 | delegate plugin system | M1-T02 | completed |
| M1-T06 | delegate MCP tool | M1-T03, M1-T05 | completed |
| M1-T07 | Utility tools | M1-T03, M1-T04 | completed |
| M1-T08 | Memory system | M1-T02 | completed |
| M1-T09 | Test harness | M1-T03 | completed |

### M2 — Claude Plugin

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| M2-T01 | Claude Code adapter | M1-T05, M1-T06 | completed |
| M2-T02 | Claude Code e2e test | M2-T01, M1-T09 | completed |

### M3 — Codex Plugin

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| M3-T01 | Codex adapter | M1-T05, M1-T06 | completed |
| M3-T02 | Codex e2e test | M3-T01, M1-T09 | completed |

### M4 — Copilot Plugin

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| M4-T01 | Copilot CLI research | — (can start anytime) | completed |
| M4-T02 | Copilot plugin | M4-T01, M1-T05 | completed |
| M4-T03 | Copilot e2e test | M4-T02, M1-T09 | completed |

### M5 — OpenCode Plugin

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| M5-T01 | OpenCode CLI research | — (can start anytime) | completed |
| M5-T02 | OpenCode plugin | M5-T01, M1-T05 | completed |
| M5-T03 | OpenCode e2e test | M5-T02, M1-T09 | completed |

### M6 — Core Tools

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| M6-T01 | Tool framework | M1-T03, M1-T04, M1-T08 | completed |
| M6-T02 | chat tool | M6-T01 | completed |
| M6-T03 | thinkdeep tool | M6-T01 | completed |
| M6-T04 | codereview tool | M6-T01 | completed |
| M6-T05 | planner tool | M6-T01 | completed |
| M6-T06 | consensus tool | M6-T01 | completed |

### M7 — Specialized Tools

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| M7-T01 | Investigation tools (debug, analyze, tracer) | M6-T01 | completed |
| M7-T02 | Code transformation tools (refactor, testgen, docgen) | M6-T01 | completed |
| M7-T03 | Review tools (secaudit, precommit, challenge) | M6-T01 | completed |

### M8 — Polish

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| M8-T01 | Distribution | M1-T03 | completed |
| M8-T02 | Plugin SDK | M1-T05 | completed |
| M8-T03 | Documentation | M8-T01, M8-T02 | completed |

### M9 — Plugin Env & Install

| Task | Description | Deps | Status |
|------|-------------|------|--------|
| M9-T01 | CLI subcommand routing (add/remove/list/help) | — | completed |
| M9-T02 | Env merge utility (denylist, precedence) | — | completed |
| M9-T03 | Loader reads plugin env (internal type, cached) | M9-T02 | completed |
| M9-T04 | Delegate passes merged env to adapter | M9-T02, M9-T03 | completed |
| M9-T05 | Adapters use input.env as final subprocess env | M9-T04 | completed |
| M9-T06 | Env tests (precedence, denylist, malformed) | M9-T05 | completed |
| M9-T07 | Source parser (org/repo, SSH, URL, #ref) | — | completed |
| M9-T08 | Install core (atomic, multi-plugin, staging) | M9-T07 | completed |
| M9-T09 | Wire `bab add` CLI command | M9-T01, M9-T08 | completed |
| M9-T10 | Install tests (discovery, atomicity, conflicts) | M9-T09 | completed |
| M9-T11 | `bab remove` (confirm, refuse bundled) | M9-T09 | completed |
| M9-T12 | `bab list` (bundled + installed, source info) | M9-T09 | completed |
| M9-T13 | Create bab-plugins repo (claude, codex, copilot) | M9-T06, M9-T10 | completed |
| M9-T14 | Remove extracted plugins from bab | M9-T13 | completed |
