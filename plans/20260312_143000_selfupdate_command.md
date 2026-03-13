# Plan: `bab selfupdate` command

## Goal

Add a `bab selfupdate` subcommand that updates the compiled binary by downloading the latest release from `github.com/babmcp/bab`.

Binary-only — does not handle npm installs. If invoked outside a compiled binary context, print an error and exit.

## Context

- Repo: `babmcp/bab` (GitHub)
- Binary built via `bun build --compile src/cli.ts --outfile dist/bab`
- Typical install location: `~/.local/bin/bab` (symlink to dist/bab)
- Current version: read from `src/version.ts` → `package.json`
- No GitHub releases exist yet — release workflow is a prerequisite

## Design

### Release asset naming convention

Each GitHub release (tag: `v0.1.2`) publishes platform binaries:

```
bab-darwin-arm64
bab-darwin-x64
bab-linux-x64
bab-linux-arm64
checksums.sha256
```

### Detection: is this a compiled binary?

Use `Bun.embeddedFiles.length > 0` — this is only true in `bun build --compile` output. Do NOT use `process.execPath` basename heuristics (fragile — dev builds, symlinks, etc. produce false positives).

### Selfupdate flow

```
bab selfupdate [--check] [--force]
```

1. **Guard**: check `Bun.embeddedFiles.length > 0`. If false → error "selfupdate only works with the compiled binary. Use your package manager to update." If brew-installed (check `process.execPath` contains `Cellar`), say "You installed via Homebrew. Run `brew upgrade bab` instead."
2. **Fetch latest release**: `GET https://api.github.com/repos/babmcp/bab/releases/latest`
   - Extract tag name → parse version (strip `v` prefix)
   - No auth needed for public repo (respect `GITHUB_TOKEN` if set for rate limits)
3. **Compare versions**: if latest <= current and no `--force` → "Already up to date (v0.1.1)"
4. **`--check` flag**: print status and exit without downloading
   - Exit code 0 = up to date, exit code 80 = update available (non-error, non-zero for scripting)
5. **Resolve platform asset**: `bab-${process.platform}-${process.arch}` → find matching asset in release
   - If no match → error "No binary available for ${platform}-${arch}. Supported: darwin-arm64, darwin-x64, linux-x64, linux-arm64"
6. **Download binary**: `fetch(asset.browser_download_url)` → stream to temp file **in the same directory as the target** (not `/tmp` — `rename()` fails across filesystems)
   - Read `Content-Length` header for total size
   - Stream response body, track bytes received, render progress bar to stderr
   - Format: `Downloading bab v0.2.0... [████████░░░░] 65% 3.2MB/4.9MB`
   - Fall back to `Downloading bab v0.2.0...` if no Content-Length
7. **Download checksums**: fetch `checksums.sha256` asset from the same release
8. **Verify checksum**: compute SHA256 of downloaded binary, match against `checksums.sha256` entry
   - Mismatch → delete temp file, error "Checksum mismatch — download may be corrupted. Aborting."
9. **Strip macOS quarantine**: on darwin, run `xattr -d com.apple.quarantine <tmp>` (ignore errors if attribute not present)
10. **Replace**:
    - Resolve the real binary path (follow symlinks via `fs.realpath` on `process.execPath`)
    - Temp file is `<target>.tmp` (same directory, same filesystem)
    - `chmod +x` the temp file
    - Atomic rename `<target>.tmp` → `<target>`
11. **Verify**: spawn `<target> --version`, confirm output matches expected version
12. **Report**: "Updated bab v0.1.1 → v0.2.0"

### Error handling

- Network failure → "Failed to reach GitHub. Check your connection."
- No matching asset for platform → "No binary available for ${platform}-${arch}"
- Permission denied on replace → "Permission denied. Try: sudo bab selfupdate"
- Verification failed → rollback (keep old binary), warn user

## Prerequisites

- **GitHub Actions release workflow** (in scope — step 1 below): on tag push `v*`, build binaries for all platforms, generate `checksums.sha256`, and attach everything to the release.
- Existing `changelog.yml` is a **pre-release prep** workflow only (manual dispatch → git-cliff → PR with updated CHANGELOG.md). It does NOT build binaries or create GitHub releases.
- **Release sequence**: merge changelog PR → push tag `vX.Y.Z` → `release.yml` runs automatically. Document this in a RELEASING.md or similar.

## Resolved questions

1. **Checksum verification**: Yes — both. Each release publishes a `checksums.sha256` asset containing `sha256  filename` lines. After download, compute SHA256 of the binary and verify against the checksum file. Also embed the expected checksum in release notes as a fallback.
2. **Progress bar**: Yes — show a progress bar during download (use `Content-Length` header for total size, track bytes received). Fall back to a simple "downloading..." message if `Content-Length` is missing.
3. **`--force`**: Yes — re-downloads and replaces even if same version.

## Steps

1. **Create `.github/workflows/release.yml`** — GitHub Actions release workflow:
   - Trigger: tag push matching `v*`
   - **Platform-specific runners** (bun --compile does NOT cross-compile):
     - `macos-latest` (Apple Silicon) → `bab-darwin-arm64`
     - `macos-13` (Intel) → `bab-darwin-x64`
     - `ubuntu-latest` → `bab-linux-x64`
     - `ubuntu-24.04-arm` → `bab-linux-arm64`
   - Each job: `bun install` → `bun build --compile src/cli.ts --outfile bab-{platform}-{arch}` → upload artifact
   - **Post-matrix checksum job**: download all artifacts → `shasum -a 256 bab-* > checksums.sha256`
   - Create GitHub release from tag, attach all binaries + `checksums.sha256`
   - **Guard**: only create release if ALL matrix jobs succeed (use `needs:` with all build jobs)
   - **Post-release job**: trigger `repository_dispatch` to `babmcp/homebrew-tap` with version + checksums (see Plan 2)
2. **Create `src/commands/selfupdate.ts`** with:
   - `isBinaryInstall()` — check `Bun.embeddedFiles.length > 0`
   - `fetchLatestRelease(owner, repo)` → `{ version, assets[] }`
   - `resolveAssetUrl(assets, platform, arch)` → URL or error with supported platforms
   - `downloadAndInstall(url, checksumUrl, assetName, targetPath, stderr)` — deep function handling: download with progress → verify checksum → strip quarantine → atomic replace
   - `runSelfUpdate(args, deps)` — entry point: guard → fetch → compare → downloadAndInstall → verify
3. **Wire into `src/cli.ts`**:
   - Add `selfupdate` to `commandHandlers`
   - Add `getSelfupdateHelpText()` and help text entry
4. **Add tests** in `src/commands/__tests__/selfupdate.test.ts`:
   - Version comparison logic
   - Platform asset resolution (including unsupported arch)
   - Binary detection (`Bun.embeddedFiles` mock)
   - Checksum verification (valid + mismatch)
   - Mock fetch for release API + download
5. **Manual e2e test** after publishing first release with `checksums.sha256`
