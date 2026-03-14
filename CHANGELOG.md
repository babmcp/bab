# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Changed

- Update changelog" commits
- release.yml marks beta/rc tags as pre-release, not latest.

### Other

- Strip Co-authored-by trailers from changelog output.

## [0.1.2-rc2] - 2026-03-14

### Added

- Add all installation methods to README and getting-started

Homebrew, install script, binary download, from source, and selfupdate..
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
- Address consensus review issues for plugin tool prompts

- Make resolveToolPrompts() best-effort per entry (warn and skip bad entries)
- Add .min(1) schema validation for tool_prompts keys and values
- Document tool prompt vs role prompt precedence
- Update symlink escape test for best-effort behavior
- Add empty key/value rejection test.
- List available tool prompt names in a table.
- Partial success, unknown tool name, ../ traversal.
- Strengthen co-authorship rules for bab tool usage

Clarify that co-author trailers are required for any AI agent that
produced output through bab or MCP tools, not just direct delegation.
Only credit agents that actually responded — skip failed/unavailable models..

## [0.1.2-rc1] - 2026-03-13

### Added

- Simple (chat, challenge),
workflow (review, debug, analyze, etc.), multi-model (consensus),
and delegation (delegate)..
- Add slash commands reference.

### Changed

- Update release workflow — replace macos-13 with macos-15-intel, fix shellcheck SC2129.

### Fixed

- Read from resolvedPath not filePath
- Remove ~/.config/bab from embedding allowlist (contains API keys)
- Add containment check for plugin manifest reads via assertPathContainment
- Reject symlinked plugin env files and enforce realpath containment
- Use mkdtemp() for selfupdate temp files instead of predictable .tmp names
- Strip LD_PRELOAD, DYLD_INSERT_LIBRARIES, NODE_OPTIONS from delegate env.

### Other

- Unit and e2e steps run separately.
- Increase default delegate timeout from 5min to 30min
  (configurable via BAB_CLI_TIMEOUT_MS), fixes Codex timeout on complex tasks.
- Fall back to best available model when the requested
  model is unknown or its provider is not configured, instead of
  throwing — ensures tools always work with whatever provider is set up.
- Prefer exact model id over alias to prevent cross-provider collision

getModelInfo("openai/gpt-5.2") was matching the OpenAI alias before the
OpenRouter exact id, causing "Provider not configured" errors when only
OpenRouter was configured. Now exact id matches take priority over aliases..
- Deduplicate env denylists, centralize containment, simplify selfupdate cleanup

- Extract shared RUNTIME_INJECTION_VARS, compose both denylists from it
- readPluginEnv reuses assertPathContainment instead of inline checks
- selfupdate uses try/finally for secureTmpDir cleanup (was 6 scattered rm calls)
- Move backup file into secureTmpDir to eliminate predictable path in targetDir.
- Move assertPathContainment to utils, rename embedFiles, add selectModel warning

- Move assertPathContainment from delegate/loader to utils/path (fixes
  wrong-direction dependency where utils/env imported from delegate)
- Rename embedAbsoluteFiles → embedFiles and AbsoluteFilePathsSchema →
  FilePathsSchema (function now accepts relative paths)
- Add logger.warn when selectModel falls through to auto-select.
- Resolve tsc errors — widen DELEGATE_ENV_DENYLIST type, add modelGateway to test fixtures

- Annotate DELEGATE_ENV_DENYLIST as Set<string> to accept string keys
- Add modelGateway stub to all ToolContext test fixtures missing it.
- Bump version to 0.1.2-rc1.
