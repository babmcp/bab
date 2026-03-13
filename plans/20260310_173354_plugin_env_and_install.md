# Plugin Env Files + Plugin Install Command

## Goal
1. Per-plugin `env` files for isolated config/secrets
2. `bab add <source>` CLI command to install plugins from git repos

---

## Part 1: Per-Plugin Env Files

### Current state
- Single global env: `~/.config/bab/env`
- `process.env` merged with global env in `loadConfig()`
- Adapters spawn subprocesses with `process.env` only
- `DelegateRunInput` has no env field

### Design
- Each plugin dir can have an optional `env` file (e.g. `~/.config/bab/plugins/claude/env`)
- Loaded during `loadPlugin()` using existing `parseEnvFile()`
- Stored internally (NOT on exported `LoadedPlugin` — avoids secret leakage on metadata type)
- Delegate tool computes fully-merged env centrally, passes to adapter via `DelegateRunInput.env`
- Adapters receive final env and pass directly to subprocess — no merge logic in adapters
- `DelegateRunInput.env` is the complete subprocess environment — adapters must not modify it

### Precedence (highest wins first)
```
plugin env > global env > process.env
```

### Error handling
- Missing env file: ignore (empty env)
- Unreadable env file: skip plugin with actionable warning
- Malformed env file: skip plugin with actionable warning (include filename + line number)
- Same semantics as global env parsing
- Duplicate keys within a file: last wins

### Security
- Never log full env maps — redact values in debug output
- Error messages reference env file path and key names only
- Plugin env can override API keys (intentional — documented)
- Denylist — plugin/global env files cannot override:
  - `HOME`, `PWD`, `PATH`, `SHELL`
  - `NODE_OPTIONS`, `BUN_OPTIONS`
  - `LD_LIBRARY_PATH`, `DYLD_LIBRARY_PATH`, `DYLD_INSERT_LIBRARIES`
  - `BAB_*` (reserved for internal server config)
- Denylist vars from file-based env are silently dropped (not errors)

### Platform
- Unix-only for v1 (macOS/Linux). Windows not supported.

### Changes

1. **`src/delegate/types.ts`**
   - Add `env?: Record<string, string>` to `DelegateRunInput` (optional — non-breaking for existing adapters)
   - Do NOT add env to `LoadedPlugin` (secrets don't belong on metadata type)

2. **`src/utils/env.ts`** (new)
   - `readPluginEnv(directory: string): Promise<Record<string, string>>` — reads optional env file
   - `mergeEnv(processEnv, globalEnv, pluginEnv): Record<string, string>` — centralized merge with denylist
   - Denylist applied to both global and plugin env values

3. **`src/delegate/loader.ts`**
   - After manifest validation, read plugin env using `readPluginEnv()`
   - Return env alongside LoadedPlugin via internal type (not exported)
   - Cache parsed env during plugin load — no re-parsing on each tool call

4. **`src/tools/delegate/index.ts`**
   - Compute final merged env using `mergeEnv()`
   - Pass as `DelegateRunInput.env` to adapter

5. **Plugin adapters** (`plugins/*/adapter.ts`)
   - Use `input.env` directly as subprocess env (no merge logic)
   - Pattern: `env: input.env ?? { ...process.env }` (fallback for backward compat)

6. **`src/sdk/index.ts`**
   - Re-export updated `DelegateRunInput` type (optional field — non-breaking)

7. **Tests**
   - Plugin with env file: env loaded correctly
   - Plugin without env file: empty env
   - Malformed env file: plugin skipped with warning (includes line number)
   - Merge precedence: plugin env overrides global overrides process
   - Denylist: protected vars from both plugin and global env are dropped
   - Denylist: BAB_* pattern matching works
   - Duplicate key in env file: last wins
   - Empty value (`FOO=`): accepted as empty string
   - No mutation of `process.env`
   - Adapter receives merged env exactly as computed

---

## Part 2: Plugin Install Command (`bab add`)

### Current state
- Plugins manually placed in `~/.config/bab/plugins/`
- No CLI install mechanism
- `src/cli.ts` handles `--version` only, delegates to MCP server

### Design
- `bab add <source>` clones a git repo, validates, installs into plugins dir
- Source formats:
  - `org/repo` → `https://github.com/org/repo.git` (GitHub-only shorthand)
  - `org/repo#ref` → clone + checkout specific tag/branch
  - `git@github.com:org/repo.git` → SSH URL, used as-is
  - Full URL → used as-is (https or ssh)
  - Full URL with `#ref` → clone + checkout
  - Local paths: NOT supported (explicit decision)

### Plugin discovery in cloned repos
Two layouts supported:

**Single-plugin repo** — `manifest.yaml` at root:
```
repo/
├── manifest.yaml
├── adapter.ts
└── prompts/
```

**Multi-plugin repo** — subdirs with manifests, no root manifest:
```
repo/
├── claude/
│   ├── manifest.yaml
│   └── ...
├── codex/
│   └── ...
└── copilot/
    └── ...
```

**Discovery rules:**
1. If root contains `manifest.yaml`:
   - If any immediate child dir ALSO contains `manifest.yaml` → **fail with ambiguity error**
   - Otherwise → single-plugin mode
2. If no root `manifest.yaml`:
   - Scan **immediate child directories only** (not recursive)
   - Collect dirs containing `manifest.yaml`
   - If none found → fail "no plugins found in repository"
   - Otherwise → multi-plugin mode

### Install flow (atomic, all-or-nothing for multi-plugin)
1. Clone to temp dir (`git clone --depth 1 --template=/dev/null`)
2. If ref specified: fetch and checkout (handle tags/branches that shallow clone may miss)
3. Resolve commit SHA: `git rev-parse HEAD`
4. Discover plugins (single or multi, rules above)
5. **Validate ALL plugins before installing any:**
   - Parse each manifest.yaml (Zod schema)
   - Derive plugin ID from manifest
   - Check manifest-referenced files exist (adapter.ts, prompt files)
   - Reject symlinks that escape plugin dir boundaries
   - Conflict check: fail if `plugins/<manifest-id>` already exists
   - Conflict check: fail if manifest ID matches a bundled plugin (opencode)
   - Check for duplicate IDs within same repo
6. Show confirmation prompt (list all plugins, source, trust warning for adapter.ts)
   - TTY: require confirmation unless `--yes`
   - Non-TTY: require `--yes` or fail
7. **Stage all plugins** into temp dirs under config path (`plugins/.staging-<id>-<nonce>`)
8. **Atomic rename** each staged dir to final `plugins/<manifest-id>/` using `fs.rename()`
9. On any failure before final rename: remove all staged dirs, leave installed state unchanged
10. Clean up clone temp dir
11. Print summary: installed plugins, IDs, paths
- Do NOT dynamically import adapter.ts during validation

### Install metadata (`.install.json`)
```json
{
  "schema_version": 1,
  "source_original": "zaherg/bab-plugins",
  "source_url": "https://github.com/zaherg/bab-plugins.git",
  "source_ref": "v1.0",
  "resolved_commit": "abc123def456...",
  "plugin_id": "claude",
  "plugin_subdir": "claude",
  "manifest_name": "Claude Code",
  "manifest_version": "0.1.0",
  "installer_version": "1.0.0",
  "installed_at": "2026-03-10T17:00:00Z"
}
```
- `plugin_subdir`: relative path within repo (`.` for single-plugin root)
- `schema_version`: enables future migration
- `installer_version`: bab version that performed the install
- Written via temp file + rename for atomicity

### Trust model
- Print source URL and destination path before cloning
- Warn if plugin contains adapter.ts (executes local code and spawns CLIs)
- Confirmation summary includes: source repo, ref, commit, plugin IDs, target paths
- Require confirmation unless `--yes` flag
- Non-interactive (no TTY): require `--yes` or fail

### Bundled vs installed plugins
- Plugin IDs are globally unique across bundled + installed
- Installing a plugin whose ID matches a bundled plugin → **fail**
- Bundled plugins are listable but not removable via `bab remove`
- No override behavior

### Git clone edge cases
- Shallow clone may not fetch arbitrary tags/commits
- If `--depth 1` + ref fails, fall back to full clone + checkout
- Test lightweight tags, annotated tags, branch names, commit SHAs

### Commands
- `bab add <source>` — install plugin(s)
- `bab remove <plugin-id>` — remove installed plugin (stretch)
  - Confirm by default, `--yes` to skip
  - Refuse to remove bundled plugins
- `bab list` — list all plugins (stretch)
  - Show: id, name, version, source type (bundled/installed), source repo

### CLI behavior
- `bab` (no args) → start MCP server
- `bab --version` → print version, exit 0
- `bab add ...` → run add command
- `bab remove ...` → run remove command
- `bab list` → run list command
- `bab help` / `--help` → print usage, exit 0
- `bab add --help` → print add usage, exit 0
- Unknown command → error + usage, exit nonzero
- Subcommands must NOT initialize server or load plugins unnecessarily

### Update strategy (deferred)
- No `bab update` command in v1
- `.install.json` metadata enables future: `bab update <id>` = remove + re-add from stored source
- `plugin_subdir` field enables selective update in multi-plugin repos
- Document "reinstall to update": `bab remove <id> && bab add <source>#<ref>`

### Source parser details
Returns:
```ts
{
  original: string;      // raw user input
  url: string;           // normalized git URL
  ref?: string;          // requested ref
  kind: "github_shorthand" | "git_url";
}
```
- Handle SSH forms: `git@github.com:org/repo.git`
- Handle `.git` suffix presence/absence
- Handle refs with slashes: `#feature/foo`, `#releases/v1`
- Reject empty source, malformed org/repo

---

## Resolved Questions
1. **Branch/tag support?** Yes — `org/repo#ref` supported from v1. Stores requested ref + resolved SHA.
2. **Non-GitHub sources?** No shorthand. Full URL required for non-GitHub.
3. **`bab remove` confirmation?** Yes by default. `--yes` flag for scripts/CI. Cannot remove bundled plugins.
4. **Plugin updates?** Deferred. Metadata stored now. Manual reinstall for v1.
5. **Multi-plugin repos?** Auto-detected. Root manifest = single, subdirs = multi. Ambiguous layout = error.
6. **Partial install failure?** All-or-nothing. No partial installs.
7. **Bundled conflicts?** Installed plugins cannot shadow bundled ones. Fail on ID collision.

---

## Implementation Order

```
Phase 0: CLI routing refactor
  T01: Subcommand framework in cli.ts (no behavior change)

Phase 1: Per-plugin env files
  T02: Env merge utility (src/utils/env.ts)
  T03: Loader reads plugin env
  T04: Delegate tool passes merged env to adapter
  T05: Update 4 adapters to use input.env
  T06: Tests for env loading, merge, denylist

Phase 2: Plugin install
  T07: Source parser (org/repo, URL, SSH, #ref)
  T08: Install core (temp clone, discover, validate all, stage, atomic rename)
  T09: Wire `bab add` CLI command
  T10: Tests for source parser and install flow

Phase 3: Plugin management (stretch)
  T11: `bab remove` with confirmation
  T12: `bab list` with table output

Phase 4: Extract plugins (after Phase 1 + Phase 2 verified)
  T13: Create zaherg/bab-plugins repo
  T14: Remove extracted plugins from bab
```

### Dependencies
```
T01 (cli routing) ─────────────────────────┐
  │                                         │
  ├── T02 (env util)                        │
  │     └── T03 (loader reads env)          │
  │           └── T04 (delegate passes env) │
  │                 └── T05 (adapters)      │
  │                       └── T06 (tests)   │
  │                                         │
  ├── T07 (source parser) ─────────────────>│
  │     └── T08 (install core)              │
  │           └── T09 (wire CLI)            │
  │                 └── T10 (tests)         │
  │                                         │
  └── T11 (remove) ── T12 (list) ──────────┘

Phase 1 and Phase 2 (T07-T10) can run in parallel after T01.
Phase 3 depends on Phase 2 completion.
Phase 4 requires Phase 1 (T06) AND Phase 2 (T10) both complete.
  → DelegateRunInput.env contract must be frozen before extraction.
```
