import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const AI_MODEL = "openai/gpt-5.6-sol";

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}