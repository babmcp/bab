# OpenCode CLI Research

Date: 2026-03-10

## Sources

- OpenCode docs: https://opencode.ai/docs
- OpenCode CLI docs: https://opencode.ai/docs/cli
- OpenCode permissions docs: https://opencode.ai/docs/permission
- Homebrew formula: `sst/tap/opencode`

## Local environment

- `opencode` installed via Homebrew: `1.2.24`
- `opencode auth list` reports configured credentials and provider env bindings
- Available local models include `deepseek/deepseek-chat` and multiple `github-copilot/*` models

## Findings

### Invocation

- Non-interactive command is:
  - `opencode run [message..]`
- Raw machine-readable output is:
  - `--format json`
- Model selection is explicit:
  - `-m, --model provider/model`
- Working headless example on this machine:

```bash
opencode run "reply with exactly ok" \
  --format json \
  --model deepseek/deepseek-chat
```

### Output format

- `--format json` emits raw JSON events, one per line
- Observed success event types include:
  - `step_start`
  - `text`
  - `step_finish`
- Observed error event type:
  - `error`

Observed success sample:

```json
{"type":"text","part":{"text":"ok"}}
{"type":"step_finish","part":{"tokens":{"input":29409,"output":1},"cost":0.00823494}}
```

Observed error sample:

```json
{"type":"error","error":{"name":"APIError","data":{"message":"Please reauthenticate..."}}}
```

### Prompt injection

- No dedicated system-prompt flag surfaced by `opencode run --help`
- The adapter should prepend the resolved role prompt to the user prompt and pass the combined string as the positional message

### Auth

- `opencode auth list` exposes both stored credentials and provider env bindings
- On this machine, the default provider path resolved to GitHub Copilot and returned `403` for one test run
- A different explicit model (`deepseek/deepseek-chat`) succeeded immediately
- Conclusion: auth is provider-specific and validation should confirm that at least one credential/env-backed provider exists, while runtime may still need an explicit model

### Headless / auto-approve

- Headless execution exists through `opencode run`
- The permissions docs indicate non-interactive use is allowed and permissions can be tuned by config
- For Bab, this is sufficient because the adapter uses piped stdio and no interactive approval loop is required

### PTY vs pipe

- Works with stdout piped when using `--format json`
- JSON events are parseable without a PTY

### Roles

- Built-in roles map cleanly: `default`, `planner`, `codereviewer`
- A custom `researcher` role is reasonable because OpenCode supports multiple backends and longer-form exploration workflows

### Decision

- Implement as an adapter-backed plugin
- Use `opencode run --format json`
- Prefer explicit model selection when available from role args or environment
- Parse raw JSON events, recover content on non-zero exit if output is parseable, and emit normalized Bab events
