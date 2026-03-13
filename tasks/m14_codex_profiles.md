# M14 — Codex Profile Support

status: completed
progress: 2/2
last_updated: 2026-03-12
last_task: M14-T02
blocked_by: none
unlocks: none

---

Plan: `plans/20260312_150000_codex_profiles.md`

Independent of M11-M13. Change made in `babmcp/plugins` repo.

## Tasks

### M14-T01: Add profile to ALLOWED_FLAGS
- [x] Add `"profile"` to `ALLOWED_FLAGS` in `bab-plugins/codex/adapter.ts`
- Output: `--profile` flag flows through to codex exec
- Deps: none
- Status: completed

### M14-T02: Test
- [x] Verified: existing flag-to-arg loop handles string values → `--profile <value>`
- No test infrastructure in bab-plugins repo; change is a single Set entry addition
- Output: manually verified flow
- Deps: M14-T01
- Status: completed
