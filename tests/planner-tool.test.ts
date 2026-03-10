import { describe, expect, test } from "bun:test";

import type { BabConfig } from "../src/config";
import { ConversationStore } from "../src/memory/conversations";
import { ProviderRegistry } from "../src/providers/registry";
import { createPlannerTool } from "../src/tools/planner";

function createConfig(env: Record<string, string> = {}): BabConfig {
  return {
    env,
    paths: {
      baseDir: "/tmp/.config/bab",
      envFile: "/tmp/.config/bab/env",
      pluginsDir: "/tmp/.config/bab/plugins",
      promptsDir: "/tmp/.config/bab/prompts",
    },
  };
}

describe("planner tool", () => {
  test("produces planning output without expert-analysis follow-up", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const tool = createPlannerTool({
      conversationStore: new ConversationStore(),
      providerRegistry: new ProviderRegistry({
        config: createConfig({
          OPENAI_API_KEY: "openai-key",
        }),
        generateTextFn: async (args) => {
          calls.push(args as Record<string, unknown>);

          return {
            finishReason: "stop",
            providerMetadata: undefined,
            reasoning: [],
            request: {},
            response: {
              id: "resp_planner",
              modelId: "gpt-5.2",
              timestamp: new Date("2026-03-10T12:00:00.000Z"),
            },
            steps: [],
            text: "planning-response",
            usage: {
              inputTokens: 20,
              outputTokens: 5,
              totalTokens: 25,
            },
            warnings: undefined,
          } as never;
        },
      }),
    });
    const result = await tool.execute({
      branch_from_step: 1,
      branch_id: "migration-path",
      is_branch_point: true,
      more_steps_needed: true,
      next_step_required: false,
      step: "Define the migration phases",
      step_number: 2,
      total_steps: 2,
    });

    expect(result.ok).toBeTrue();

    if (!result.ok) {
      throw new Error("Expected planner success");
    }

    expect(calls).toHaveLength(1);
    expect(String(calls[0]?.prompt)).toContain("migration-path");

    const payload = JSON.parse(result.value.content ?? "{}");

    expect(payload.response).toBe("planning-response");
    expect(payload.is_branch_point).toBeTrue();
    expect(payload.branch_id).toBe("migration-path");
    expect(payload.more_steps_needed).toBeTrue();
  });
});
