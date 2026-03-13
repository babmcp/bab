import { z } from "zod/v4";

export const providerIdValues = [
  "google",
  "openai",
  "anthropic",
  "openrouter",
  "custom",
] as const;

export const ProviderIdSchema = z.enum(providerIdValues);

export const ModelCapabilitiesSchema = z.object({
  context_window: z
    .number()
    .int()
    .positive("context_window must be a positive integer"),
  supports_thinking: z.boolean(),
  supports_vision: z.boolean().default(false),
  supports_images: z.boolean().default(false),
  score: z.number().int().min(0, "score must be zero or greater"),
  aliases: z.array(z.string().min(1)).default([]),
  description: z.string().min(1).optional(),
});

export const ModelInfoSchema = z.object({
  id: z.string().min(1, "id must not be empty"),
  provider: ProviderIdSchema,
  display_name: z.string().min(1).optional(),
  capabilities: ModelCapabilitiesSchema,
});

export type ProviderId = z.infer<typeof ProviderIdSchema>;
export type ModelCapabilities = z.infer<typeof ModelCapabilitiesSchema>;
export type ModelInfo = z.infer<typeof ModelInfoSchema>;
