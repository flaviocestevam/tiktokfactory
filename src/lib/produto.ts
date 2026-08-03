import type { ProductDraft } from "@/components/ProductForm";
import type { TablesInsert } from "@/integrations/supabase/types";

const CAMPOS_TEXTO = [
  "nome",
  "link",
  "marca",
  "vendedor",
  "categoria",
  "publico",
  "preco",
  "preco_promocional",
  "desconto",
  "cupom",
  "frete",
  "tamanho",
  "cores",
  "variacoes",
  "quantidade_vendida",
  "numero_avaliacoes",
  "descricao",
  "beneficios",
  "caracteristicas",
  "diferenciais",
  "ingredientes",
  "modo_de_uso",
  "informacoes_tecnicas",
  "avaliacoes",
  "duvidas_frequentes",
  "advertencias",
  "restricoes",
  "entrega",
  "garantias",
  "oferta",
  "dados_adicionais",
] as const;

export function montarPayloadProduto(valores: ProductDraft): TablesInsert<"products"> {
  const payload: Record<string, unknown> = {};

  for (const campo of CAMPOS_TEXTO) {
    const valor = valores[campo];
    payload[campo] =
      typeof valor === "string" && valor.trim()
        ? valor.trim()
        : campo === "nome"
          ? "Produto sem nome"
          : null;
  }

  payload.status_extracao = "manual";
  payload.extraction_status = "manual";
  payload.extraction_method = "manual_form";
  payload.extraction_attempts = 0;
  payload.extraction_error_code = null;

  return payload as TablesInsert<"products">;
}

export function produtoParaDraft(row: Record<string, unknown>): ProductDraft {
  const draft: ProductDraft = {};

  for (const campo of CAMPOS_TEXTO) {
    draft[campo] = (row[campo] as string | null) ?? "";
  }

  draft.status_extracao = "manual";
  return draft;
}
