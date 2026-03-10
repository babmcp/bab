# M9 — Plugin Env & Install

status: completed
progress: 14/14
last_updated: 2026-03-10
last_task: M9-T14
blocked_by: m8_polish
unlocks: none

---

Plans:
- `plans/20260310_173354_plugin_env_and_install.md`
- `plans/20260310_175150_extract_plugins.md`

## Phase 0: CLI Routing

### M9-T01: CLI subcommand routing
- [x] Refactor `src/cli.ts` to parse subcommands before server init
- [x] `bab` (no args) → start MCP server (existing behavior)
- [x] `bab --version` → print version, exit 0 (existing behavior)
- [x] `bab add ...` → dispatch to add handler
- [x] `bab remove ...` → dispatch to remove handler
- [x] `bab list` → dispatch to list handler
- [x] `bab help` / `--help` → print usage, exit 0
- [x] `bab add --help` → print add-specific usage, exit 0
- [x] Unknown command → error + usage, exit nonzero
- [x] No server initialization or plugin loading for subcommands
- [x] Each command handler returns exit code / throws typed error

## Phase 1: Per-Plugin Env Files

### M9-T02: Env merge utility
- [x] Create `src/utils/env.ts`
- [x] `readPluginEnv(directory: string): Promise<Record<string, string>>` — reads optional `env` file, returns `{}` if missing
- [x] `mergeEnv(processEnv, globalEnv, pluginEnv): Record<string, string>` — merge with correct precedence: plugin > global > process
- [x] Denylist applied to BOTH global and plugin env:
  - `HOME`, `PWD`, `PATH`, `SHELL`
  - `NODE_OPTIONS`, `BUN_OPTIONS`
  - `LD_LIBRARY_PATH`, `DYLD_LIBRARY_PATH`, `DYLD_INSERT_LIBRARIES`
  - `BAB_*` pattern (reserved for internal config)
- [x] Denylisted vars silently dropped (not errors)
- [x] Reuse `parseEnvFile()` from `src/config.ts`
- [x] Handle errors: unreadable/malformed file throws with filename + line number

### M9-T03: Loader reads plugin env
- [x] In `loadPlugin()`, call `readPluginEnv(discoveredPlugin.directory)`
- [x] Store env on internal type (not on exported `LoadedPlugin`)
- [x] Cache parsed env during plugin load — no re-parsing per tool call
- [x] Malformed env file → skip plugin with warning (same as manifest errors)

### M9-T04: Delegate passes merged env
- [x] Add `env?: Record<string, string>` to `DelegateRunInput` in `src/delegate/types.ts`
- [x] Document `input.env` as complete final subprocess environment
- [x] In `src/tools/delegate/index.ts`, call `mergeEnv()` with process.env, global config env, plugin env
- [x] Pass merged env as `DelegateRunInput.env`

### M9-T05: Adapters use input.env
- [x] `plugins/claude/adapter.ts` — use `input.env` as subprocess env, fallback `{ ...process.env }`
- [x] `plugins/codex/adapter.ts` — same
- [x] `plugins/copilot/adapter.ts` — same
- [x] `plugins/opencode/adapter.ts` — same
- [x] Pattern: `env: input.env ?? { ...process.env }`
- [x] Adapters must NOT modify or re-merge `input.env`

### M9-T06: Env tests
- [x] Plugin with env file: env values loaded correctly
- [x] Plugin without env file: returns empty `{}`
- [x] Malformed env file: plugin skipped with warning (includes filename + line number)
- [x] Merge precedence: plugin env overrides global, global overrides process
- [x] Denylist: `HOME`, `PWD`, `PATH`, `SHELL` from plugin env are dropped
- [x] Denylist: `BAB_*` pattern matching works
- [x] Denylist: denylisted vars from global env also dropped
- [x] Duplicate key in env file: last wins
- [x] Empty value (`FOO=`): accepted as empty string
- [x] No mutation of `process.env`
- [x] Adapter receives merged env exactly as computed

## Phase 2: Plugin Install

### M9-T07: Source parser
- [x] Create `src/commands/source-parser.ts`
- [x] Parse `org/repo` → `{ url: "https://github.com/org/repo.git", ref: undefined, kind: "github_shorthand" }`
- [x] Parse `org/repo#v1.0` → `{ url: "https://github.com/org/repo.git", ref: "v1.0" }`
- [x] Parse `git@github.com:org/repo.git` → SSH URL passthrough
- [x] Parse full HTTPS URL → passthrough
- [x] Parse URL with `#ref` (including refs with slashes: `#feature/foo`)
- [x] Handle `.git` suffix presence/absence
- [x] Return: `{ original, url, ref?, kind }`
- [x] Validate: reject empty source, malformed org/repo
- [x] Local paths NOT supported (explicit rejection)

### M9-T08: Install core (atomic, multi-plugin)
- [x] Create `src/commands/add.ts`
- [x] Clone to temp dir: `git clone --depth 1 --template=/dev/null <url> <tmpdir>`
- [x] If ref specified: checkout ref (fall back to full clone if shallow fails)
- [x] Resolve commit SHA: `git -C <tmpdir> rev-parse HEAD`
- [x] **Plugin discovery:**
  - [x] If root `manifest.yaml` exists AND any child dir also has `manifest.yaml` → fail ambiguity error
  - [x] If root `manifest.yaml` exists (no child manifests) → single plugin
  - [x] If no root manifest → scan immediate child dirs only (not recursive)
  - [x] If no manifests found anywhere → fail "no plugins found"
- [x] **Validate ALL plugins before installing any:**
  - [x] Parse each manifest.yaml (Zod schema)
  - [x] Derive plugin ID from manifest (not repo/dir name)
  - [x] Check manifest-referenced files exist (adapter.ts, prompt files)
  - [x] Reject symlinks escaping plugin dir boundaries
  - [x] Conflict: fail if `plugins/<manifest-id>` already exists
  - [x] Conflict: fail if manifest ID matches bundled plugin (opencode)
  - [x] Conflict: fail if duplicate IDs within same repo
- [x] **Confirmation prompt:**
  - [x] Show: source repo, ref, commit, list of plugin IDs + target paths
  - [x] Trust warning: "adapters execute local code and spawn CLI tools"
  - [x] TTY: require confirmation unless `--yes`
  - [x] Non-TTY: require `--yes` or fail
- [x] **Atomic staging:**
  - [x] Stage each plugin into `plugins/.staging-<id>-<nonce>/`
  - [x] Write `.install.json` per plugin (via temp file + rename):
    ```json
    {
      "schema_version": 1,
      "source_original": "zaherg/bab-plugins",
      "source_url": "https://github.com/zaherg/bab-plugins.git",
      "source_ref": "v1.0",
      "resolved_commit": "abc123...",
      "plugin_id": "claude",
      "plugin_subdir": "claude",
      "manifest_name": "Claude Code",
      "manifest_version": "0.1.0",
      "installer_version": "1.0.0",
      "installed_at": "2026-03-10T17:00:00Z"
    }
    ```
  - [x] Atomic rename each staging dir to `plugins/<manifest-id>/` via `fs.rename()`
  - [x] On any failure: remove ALL staging dirs (all-or-nothing)
- [x] Clean up clone temp dir on success and failure
- [x] Print summary table: plugin name, ID, install path, status
- [x] Do NOT dynamically import adapter.ts during validation

### M9-T09: Wire `bab add` CLI
- [x] Connect `src/cli.ts` add subcommand to `src/commands/add.ts`
- [x] Pass args: source, `--yes` flag
- [x] Exit 0 on success, nonzero on failure
- [x] Print summary for each installed plugin
- [x] stderr for warnings/errors, stdout for results

### M9-T10: Install tests
- [x] Source parser: `org/repo` → correct GitHub URL
- [x] Source parser: `org/repo#v1.0` → URL + ref
- [x] Source parser: SSH URL passthrough
- [x] Source parser: full HTTPS URL passthrough
- [x] Source parser: ref with slashes (`#feature/foo`)
- [x] Source parser: rejects empty/malformed input
- [x] Discovery: root-only manifest → single plugin
- [x] Discovery: child subdirs with manifests → multi-plugin
- [x] Discovery: no manifest found → error
- [x] Discovery: root + child manifests → ambiguity error
- [x] Discovery: nested grandchild manifests NOT recursively picked up
- [x] Validation: invalid manifest schema → error
- [x] Validation: duplicate IDs within same repo → error
- [x] Conflict: installed plugin ID already exists → error
- [x] Conflict: manifest ID matches bundled plugin → error
- [x] Atomicity: failure during staging leaves no partial install
- [x] Metadata: `.install.json` written with correct schema_version, plugin_subdir, commit
- [x] Confirmation: no TTY + no `--yes` → failure
- [x] Confirmation: `--yes` bypasses prompt
- [x] Cleanup: temp clone dir removed on success and failure
- [x] Multi-plugin: each plugin gets own `.install.json`

## Phase 3: Plugin Management (stretch)

### M9-T11: `bab remove` command
- [x] Create `src/commands/remove.ts`
- [x] Resolve plugin ID to directory path
- [x] Refuse to remove bundled plugins (opencode) — "cannot remove bundled plugin"
- [x] Refuse path traversal / symlinked plugin dirs
- [x] TTY: confirm before delete, `--yes` to skip
- [x] Non-TTY: require `--yes`
- [x] Delete plugin directory
- [x] Print confirmation message

### M9-T12: `bab list` command
- [x] Create `src/commands/list.ts`
- [x] Discover and load all plugins (bundled + installed)
- [x] Read `.install.json` for source info (if present)
- [x] Print table: id, name, version, command, source type (bundled/installed), source repo

## Phase 4: Extract Plugins

### M9-T13: Create bab-plugins repo
Prerequisites: T05, T06, T10 all complete. DelegateRunInput.env frozen.
- [x] Create `zaherg/bab-plugins` repo on GitHub
- [x] Copy claude, codex, copilot dirs from `plugins/` (adapter.ts, manifest.yaml, prompts/, RESEARCH.md)
- [x] Add README with install instructions: `bab add git@github.com:zaherg/bab-plugins.git`
- [x] Verify `bab add git@github.com:zaherg/bab-plugins.git` works end-to-end
- [x] Verify each installed plugin can run a delegate task
- [x] Verify prompt resolution works identically for installed plugins

### M9-T14: Remove extracted plugins from bab
- [x] Remove `plugins/claude/`, `plugins/codex/`, `plugins/copilot/` from bab repo
- [x] Keep `plugins/opencode/` as bundled reference plugin
- [x] Update bab README: document `bab add git@github.com:zaherg/bab-plugins.git`
- [x] Update `docs/plugin-authoring.md` with multi-plugin repo example
- [x] Update any test fixtures that reference removed plugins
- [x] Verify `bab list` shows opencode (bundled) + installed plugins correctly
- [x] Verify `bab remove opencode` is refused
