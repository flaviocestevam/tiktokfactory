import { generateText } from "ai";
import { AI_MODEL, createLovableAiGatewayProvider } from "./ai-gateway.server";

export const REGRAS_SEGURANCA = `
REGRAS OBRIGATÓRIAS DE SEGURANÇA COMERCIAL:
- Nunca invente benefícios, resultados garantidos, descontos, preços, estoque, avaliações,
  certificações, ingredientes, prazos de entrega, garantias, dados clínicos, depoimentos,
  experiências pessoais, números de vendas, aprovações de especialistas ou características.
- Use apenas o que estiver nos dados fornecidos do produto.
- Quando faltar informação, escreva exatamente: "Esta informação não foi encontrada nos dados do produto."
- Diferencie claramente informação confirmada, sugestão de comunicação e hipótese a verificar.
- Para cosméticos e beleza: nada de promessas médicas, cura de doenças ou resultados garantidos.
- Nunca transforme opinião em fato técnico.
- Nunca escreva "undefined", "null" ou deixe variáveis não resolvidas no texto final.
- Todo texto voltado ao público deve ser em português do Brasil, natural e falado.
`.trim();

export async function callAI(system: string, prompt: string): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("A integração de IA não está configurada.");

  const gateway = createLovableAiGatewayProvider(key);

  try {
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      system: `${system}\n\n${REGRAS_SEGURANCA}`,
      prompt,
      providerOptions: { lovable: { reasoningEffort: "none" } },
    });
    return text;
  } catch (error) {
    throw normalizeAiError(error);
  }
}

export async function callAIJson<T>(system: string, prompt: string, shape: string): Promise<T> {
  const text = await callAI(
    `${system}\n\nResponda EXCLUSIVAMENTE com um JSON válido, sem markdown, sem crases, seguindo esta forma:\n${shape}`,
    prompt,
  );
  return parseJson<T>(text);
}

export function parseJson<T>(raw: string): T {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/```$/, "")
      .trim();
  }
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (start === -1 || end === -1)
    throw new Error("A IA retornou um formato inesperado. Tente gerar novamente.");
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    throw new Error("A IA retornou um formato inesperado. Tente gerar novamente.");
  }
}

function normalizeAiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("429")) {
    return new Error("Limite de requisições atingido. Aguarde alguns instantes e tente novamente.");
  }
  if (message.includes("402")) {
    return new Error(
      "Os créditos de IA acabaram. Adicione créditos em Configurações para continuar gerando.",
    );
  }
  return new Error(`Falha ao gerar conteúdo com a IA: ${message}`);
}
