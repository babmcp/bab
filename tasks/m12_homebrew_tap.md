# M12 — Homebrew Tap

status: in-progress
progress: 3/4
last_updated: 2026-03-12
last_task: M12-T03
blocked_by: —
unlocks: m13_install_script (brew fallback)

---

Plan: `plans/20260312_144500_homebrew_tap.md`

Repo: `git@github.com:babmcp/homebrew-tap.git`
Local: `/Users/zaher/Developer/codex/brew-cask`

No files in the bab repo. All work in the homebrew-tap repo.

## Tasks

### M12-T01: Init homebrew-tap repo
- [x] Init repo at `/Users/zaher/Developer/codex/brew-cask`
- [x] Push to `babmcp/homebrew-tap`
- [x] Add `Formula/bab.rb` with placeholder version/hashes
- [x] Include `bottle :unneeded`, `license "MIT"`, hardcoded binary filename per platform
- Output: repo with formula skeleton
- Deps: none (can start with placeholders)
- Status: completed

### M12-T02: Auto-update workflow
- [x] `.github/workflows/update-formula.yml` in homebrew-tap repo
- [x] Listens for `repository_dispatch` event
- [x] Reads version + checksums from payload (via env vars, not direct interpolation)
- [x] Rewrites `Formula/bab.rb` in-place with python (no template duplication)
- [x] Validates semver format and hex checksums
- [x] Commits + pushes
- Output: auto-update pipeline
- Deps: M12-T01, M11-T01 (release workflow sends dispatch)
- Status: completed

### M12-T03: Auth setup
- [x] Create fine-grained PAT scoped ONLY to `babmcp/homebrew-tap` (contents: write)
- [x] Add as secret `HOMEBREW_TAP_TOKEN` in `babmcp/bab`
- [x] Wire into release workflow's `repository_dispatch` step (done in M11)
- Output: secure cross-repo auth
- Deps: M12-T02
- Status: completed

### M12-T04: Test and document
- [ ] Test: `brew tap babmcp/tap && brew install bab && bab --version`
- [ ] Document in bab README: installation via Homebrew
- Output: verified brew install path
- Deps: M12-T03, first real release published
- Status: pending (needs a real release)
