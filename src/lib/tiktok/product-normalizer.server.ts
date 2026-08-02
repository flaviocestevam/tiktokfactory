/* eslint-disable @typescript-eslint/no-explicit-any */
// Camada 6: a IA apenas organiza e normaliza o que foi capturado. Nunca inventa.
import { callAIJson } from "../ai.server";
import { CAMPOS_PRODUTO, OFERTA_VAZIA, type DadosProduto, type Oferta } from "./types";
import type { ConteudoExtraido } from "./structured-extractor.server";

const SHAPE = `{"produto":{${CAMPOS_PRODUTO.map((c) => `"${c}":""`).join(",")}},"oferta":{"current_price_value":"","current_price_formatted":"","original_price_value":"","original_price_formatted":"","currency_code":"","currency_symbol":"","discount_text":""},"pagina_de_produto":true,"product_id":"","country_code":"","source_language":""}`;

const SISTEMA = `Você organiza dados já capturados de uma página de produto do TikTok Shop, em qualquer idioma.
- Só preencha um campo se a informação estiver realmente presente no conteúdo fornecido.
- Nunca invente, nunca deduza, nunca converta moedas, nunca traduza nesta etapa.
- Preserve o idioma original dos textos e o formato original de preços e moedas.
- Não troque preço atual por preço anterior: o preço atual é o que o comprador paga agora.
- "pagina_de_produto" deve ser false se o conteúdo for categoria, coleção, home, login, captcha ou erro.
- Deixe string vazia quando não encontrar.`;

export type SaidaNormalizada = {
  dados: DadosProduto;
  oferta: Oferta;
  pagina_de_produto: boolean;
  product_id: string | null;
  country_code: string | null;
  source_language: string | null;
};

export async function normalizarProduto(
  conteudo: ConteudoExtraido,
  contexto: { url: string; product_id: string | null; country_code: string | null },
): Promise<SaidaNormalizada> {
  const out = await callAIJson<any>(
    SISTEMA,
    `Organize os dados deste produto do TikTok Shop.
URL final: ${contexto.url}
ID esperado do produto: ${contexto.product_id ?? "desconhecido"}
País detectado: ${contexto.country_code ?? "desconhecido"}

CONTEÚDO CAPTURADO:
${conteudo.bruto}`,
    SHAPE,
  );

  const produto: DadosProduto = {};
  for (const campo of CAMPOS_PRODUTO) {
    const valor = String(out?.produto?.[campo] ?? "").trim();
    if (valor && !/^(undefined|null|n\/a|-)$/i.test(valor)) produto[campo] = valor;
  }
  const oferta: Oferta = { ...OFERTA_VAZIA };
  for (const chave of Object.keys(OFERTA_VAZIA) as Array<keyof Oferta>) {
    oferta[chave] = String(out?.oferta?.[chave] ?? "").trim();
  }
  return {
    dados: produto,
    oferta,
    pagina_de_produto: out?.pagina_de_produto !== false,
    product_id: String(out?.product_id ?? "").trim() || null,
    country_code: String(out?.country_code ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 2) || null,
    source_language: String(out?.source_language ?? "").trim().toLowerCase() || null,
  };
}

const CAMPOS_COMERCIAIS = [
  "preco",
  "descricao",
  "vendedor",
  "marca",
  "caracteristicas",
  "beneficios",
  "variacoes",
] as const;

/** Critério mínimo de sucesso: nome + dois campos comerciais reais (nenhuma imagem envolvida). */
export function validarExtracao(
  dados: DadosProduto,
  oferta: Oferta,
): { ok: boolean; comerciais: number } {
  const comerciais =
    CAMPOS_COMERCIAIS.filter((c) => String(dados[c] ?? "").trim().length > 2).length +
    (oferta.current_price_formatted || oferta.current_price_value ? 1 : 0);
  const ok = Boolean(String(dados.nome ?? "").trim()) && comerciais >= 2;
  return { ok, comerciais };
}
