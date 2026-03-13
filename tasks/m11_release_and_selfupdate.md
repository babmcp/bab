# M11 — Release Workflow & Selfupdate

status: completed
progress: 5/5
last_updated: 2026-03-12
last_task: M11-T05
blocked_by: none
unlocks: m12_homebrew_tap, m13_install_script

---

Plan: `plans/20260312_143000_selfupdate_command.md`

## Tasks

### M11-T01: GitHub Actions release workflow
- [x] `.github/workflows/release.yml`: trigger on tag `v*`
- [x] Platform-specific runners: macos-latest (arm64), macos-13 (x64), ubuntu-latest (x64), ubuntu-24.04-arm (arm64)
- [x] Each job: bun install → bun build --compile → upload artifact
- [x] Post-matrix job: download all artifacts → `shasum -a 256 bab-* > checksums.sha256`
- [x] Create GitHub release, attach binaries + checksums.sha256
- [x] Guard: release only if ALL matrix jobs succeed
- [x] Post-release: `repository_dispatch` to `babmcp/homebrew-tap`
- Output: working release workflow
- Deps: none
- Status: completed

### M11-T02: selfupdate command
- [x] `src/commands/selfupdate.ts`
- [x] `isBinaryInstall()` via `Bun.embeddedFiles.length > 0`
- [x] Brew-install detection (execPath contains `Cellar`)
- [x] `fetchLatestRelease(owner, repo)` → version + assets
- [x] `resolveAssetUrl(assets, platform, arch)` → URL or error with supported platforms
- [x] `downloadAndInstall(url, checksumUrl, assetName, targetPath, stderr)` — deep function: download with progress → verify checksum → strip quarantine → atomic replace (same-directory tmp)
- [x] `runSelfUpdate(args, deps)` — entry point
- Output: working selfupdate command
- Deps: M11-T01
- Status: completed

### M11-T03: Wire selfupdate into CLI
- [x] Add `selfupdate` to `commandHandlers` in `src/cli.ts`
- [x] Add `getSelfupdateHelpText()`, update main help text
- [x] `--check` flag with exit code 0 (up to date) / 80 (update available)
- [x] `--force` flag
- Output: `bab selfupdate` accessible from CLI
- Deps: M11-T02
- Status: completed

### M11-T04: Selfupdate tests
- [x] Version comparison logic
- [x] Platform asset resolution (including unsupported arch)
- [x] Binary detection (mock `Bun.embeddedFiles`)
- [x] Checksum verification (valid + mismatch)
- [x] Mock fetch for release API + download
- Output: passing test suite
- Deps: M11-T03
- Status: completed

### M11-T05: Document release process
- [x] Create `RELEASING.md`: merge changelog PR → push tag → release workflow runs
- [x] Document `changelog.yml` → `release.yml` sequencing
- Output: documented release process
- Deps: M11-T01
- Status: completed
