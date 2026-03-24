# Persistence Logging Plan

## Goal

Define how Bab should log the persistence feature without mixing operational logs with persisted thread reports.

## Decisions

- Keep operational logs in `~/.config/bab/logs/` as they are now.
- Keep persisted thread reports in `<project_root>/.bab/<tool>/<timestamp>-<slug>.md`.
- Do not merge operational logging and persisted report storage.

## Report Location

Reports are saved at the project root inside `.bab/`:
```
<project_root>/.bab/<tool>/<timestamp>-<slug>.md
```
- **Filename**: `YYYY-MM-DD-HH-mm` timestamp + slugified prompt prefix (first ~50 chars)
  - e.g. `.bab/debug/2026-03-24-14-13-fix-auth-bug-in-login.md`
  - Fallback to continuation ID if prompt is empty or slug generation fails
- Project root is determined from MCP roots provided by the calling host.
- Fallback: `~/.config/bab/reports/` when no project root is available.

## Module Ownership

- **Persistence writer**: new module `src/memory/persistence.ts`
  - Owns all `.bab/` directory creation and file writes
  - Accepts tool name, prompt text (for slug), continuation ID (fallback), and report content
  - Handles errors internally (never throws to caller)
- **Eligibility**: three tiers per tool in manifest
  - `persist: default` — always persists
  - `persist: optional` — only persists when listed in `BAB_PERSIST_TOOLS`
  - `persist: never` — never persists
- **Config**:
  - `BAB_PERSIST=false` disables all persistence globally
  - `BAB_PERSIST_TOOLS` — comma-separated optional tools to enable (added to defaults)
    - e.g. `BAB_PERSIST_TOOLS=chat,precommit` → defaults + chat + precommit
    - If empty/unset: persist only `default` tools
  - `BAB_DISABLED_PERSIST_TOOLS` — comma-separated tools to disable from defaults
    - e.g. `BAB_DISABLED_PERSIST_TOOLS=tracer,consensus` → defaults minus those two

## Tool Persistence Tiers

**Default** (always persist):
`analyze`, `debug`, `secaudit`, `codereview`, `refactor`, `planner`, `thinkdeep`, `consensus`, `tracer`

**Optional** (persist when listed in `BAB_PERSIST_TOOLS`):
`testgen`, `docgen`, `precommit`, `chat`, `challenge`

**Never**:
`delegate`, `version`, `list_models`

## Logging Behavior

- Log one startup/debug summary of effective persistence config:
  - persistence enabled or disabled
  - default tools, enabled optional tools, disabled tools
- Log one warning when report persistence fails for a thread:
  - tool name, continuation ID, target path, error code/message
  - Dedup: module-scoped `Set<string>` of warned continuation IDs, cleared on process restart
- Do not fail the tool call if `.bab/` write fails.
- Do not log sensitive payload bodies by default:
  - no embedded file contents
  - no full prompts
  - no full expert or internal analysis
- Log only persistence metadata events:
  - thread created
  - thread updated
  - persistence skipped (disabled or tool not eligible)

## Test Coverage

- Verify one warning is emitted on write failure.
- Verify write failures do not spam repeated warnings for the same continuation ID.
- Verify `persist: never` tools do not write files or emit persistence-write logs.
- Verify `BAB_PERSIST=false` disables all report writes.
- Verify `BAB_PERSIST_TOOLS=chat` enables persistence for `chat`.
- Verify `BAB_DISABLED_PERSIST_TOOLS=tracer` disables persistence for `tracer`.
- Verify fallback to `~/.config/bab/reports/` when no project root is available.

## TODO

- Define the report `.md` format (content structure, sections, metadata) as a follow-up plan.
