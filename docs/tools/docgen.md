---
title: DocGen
layout: default
parent: Tool Reference
nav_order: 12
---

# DocGen Tool - Comprehensive Documentation Generation

**Generates comprehensive documentation with complexity analysis through workflow-driven investigation**

The `docgen` tool creates thorough documentation by analyzing your code structure, understanding function complexity, and documenting gotchas and unexpected behaviors that developers need to know. This workflow tool guides Claude through systematic investigation of code functionality, architectural patterns, and documentation needs across multiple steps before generating comprehensive documentation with complexity analysis and call flow information.

## How the Workflow Works

The docgen tool implements a **structured workflow** for comprehensive documentation generation:

**Investigation Phase (Claude-Led):**
1. **Step 1 (Discovery)**: Claude discovers ALL files needing documentation and reports exact count
2. **Step 2+ (Documentation)**: Claude documents files one-by-one with complete coverage validation
3. **Throughout**: Claude tracks progress with counters (`num_files_documented` / `total_files_to_document`)
4. **Completion**: Only when all files are documented (num_files_documented = total_files_to_document)

**Documentation Generation Phase:**
After Claude completes the investigation:
- Complete documentation strategy with style consistency
- Function/method documentation with complexity analysis
- Call flow and dependency documentation
- Gotchas and unexpected behavior documentation
- Final polished documentation following project standards

Expert validation is **off by default** (`use_assistant_model: false`) since docgen is self-contained. Enable it explicitly when external review is needed.

This workflow ensures methodical analysis before documentation generation, resulting in more comprehensive and valuable documentation.

## Example Prompts

**Basic Usage:**
```
"Use bab to generate documentation for the UserManager class"
"Document the authentication module with complexity analysis"
"Add comprehensive documentation to all methods in src/payment_processor.py"
```

## Key Features

- **Systematic file-by-file approach** - complete documentation with progress tracking and validation
- **Big O complexity analysis** - algorithmic complexity for functions and methods (configurable via `document_complexity`)
- **Call flow documentation** - dependencies and method relationships (configurable via `document_flow`)
- **Inline comment generation** - comments on complex algorithmic logic (configurable via `comments_on_complex_logic`)
- **Existing documentation updating** - polish outdated or incomplete docs (configurable via `update_existing`)
- **Counter-based completion** - prevents stopping until all files are documented
- **Progress tracking** - `num_files_documented` / `total_files_to_document` counters
- **Expert validation off by default** - self-contained workflow, no external model needed

## Tool Parameters

**Workflow Parameters (used during step-by-step process):**
- `step` (string, required): Current step description - discovery phase (step 1) or documentation phase (step 2+)
- `step_number` (number, required): Current step number in documentation sequence
- `total_steps` (number, required): Estimated total steps (dynamically calculated as 1 + total_files_to_document)
- `next_step_required` (boolean, required): Whether another step is needed
- `findings` (string, required): Discoveries about code structure and documentation needs
- `num_files_documented` (number, required, >= 0): Counter tracking completed files
- `total_files_to_document` (number, required, >= 0): Total count of files needing documentation
- `files_checked` (string[], optional): All files examined during investigation
- `relevant_files` (string[], optional): Files being actively documented in current step
- `relevant_context` (string[], optional): Methods/functions/classes being documented
- `issues_found` (object[], optional): Issues identified during investigation
- `confidence` (enum, optional): Confidence level - exploring|low|medium|high|very_high|almost_certain|certain

**Configuration Parameters (optional):**
- `document_complexity` (boolean, optional, default: true): Include Big O complexity analysis
- `document_flow` (boolean, optional, default: true): Include call flow and dependency information
- `comments_on_complex_logic` (boolean, optional, default: true): Add inline comments for complex algorithmic steps
- `update_existing` (boolean, optional, default: true): Update existing documentation when incorrect/incomplete
- `model` (string, optional): Model to use for expert validation
- `temperature` (number, optional): Temperature for response generation
- `thinking_mode` (string, optional): Thinking budget for extended thinking models
- `continuation_id` (string, optional): Continue a previous documentation session
- `images` (string[], optional): Screenshots or diagrams for visual context
- `use_assistant_model` (boolean, optional, default: false): Expert validation OFF by default

## Usage Examples

**Class Documentation:**
```
"Generate comprehensive documentation for the PaymentProcessor class including complexity analysis"
```

**Module Documentation:**
```
"Document all functions in the authentication module with call flow information"
```

**API Documentation:**
```
"Create documentation for the REST API endpoints in api/users.py with parameter gotchas"
```

**Algorithm Documentation:**
```
"Document the sorting algorithm in utils/sort.py with Big O analysis and edge cases"
```

**Library Documentation:**
```
"Add comprehensive documentation to the utility library with usage examples and warnings"
```

## Documentation Standards

**Function/Method Documentation:**
- Parameter types and descriptions
- Return value documentation with types
- Algorithmic complexity analysis (Big O notation)
- Call flow and dependency information
- Purpose and behavior explanation
- Exception types and conditions

**Gotchas and Edge Cases:**
- Parameter combinations that produce unexpected results
- Hidden dependencies on global state or environment
- Order-dependent operations where sequence matters
- Performance implications and bottlenecks
- Thread safety considerations
- Platform-specific behavior differences

**Code Quality Documentation:**
- Inline comments for complex logic
- Design pattern explanations
- Architectural decision rationale
- Usage examples and best practices

## Documentation Features Generated

**Complexity Analysis:**
- Time complexity (Big O notation)
- Space complexity when relevant
- Worst-case, average-case, and best-case scenarios
- Performance characteristics and bottlenecks

**Call Flow Documentation:**
- Which methods/functions this code calls
- Which methods/functions call this code
- Key dependencies and interactions
- Side effects and state modifications
- Data flow through functions

**Gotchas Documentation:**
- Non-obvious parameter interactions
- Hidden state dependencies
- Silent failure conditions
- Resource management requirements
- Version compatibility issues

## Best Practices

- **Use systematic approach**: Tool documents all files with progress tracking and validation
- **Trust the counters**: Tool prevents premature completion until all files are documented
- **Configuration matters**: Enable complexity analysis and call flow for comprehensive docs
- **Modern styles enforced**: Tool ensures correct documentation style per language
- **Bug tracking**: Tool surfaces issues without altering code - review findings after completion
- **Enable expert validation selectively**: Set `use_assistant_model: true` for critical documentation

## When to Use DocGen vs Other Tools

- **Use `docgen`** for: Creating comprehensive documentation, adding missing docs, improving existing documentation
- **Use `analyze`** for: Understanding code structure without generating documentation
- **Use `codereview`** for: Reviewing code quality including documentation completeness
- **Use `chat`** for: Quick questions about code without full documentation generation
