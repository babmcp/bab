import { z } from "zod/v4";

import { ToolContentTypeSchema, ToolErrorSchema } from "./tools";

export const DelegateEventBaseSchema = z.object({
  run_id: z.string().min(1, "run_id must not be empty"),
  provider_id: z.string().min(1, "provider_id must not be empty"),
  timestamp: z.string().datetime({ offset: true }),
});

export const OutputEventSchema = DelegateEventBaseSchema.extend({
  type: z.literal("output"),
  content: z.string().min(1, "content must not be empty"),
  content_type: ToolContentTypeSchema.default("text"),
});

export const ToolActivityEventSchema = DelegateEventBaseSchema.extend({
  type: z.literal("tool_activity"),
  tool_name: z.string().min(1, "tool_name must not be empty"),
  message: z.string().min(1, "message must not be empty"),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const ProgressEventSchema = DelegateEventBaseSchema.extend({
  type: z.literal("progress"),
  message: z.string().min(1, "message must not be empty"),
  percentage: z
    .number()
    .min(0, "percentage must be between 0 and 100")
    .max(100, "percentage must be between 0 and 100")
    .optional(),
});

export const ErrorEventSchema = DelegateEventBaseSchema.extend({
  type: z.literal("error"),
  error: ToolErrorSchema,
});

export const DoneEventSchema = DelegateEventBaseSchema.extend({
  type: z.literal("done"),
  summary: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const DelegateEventSchema = z.discriminatedUnion("type", [
  OutputEventSchema,
  ToolActivityEventSchema,
  ProgressEventSchema,
  ErrorEventSchema,
  DoneEventSchema,
]);

export type DelegateEvent = z.infer<typeof DelegateEventSchema>;
export type DelegateEventBase = z.infer<typeof DelegateEventBaseSchema>;
export type OutputEvent = z.infer<typeof OutputEventSchema>;
export type ToolActivityEvent = z.infer<typeof ToolActivityEventSchema>;
export type ProgressEvent = z.infer<typeof ProgressEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;
export type DoneEvent = z.infer<typeof DoneEventSchema>;
