/* eslint-disable @typescript-eslint/no-explicit-any */
// Tradução automática para português do Brasil, preservando nomes próprios e números.
import { callAIJson } from "../ai.server";
import type { DadosProduto } from "./types";

const TRADUZIVEIS = [
  "descricao",
  "beneficios",
  "caracteristicas",
  "ingredientes",
  "modo_de_uso",
  "publico",
  "informacoes_tecnicas",
  "duvidas_frequentes",
  "advertencias",
  "restricoes",
  "diferenciais",
  "garantias",
  "entrega",
  "frete",
  "oferta",
  "categoria",
  "subcategoria",
  "variacoes",
  "tamanho",
  "cores",
] as const;

const SISTEMA = `Você traduz textos de produto para português do Brasil.
- Traduza apenas o que for enviado, mantendo o mesmo significado.
- Não invente informação, não resuma a ponto de perder dados, não adicione promessas.
- Nunca traduza nem altere: nome de marca, nome do vendedor, códigos, SKUs, números, moedas e valores.
- Devolva string vazia para campos vazios.`;

/** Traduz apenas os campos descritivos; nome oficial, marca e vendedor ficam intactos. */
export async function traduzirParaPtBr(
  dados: DadosProduto,
  idiomaOrigem: string | null,
): Promise<DadosProduto> {
  const idioma = (idiomaOrigem ?? "").toLowerCase();
  if (idioma.startsWith("pt")) return { ...dados };

  const entrada: Record<string, string> = {};
  for (const campo of TRADUZIVEIS) {
    const valor = String(dados[campo] ?? "").trim();
    if (valor) entrada[campo] = valor.slice(0, 4000);
  }
  if (!Object.keys(entrada).length) return { ...dados };

  try {
    const shape = `{${Object.keys(entrada)
      .map((k) => `"${k}":""`)
      .join(",")}}`;
    const out = await callAIJson<Record<string, string>>(
      SISTEMA,
      `Traduza para português do Brasil os campos abaixo (idioma de origem: ${idiomaOrigem ?? "desconhecido"}).\n\n${JSON.stringify(entrada)}`,
      shape,
    );
    const saida: DadosProduto = { ...dados };
    for (const [chave, valor] of Object.entries(out ?? {})) {
      const texto = String(valor ?? "").trim();
      if (texto) (saida as any)[chave] = texto;
    }
    return saida;
  } catch (e) {
    console.error("[tiktok] falha ao traduzir:", e instanceof Error ? e.message : e);
    return { ...dados };
  }
}
