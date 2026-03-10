# Milestone 6 — Core Tools (Phase 2)

status: completed
progress: 6/6
last_updated: 2026-03-10
last_task: M6-T06
blocked_by: m1_mcp_server_core
unlocks: m7_specialized_tools

---

## Goal

Port the 5 core PAL tools to TypeScript using composition pattern and Vercel AI SDK.

Exit criteria: chat, thinkdeep, codereview, planner, consensus tools work with conversation memory and produce output matching PAL behavior.

---

## Tasks

### M6-T01: Tool framework
- [ ] src/tools/base.ts — Tool interface (name, description, schema, execute)
- [ ] src/tools/simple.ts — SimpleTool: one-shot request -> AI call -> response
- [ ] src/tools/workflow/runner.ts — WorkflowRunner: multi-step orchestration via composition
      - Takes Tool config + Provider as constructor args (not inheritance)
      - Manages: step tracking, findings consolidation, expert analysis trigger
      - Returns Result<ToolOutput, ToolError> (not exceptions)
- [ ] File embedding: read files, count tokens, fit within model budget
- [ ] Conversation integration: load thread, embed history, record turns
- Output: framework that tools plug into
- Deps: M1-T03, M1-T04, M1-T08
- Status: completed

### M6-T02: chat tool
- [ ] Port from code/pal-mcp-server/tools/chat.py
- [ ] SimpleTool: prompt + model -> AI response
- [ ] Conversation memory via continuation_id
- [ ] File embedding support
- [ ] System prompt from src/prompts/chat.ts
- Output: working chat tool
- Deps: M6-T01
- Status: completed

### M6-T03: thinkdeep tool
- [ ] Port from code/pal-mcp-server/tools/thinkdeep.py
- [ ] WorkflowTool: multi-step investigation with expert analysis
- [ ] Step tracking: step_number, findings, confidence, hypothesis
- [ ] Expert analysis trigger when confidence=certain or next_step_required=false
- [ ] System prompt from src/prompts/thinkdeep.ts
- Output: working thinkdeep tool
- Deps: M6-T01
- Status: completed

### M6-T04: codereview tool
- [ ] Port from code/pal-mcp-server/tools/codereview.py
- [ ] WorkflowTool with file-heavy embedding
- [ ] Multi-step code investigation with expert analysis
- [ ] System prompt from src/prompts/codereview.ts
- Output: working codereview tool
- Deps: M6-T01
- Status: completed

### M6-T05: planner tool
- [ ] Port from code/pal-mcp-server/tools/planner.py
- [ ] WorkflowTool: sequential planning with step guidance
- [ ] System prompt from src/prompts/planner.ts
- Output: working planner tool
- Deps: M6-T01
- Status: completed

### M6-T06: consensus tool
- [ ] Port from code/pal-mcp-server/tools/consensus.py
- [ ] WorkflowTool: multi-model debate with stance support
- [ ] Orchestrates multiple AI calls (one per model in the roster)
- [ ] Conversation memory for accumulated responses
- [ ] System prompt from src/prompts/consensus.ts
- Output: working consensus tool
- Deps: M6-T01
- Status: completed
