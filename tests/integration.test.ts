import { afterEach, describe, expect, test } from "bun:test";

import { createBabTestHarness } from "./harness";

const activeHarnesses: Array<Awaited<ReturnType<typeof createBabTestHarness>>> = [];

afterEach(async () => {
  while (activeHarnesses.length > 0) {
    const harness = activeHarnesses.pop();

    if (harness) {
      await harness.close();
    }
  }
});

describe("Bab MCP server integration", () => {
  test("starts, lists core tools, and shuts down cleanly", async () => {
    const harness = await createBabTestHarness();

    activeHarnesses.push(harness);

    const result = await harness.listTools();
    const toolNames = result.tools.map((tool) => tool.name).sort();

    expect(toolNames).toEqual([
      "analyze",
      "challenge",
      "chat",
      "codereview",
      "consensus",
      "debug",
      "delegate",
      "docgen",
      "list_models",
      "planner",
      "precommit",
      "refactor",
      "secaudit",
      "testgen",
      "thinkdeep",
      "tracer",
      "version",
    ]);
  });
});
