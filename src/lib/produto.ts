import type { ProductDraft } from "@/components/ProductForm";
import type { TablesInsert } from "@/integrations/supabase/types";

const CAMPOS_TEXTO = [
  "nome",
  "marca",
  "categoria",
  "preco",
  "preco_promocional",
  "tamanho",
  "cores",
  "variacoes",
  "publico",
  "descricao",
  "beneficios",
  "caracteristicas",
  "ingredientes",
  "modo_de_uso",
  "informacoes_tecnicas",
  "avaliacoes",
  "duvidas_frequentes",
  "advertencias",
  "restricoes",
  "diferenciais",
  "entrega",
  "garantias",
  "oferta",
  "dados_adicionais",
  "link",
] as const;

export function montarPayloadProduto(valores: ProductDraft): TablesInsert<"products"> {
  const payload: Record<string, unknown> = {};
  for (const campo of CAMPOS_TEXTO) {
    const v = valores[campo];
    payload[campo] = typeof v === "string" && v.trim() ? v.trim() : campo === "nome" ? "Produto sem nome" : null;
  }
  payload.imagens = valores.imagens ?? [];
  payload.status_extracao = typeof valores.status_extracao === "string" ? valores.status_extracao : "manual";
  return payload as TablesInsert<"products">;
}

export function produtoParaDraft(row: Record<string, unknown>): ProductDraft {
  const draft: ProductDraft = { imagens: Array.isArray(row.imagens) ? (row.imagens as string[]) : [] };
  for (const campo of CAMPOS_TEXTO) {
    draft[campo] = (row[campo] as string | null) ?? "";
  }
  draft.status_extracao = (row.status_extracao as string) ?? "manual";
  return draft;
}