# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added

- Add changelog script and generate CHANGELOG.md.
- Support `BAB_DISABLED_TOOLS` env var to blocklist specific tools from registration.

### Changed

- Auto-generate changelog on tag push, mark rc/beta as pre-release.
- Note that MCP client env vars override the bab env file.

### Other

- Strip Co-authored-by trailers from changelog output.
- Rename changelog script to `changelog:update`.
- Use only commit subject line in changelog entries.

## [0.1.2-rc2] - 2026-03-14

### Added

- Add all installation methods to README and getting-started.
- Add MCP client setup examples.
- Document tool_prompts and update plugin installation guide.

### Changed

- Rename docs/README.md to docs/index.md to fix GitHub Pages root 404.

### Other

- Resolve duplicate nav_order in docs (provider-setup and slash-commands both had 3).
- Initial plan.
- Add GitHub Pages deployment workflow.
- Initial plan.
- Refresh CLI help banner.
- Manifest schema + loader caching for plugin tool prompts.
- ModelGateway toolName + prompt resolution.
- Wire toolName through workflow, simple, and consensus tools.
- Tests for plugin tool prompts.
- Mark all tasks completed, add plan and milestone files.
- Increase default delegate timeout to 3 hours.
- Address consensus review issues for plugin tool prompts.
- List available tool prompt names in a table.
- Harden tool prompts with allowlist, null prototype, and debug logging.
- Strengthen co-authorship rules for bab tool usage.

## [0.1.2-rc1] - 2026-03-13

### Added

- Add MCP prompts for slash commands (/bab:chat, /bab:review, etc.).
- Add slash commands reference.

### Changed

- Update release workflow — replace macos-13 with macos-15-intel, fix shellcheck SC2129.

### Fixed

- Fix TOCTOU race, harden plugin reads, secure selfupdate temp files.

### Other

- Bab MCP server — initial release.
- File embedding allowlist, reject http:// plugins, increase delegate timeout.
- Auto-resolve relative file paths and fallback on unknown models.
- Prefer exact model id over alias to prevent cross-provider collision.
- Deduplicate env denylists, centralize containment, simplify selfupdate cleanup.
- Move assertPathContainment to utils, rename embedFiles, add selectModel warning.
- Resolve tsc errors — widen DELEGATE_ENV_DENYLIST type, add modelGateway to test fixtures.
- Bump version to 0.1.2-rc1.
