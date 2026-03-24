# Report Format Plan

## Goal

Define the `.md` report format written by `src/memory/persistence.ts` so reports are human-readable, AI-scannable, and machine-parseable.

## Format

```markdown
---
schema_version: 1
tool: bab:<tool_name>
models:
  - id: <model_id>
    provider: <provider_id>
    role: primary
  - id: <expert_model_id>
    provider: <provider_id>
    role: expert
continuation_id: <continuation_id>
timestamp: <ISO 8601>
files: [<list of embedded files>]
---

**Summary:** <1-3 sentence summary of the analysis result>

# <Tool Display Name>: <title from step or prompt>

## Request
> <input text — step/findings for workflow tools, prompt for simple tools, truncated to ~200 chars>

## Analysis

<AI primary response — plain markdown, not raw JSON>

## Expert Validation

<Expert analysis if ran, omit section entirely if not>
```

## Input Text Source

Different tool types use different primary input fields:
- **Workflow tools** (analyze, debug, codereview, etc.): use `step` or `findings` field
- **Simple tools** (chat): use `prompt` field
- **Consensus**: use `question` field

The slug and `## Request` section derive from the appropriate field, not always `prompt`.

## Models Field

`models` is a list to support:
- Single-model tools: one entry with `role: primary`
- Expert validation: two entries (`primary` + `expert`)
- Consensus: multiple entries with `role: panelist` + one `role: synthesis`

## Continuation ID

Use the actual thread ID returned by the tool (from `result.value.metadata.continuation_id`), not the raw `rawArguments.continuation_id`. The tool may generate a new thread ID when none is provided.

## Summary Generation

1. **First paragraph heuristic** — take the first 1-3 sentences of the analysis. Zero cost, works for all tools.
2. **Extract from `<SUMMARY>` tags** — if present in output. Currently only used in `delegate` (which is `persist: never`), so this is a fallback for future use.

Implementation: try `<SUMMARY>` extraction, fall back to first paragraph.

## Multi-Step Workflow Reports

For workflow tools (multi-step conversations), append each step:

```markdown
## Step 1: <step description>

<step analysis>

## Step 2: <step description>

<step analysis>
```

On continuation, scan the `.bab/<tool>/` directory for files matching the continuation ID, read and append the new step.

## Frontmatter Fields

| Field | Source | Required |
|-------|--------|----------|
| `schema_version` | hardcoded `1` | yes |
| `tool` | `bab:` + tool name | yes |
| `models` | list from `GenerateTextResult` | yes |
| `continuation_id` | from tool result metadata | yes |
| `timestamp` | `new Date().toISOString()` | yes |
| `files` | from `FileEmbeddingResult.embedded_files` | only if files were embedded |

## Changes Required

1. Update `persistReport` signature to accept structured metadata (models[], continuation_id from result, files, input text) instead of raw content string
2. Add `formatReport()` function in `src/memory/persistence.ts` that builds the markdown from metadata + content
3. Add `extractSummary(content: string)` — checks for `<SUMMARY>` tags, falls back to first paragraph
4. Update `handleCallToolRequest` in `server.ts` to pass structured data from `result.value` to `persistReport`
5. Derive input text from appropriate field per tool type (`step`/`findings`/`prompt`/`question`)
6. For workflow tools: scan directory for existing report by continuation_id, append new step
7. Add `.bab/` to `.gitignore`

## Test Coverage

- Verify frontmatter is valid YAML with all required fields including `schema_version`
- Verify summary fallback to first paragraph
- Verify summary extraction from `<SUMMARY>` tags
- Verify expert validation section is omitted when not present
- Verify multi-step append produces correct step numbering
- Verify input text uses `step` for workflow tools, `prompt` for simple tools
- Verify multi-model frontmatter for consensus tool
- Verify continuation_id comes from result metadata, not raw arguments
