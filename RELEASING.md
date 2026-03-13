# Releasing Bab

## Overview

Bab uses a two-step release process: changelog generation followed by binary release.

## Workflow Sequencing

```
changelog.yml (manual dispatch)  -->  merge PR  -->  push tag  -->  release.yml (auto)
```

### Step 1: Generate Changelog

1. Go to **Actions > Changelog** in GitHub
2. Click **Run workflow** and enter the target version (e.g. `0.2.0`)
3. This creates a PR on branch `release/v0.2.0` with an updated `CHANGELOG.md`
4. Review the PR, edit changelog entries if needed, then merge

### Step 2: Tag and Release

1. After the changelog PR is merged, create and push the tag:

```sh
git pull origin main
git tag v0.2.0
git push origin v0.2.0
```

2. The `release.yml` workflow triggers automatically on the `v*` tag push
3. It builds platform-specific binaries on four runners:
   - `macos-latest` (Apple Silicon) -> `bab-darwin-arm64`
   - `macos-13` (Intel) -> `bab-darwin-x64`
   - `ubuntu-latest` -> `bab-linux-x64`
   - `ubuntu-24.04-arm` -> `bab-linux-arm64`
4. A checksum job generates `checksums.sha256` from all binaries
5. A GitHub Release is created with all binaries and checksums attached
6. A `repository_dispatch` event notifies `babmcp/homebrew-tap` to update the formula

## Version Bumping

Update `version` in `package.json` before generating the changelog. The CLI reads its version from `package.json` at build time via `src/version.ts`.

## Troubleshooting

- **Build failures**: Check platform-specific runner logs. `bun build --compile` does not cross-compile, so each platform must build on its native runner.
- **Checksum job fails**: Ensure all four build jobs completed successfully. The checksum job depends on all build jobs via `needs:`.
- **Homebrew tap not updated**: Verify the `HOMEBREW_TAP_TOKEN` secret is set with write access to `babmcp/homebrew-tap`.
