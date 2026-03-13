---
title: PreCommit
layout: default
parent: Tool Reference
nav_order: 13
---

# PreCommit Tool - Pre-Commit Validation

**Comprehensive review of staged/unstaged git changes with expert validation through workflow-driven investigation**

The `precommit` tool provides thorough validation of git changes before committing, ensuring code quality, requirement compliance, and preventing regressions. This workflow tool guides Claude through systematic investigation of git changes, repository status, and file modifications across multiple steps before providing expert validation.

## How the Workflow Works

The precommit tool implements a **structured workflow** for comprehensive change validation:

**Investigation Phase (Claude-Led):**
1. **Step 1**: Claude states validation strategy and begins examining changes
2. **Step 2**: Claude examines diffs, dependencies, and cross-file impact
3. **Step 3+**: Claude performs final verification (minimum 3 steps enforced)
4. **Throughout**: Claude tracks findings, relevant files, and issues
5. **Completion**: Only after minimum steps, Claude signals completion

**Expert Validation Phase:**
After Claude completes the investigation (unless `precommit_type` is **internal**):
- Complete summary of all changes and their context
- Potential issues and regressions identified
- Requirement compliance assessment
- Final recommendations for safe commit

**Special Notes:**
- Default validation type is **external** (uses expert model for additional review)
- To skip expert validation, set `precommit_type` to "internal"
- Minimum 3 steps are enforced before completion

## Example Prompts

**Basic Usage:**
```
"Use bab precommit to validate my changes before committing"
"Perform a thorough precommit ensuring there aren't any new regressions or bugs introduced"
"Run precommit with a focus on security for the authentication changes"
```

## Key Features

- **Pre-commit validation** for staged and unstaged git changes
- **Multi-repository support** - reviews changes across nested repositories
- **Security review** - catches exposed secrets and vulnerabilities in new code
- **Change impact assessment** - cross-file dependency analysis
- **Git ref comparison** - compare against any branch, tag, or commit
- **Configurable scope** - review staged, unstaged, or both
- **Severity filtering** - focus on critical, high, medium, low, or all issues
- **External or internal validation** - expert model review (default) or Claude-only
- **Regression detection** - compares against requirements to prevent scope creep
- **Smart truncation** - handles large diffs without exceeding context limits

## Tool Parameters

**Workflow Investigation Parameters (used during step-by-step process):**
- `step` (string, required): Current investigation step description
- `step_number` (number, required): Current step number in validation sequence (starts at 1)
- `total_steps` (number, required): Estimated total investigation steps (minimum 3 enforced)
- `next_step_required` (boolean, required): Whether another investigation step is needed
- `findings` (string, required): Specific discoveries and evidence from investigation
- `files_checked` (string[], optional): All files examined during investigation
- `relevant_files` (string[], optional): Files directly relevant to the changes
- `relevant_context` (string[], optional): Methods/functions/classes affected by changes
- `issues_found` (object[], optional): Issues identified with severity levels
- `confidence` (enum, optional): Confidence level - exploring|low|medium|high|very_high|almost_certain|certain
- `images` (string[], optional): Screenshots of requirements or design mockups for validation

**Configuration Parameters (optional):**
- `path` (string, optional): Repository root path (absolute path)
- `compare_to` (string, optional): Git ref to compare against (branch, tag, or commit)
- `focus_on` (string, optional): Area to emphasize (e.g., "security", "performance")
- `include_staged` (boolean, optional, default: true): Include staged changes in the review
- `include_unstaged` (boolean, optional, default: true): Include uncommitted changes in the review
- `severity_filter` (enum, optional): Filter issues by severity - critical|high|medium|low|all
- `precommit_type` (enum, optional, default: external): Validation type - external (expert model) or internal (Claude only)
- `model` (string, optional): Model to use for expert validation
- `temperature` (number, optional): Temperature for response generation
- `thinking_mode` (string, optional): Thinking budget for extended thinking models
- `continuation_id` (string, optional): Continue a previous validation session
- `use_assistant_model` (boolean, optional, default: true): Whether to use expert validation phase

## Usage Examples

**Basic Pre-commit Validation:**
```
"Use bab precommit to validate my changes before committing"
```

**Security-Focused Validation:**
```
"Perform precommit security review on the authentication changes"
```

**Against Specific Branch:**
```
"Compare current changes against main branch with precommit"
```

**With Requirements Context:**
```
"Precommit validation ensuring the new payment feature meets requirements in FEATURE_SPEC.md"
```

**Critical Issues Only:**
```
"Run precommit with severity filter set to critical on my staged changes"
```

**Internal Validation (No Expert Model):**
```
"Run precommit internally without using an external model"
```

## Validation Categories

**Completeness Checks:**
- New functions/classes have corresponding tests
- Documentation updated for API changes
- Configuration files updated as needed
- Migration scripts for database changes

**Quality Assurance:**
- Code follows project standards
- No obvious bugs or logical errors
- Performance implications considered
- Security vulnerabilities addressed

**Requirement Compliance:**
- Implementation matches original requirements
- No scope creep or unauthorized changes
- All acceptance criteria met
- Edge cases properly handled

**Integration Safety:**
- Breaking changes properly documented
- Backward compatibility maintained where required
- Dependencies correctly updated
- Environment-specific changes validated

## Best Practices

- **Provide clear context**: Include the original requirements or feature description
- **Use for significant changes**: Most valuable for features, refactoring, or security updates
- **Review before final commit**: Catch issues before they enter the main branch
- **Include visual context**: Screenshots of requirements or expected behavior
- **Focus validation scope**: Use `focus_on` parameter for specific concerns
- **Use severity filtering**: Focus on critical issues first with `severity_filter`
- **Multi-stage validation**: Use `continuation_id` for iterative improvement

## When to Use PreCommit vs Other Tools

- **Use `precommit`** for: Validating changes before git commit, ensuring requirement compliance
- **Use `codereview`** for: Comprehensive code quality review without git context
- **Use `secaudit`** for: Deep security-focused audit beyond pre-commit scope
- **Use `refactor`** for: Improvement analysis and code restructuring recommendations
