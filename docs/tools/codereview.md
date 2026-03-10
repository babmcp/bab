---
title: CodeReview
layout: default
parent: Tool Reference
nav_order: 5
---

# CodeReview Tool - Professional Code Review

**Comprehensive code analysis with prioritized feedback through workflow-driven investigation**

The `codereview` tool provides professional code review capabilities with actionable feedback, severity-based issue prioritization, and support for various review types from quick style checks to comprehensive security audits. This workflow tool guides Claude through systematic investigation steps with forced pauses between each step to ensure thorough code examination, issue identification, and quality assessment before providing expert analysis.

## How It Works

The codereview tool implements a **multi-step workflow** that ensures thorough code examination:

**Investigation Phase (Claude-Led):**
1. **Step 1**: Claude describes the review plan and begins systematic analysis of code structure
2. **Step 2+**: Claude examines code quality, security implications, performance concerns, and architectural patterns
3. **Throughout**: Claude tracks findings, relevant files, issues, and confidence levels
4. **Completion**: Once review is comprehensive, Claude signals completion

**Expert Validation Phase:**
After Claude completes the investigation (unless confidence is **certain**):
- Complete review summary with all findings and evidence
- Relevant files and code patterns identified
- Issues categorized by severity levels
- Final recommendations based on investigation

Validation can be **external** (AI model validates findings) or **internal** (Claude validates independently).

## Example Prompts

```
Review auth.py for security issues and potential vulnerabilities using codereview
```

```
Run a codereview on the src/ directory, focus on performance bottlenecks and database queries
```

```
Do a quick codereview of utils.ts, only report critical and high severity issues
```

```
Start separate sub-tasks for codereview: one finding critical issues and one finding low priority
quick-wins, then give me the combined review
```

## Key Features

- **Issues prioritized by severity** (CRITICAL / HIGH / MEDIUM / LOW)
- **4 review types**: full, security, performance, quick
- **2 validation types**: external (AI model) or internal (Claude only)
- **Coding standards enforcement**: review against PEP8, ESLint, Google Style Guide, etc.
- **Severity filtering**: only report issues at or above a given severity
- **Focus areas**: direct the review toward specific concerns
- **Image support**: review code from screenshots, error dialogs, or visual bug reports
- **Multi-file analysis**: comprehensive review of entire directories or codebases
- **Actionable feedback**: specific recommendations with line numbers and code examples
- **Systematic file-by-file investigation**: tracks files checked vs. relevant files

## Tool Parameters

**Workflow Parameters (required each step):**
- `step` (string, required): Current investigation step description
- `step_number` (number, required): Current step number (>= 1)
- `total_steps` (number, required): Estimated total investigation steps (>= 1)
- `next_step_required` (boolean, required): Whether another investigation step is needed
- `findings` (string, required): Discoveries and evidence collected in this step

**Confidence and Continuation:**
- `confidence` (enum, optional): exploring | low | medium | high | very_high | almost_certain | certain
- `continuation_id` (string, optional): Continue a previous review discussion

**Model Configuration:**
- `model` (string, optional): Model to use for expert validation
- `temperature` (number, optional): Temperature for consistency (0-1)
- `thinking_mode` (enum, optional): minimal | low | medium | high | max
- `use_assistant_model` (boolean, optional, default: true): Whether to use expert validation phase

**File Tracking:**
- `files_checked` (string[], optional): All files examined during investigation
- `relevant_files` (string[], optional): Files directly relevant to the review
- `relevant_context` (string[], optional): Methods/functions/classes central to findings

**Issue Tracking:**
- `issues_found` (object[], optional): Issues identified with `description` and `severity`
- `images` (string[], optional): Visual references for review context

**Review Configuration:**
- `review_type` (enum, optional): full | security | performance | quick (default: full)
- `review_validation_type` (enum, optional): external | internal (default: external)
- `focus_on` (string, optional): Specific areas to emphasize (e.g., "security vulnerabilities")
- `standards` (string, optional): Coding standards or style guide to enforce
- `severity_filter` (enum, optional): critical | high | medium | low | all

## Review Types

**Full Review (default):**
- Comprehensive analysis including bugs, security, performance, maintainability
- Best for new features or significant code changes

**Security Review:**
- Focused on security vulnerabilities and attack vectors
- Checks for common security anti-patterns
- Best for authentication, authorization, data handling code

**Performance Review:**
- Analyzes performance bottlenecks and optimization opportunities
- Memory usage, algorithmic complexity, resource management
- Best for performance-critical code paths

**Quick Review:**
- Fast style and basic issue check
- Lower token usage for rapid feedback
- Best for code formatting and simple validation

## Severity Levels

Issues are categorized and prioritized:

- **CRITICAL**: Security vulnerabilities, crashes, data corruption
- **HIGH**: Logic errors, performance issues, reliability problems
- **MEDIUM**: Code smells, maintainability issues, minor bugs
- **LOW**: Style issues, documentation, minor improvements

## Usage Examples

**Basic Security Review:**
```
"Review the authentication module in auth/ for security vulnerabilities"
```

**Performance-Focused Review:**
```
"Review backend/api.py for performance issues, focus on database queries and caching"
```

**Quick Style Check:**
```
"Quick codereview of utils.py, only report critical and high severity issues"
```

**Standards Enforcement:**
```
"Review src/ directory against PEP8 standards, focus on code formatting and structure"
```

**Visual Context Review:**
```
"Review this authentication code along with the error dialog screenshot to understand the security implications"
```

## Best Practices

- **Provide context**: Describe what the code is supposed to do and any constraints
- **Use appropriate review types**: Security for auth code, performance for critical paths
- **Set severity filters**: Focus on critical issues for quick wins
- **Include relevant files**: Review related modules together for better context
- **Use parallel reviews**: Run multiple reviews with different models for comprehensive coverage
- **Follow up on findings**: Use the continuation feature to discuss specific issues in detail
- **Choose validation type**: Use external for important reviews, internal for quick checks

## When to Use CodeReview vs Other Tools

- **Use `codereview`** for: Finding bugs, security issues, performance problems, code quality assessment
- **Use `debug`** for: Diagnosing specific runtime errors or exceptions
- **Use `analyze`** for: Understanding code structure without finding issues
- **Use `precommit`** for: Pre-commit validation of staged changes
- **Use `secaudit`** for: Deep security-focused auditing beyond general review
