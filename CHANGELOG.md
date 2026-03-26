# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

## [0.1.3-20260326] - 2026-03-26

### Security

- **H2**: `ProcessRunOptions.env` is now required — no implicit `process.env` leak to child processes.
- **H1+I5**: API keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `GITHUB_TOKEN`, `GH_TOKEN`) and `BAB_*` prefix stripped from delegate subprocess env.
- **L2→MEDIUM**: Stack traces stripped from tool error responses unless `BAB_LOG_LEVEL=debug`.
- **M5**: Validate `working_directory` in delegate tool (must exist, be a directory, within project/home/tmp).

### Fixed

- **H3**: Plugin cache clears `inflight` on rejection so transient failures are retried.
- **M1**: `listmodels` tool now uses plugin cache instead of rediscovering on every call.
- **M2**: Bound `warnedIds` set in persistence to 500 entries max.
- **M3**: `BAB_PERSIST_TOOLS` and `BAB_DISABLED_PERSIST_TOOLS` validated through `BabEnvSchema`.
- **M6**: Test temp directory cleanup in chat, codereview, investigation, and transformation test suites.
- Fix `relevant_files` schema to accept a single string via `z.preprocess`.
- Add dedicated `error.log` file for warnings and errors only.
- Fix test accuracy: no-op assertions, buffer cap, YAML alias error match, unused imports.

### Other

- Add persistence layer for tool report storage.
- Gracefully skip missing files in embedFiles and clarify delegate role description.
- Dynamic model inference in ProviderRegistry.
- Dynamic model discovery via provider APIs.
- Structured report format with frontmatter, summary, and multi-step appending.

## [0.1.2-20260316] - 2026-03-16

### Added

- Add changelog script and generate CHANGELOG.md.
- Add model ID format guidance to all tool schemas.
- Add .describe() to 8 schema fields that cause LLM misuse.

### Changed

- Auto-generate changelog on tag push, mark rc/beta as pre-release.
- Rename changelog script to changelog:update.
- Update changelog with unreleased changes.
- Update changelog with M16 lazy tool loading and schema improvements.

### Other

- Strip Co-authored-by trailers from changelog output.
- Use only commit subject line in changelog entries.
- Note that MCP client env vars override the bab env file.
- Support BAB_DISABLED_TOOLS env var to blocklist tools.
- Lazy tool loading via BAB_LAZY_TOOLS=1.
- Include available SDK models in model-not-found error.
- Bump version to 0.1.2-20260316.
- Treat date-based version tags as pre-release.
- Finalize changelog for v0.1.2-20260316.

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
