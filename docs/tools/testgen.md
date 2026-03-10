---
title: TestGen
layout: default
parent: Tool Reference
nav_order: 11
---

# TestGen Tool - Comprehensive Test Generation

**Generates thorough test suites with edge case coverage through workflow-driven investigation**

The `testgen` tool creates comprehensive test suites by analyzing your code paths, understanding intricate dependencies, and identifying realistic edge cases and failure scenarios that need test coverage. This workflow tool guides Claude through systematic investigation of code functionality, critical paths, edge cases, and integration points across multiple steps before generating comprehensive tests with realistic failure mode analysis.

## How the Workflow Works

The testgen tool implements a **structured workflow** for comprehensive test generation:

**Investigation Phase (Claude-Led):**
1. **Step 1**: Claude describes the test generation plan and begins analyzing code functionality
2. **Step 2+**: Claude examines critical paths, edge cases, error handling, and integration points
3. **Throughout**: Claude tracks findings, test scenarios, and coverage gaps
4. **Completion**: Once investigation is thorough, Claude signals completion

**Expert Validation Phase:**
After Claude completes the investigation (enabled by default via `use_assistant_model`):
- Complete test scenario catalog with all edge cases
- Framework-specific test generation
- Realistic failure mode coverage
- Final test suite with comprehensive coverage

This workflow ensures methodical analysis before test generation, resulting in more thorough and valuable test suites.

## Example Prompts

**Basic Usage:**
```
"Use bab to generate tests for User.login() method"
"Generate comprehensive tests for the sorting method in src/new_sort.py"
"Create tests for edge cases not already covered in our tests"
```

## Key Features

- **Multi-step workflow** analyzing code paths and identifying realistic failure modes
- **Generates framework-specific tests** following project conventions
- **Supports test pattern following** when examples are provided
- **Specific code coverage** - target specific functions/classes rather than testing everything
- **Edge case identification** - systematic discovery of boundary conditions and error states
- **Realistic failure mode analysis** - understanding what can actually go wrong in production
- **Integration test support** - tests that cover component interactions and system boundaries
- **Image support** - test UI components, analyze visual requirements
- **Expert validation** - external model validates test completeness (enabled by default)

## Tool Parameters

**Workflow Investigation Parameters (used during step-by-step process):**
- `step` (string, required): Current investigation step description
- `step_number` (number, required): Current step number in test generation sequence
- `total_steps` (number, required): Estimated total investigation steps (adjustable)
- `next_step_required` (boolean, required): Whether another investigation step is needed
- `findings` (string, required): Discoveries about code paths and edge cases
- `files_checked` (string[], optional): All files examined during investigation
- `relevant_files` (string[], optional): Files directly needing tests
- `relevant_context` (string[], optional): Methods/functions/classes requiring test coverage
- `issues_found` (object[], optional): Issues identified during investigation
- `confidence` (enum, optional): Confidence level in test plan completeness - exploring|low|medium|high|very_high|almost_certain|certain

**Configuration Parameters (optional):**
- `model` (string, optional): Model to use for expert validation
- `temperature` (number, optional): Temperature for response generation
- `thinking_mode` (string, optional): Thinking budget for extended thinking models
- `continuation_id` (string, optional): Continue a previous test generation session
- `images` (string[], optional): Screenshots or visual references for UI component testing
- `use_assistant_model` (boolean, optional, default: true): Whether to use expert validation phase

## Usage Examples

**Method-Specific Tests:**
```
"Generate tests for User.login() method covering authentication success, failure, and edge cases"
```

**Class Testing:**
```
"Generate comprehensive tests for PaymentProcessor class"
```

**Following Existing Patterns:**
```
"Generate tests for new authentication module following patterns from tests/unit/auth/"
```

**UI Component Testing:**
```
"Generate tests for this login form component using the UI mockup screenshot"
```

**Algorithm Testing:**
```
"Create thorough tests for the sorting algorithm in utils/sort.py, focus on edge cases and performance"
```

**Integration Testing:**
```
"Generate integration tests for the payment processing pipeline from order creation to completion"
```

## Test Generation Strategy

**Code Path Analysis:**
- Identifies all execution paths through the code
- Maps conditional branches and loops
- Discovers error handling paths
- Analyzes state transitions

**Edge Case Discovery:**
- Boundary value analysis (empty, null, max values)
- Invalid input scenarios
- Race conditions and timing issues
- Resource exhaustion cases

**Failure Mode Analysis:**
- External dependency failures
- Network and I/O errors
- Authentication and authorization failures
- Data corruption scenarios

**Framework Detection:**
The tool automatically detects and generates tests for:
- **Python**: pytest, unittest, nose2
- **JavaScript**: Jest, Mocha, Jasmine, Vitest
- **Java**: JUnit 4/5, TestNG, Mockito
- **Go**: testing package
- **And more**: Adapts to project conventions

## Best Practices

- **Be specific about scope**: Target specific functions/classes rather than requesting tests for everything
- **Provide test examples**: Include existing test files for pattern consistency
- **Focus on critical paths**: Prioritize testing of business-critical functionality
- **Include visual context**: Screenshots or mockups for UI component testing
- **Describe testing objectives**: Explain what aspects are most important to test
- **Consider test maintenance**: Request readable, maintainable test code
- **Multi-step investigation**: Let the tool thoroughly analyze code before generating tests

## When to Use TestGen vs Other Tools

- **Use `testgen`** for: Creating comprehensive test suites, filling test coverage gaps, testing new features
- **Use `codereview`** for: Finding bugs and reviewing existing test quality
- **Use `analyze`** for: Understanding code structure without generating tests
- **Use `debug`** for: Diagnosing specific test failures or runtime issues
