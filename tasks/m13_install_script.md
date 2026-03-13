# M13 — Install Script

status: in-progress
progress: 2/3
last_updated: 2026-03-12
last_task: M13-T02
blocked_by: —
unlocks: none

---

Plan: `plans/20260312_145500_install_script.md`

## Tasks

### M13-T01: Create install.sh
- [x] Platform detection: `uname -s` → darwin/linux, `uname -m` → arm64/x64 mapping
- [x] Unsupported platform error (Windows/MINGW/CYGWIN)
- [x] Fetch latest release from GitHub API
- [x] Download binary + checksums.sha256
- [x] Checksum verification: `sha256sum` on Linux, `shasum -a 256` on macOS (in subshell)
- [x] macOS quarantine strip (`xattr -d`)
- [x] Detect existing brew-managed install and warn
- [x] Install to `~/.local/bin/bab` (default) or `--prefix` / `--prefix=DIR`
- [x] `--force` flag to override existing install
- [x] `--help` / `-h` flag
- [x] PATH check + shell profile instructions (zsh/bash/fish)
- [x] Verify with `bab --version`
- [x] Print update-path instructions (selfupdate vs brew upgrade)
- Output: working install script
- Deps: M11-T01 (needs published release)
- Status: completed

### M13-T02: Brew fallback
- [x] Detect binary download failure
- [x] If `brew` available → `brew install babmcp/tap/bab`
- [x] Print clear message: "Installed via Homebrew. Update with: brew upgrade bab"
- [x] If brew not available → print manual install instructions
- Output: graceful fallback path
- Deps: M13-T01, M12-T04 (brew tap must work)
- Status: completed

### M13-T03: Test and document
- [ ] Test on macOS arm64, macOS x64, Linux x64
- [ ] Document in README: `curl -fsSL ... | bash` and `curl ... | bash -s -- --prefix /usr/local/bin`
- Output: verified install script
- Deps: M13-T02, first real release published
- Status: pending (needs a real release)
