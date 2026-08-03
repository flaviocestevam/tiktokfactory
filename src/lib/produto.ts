import type { ProductDraft } from "@/components/ProductForm";
import type { TablesInsert } from "@/integrations/supabase/types";

const CAMPOS_ANTIGOS = [
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
] as const;

function textoColado(valores: ProductDraft): string {
  return String(
    valores.descricao_colada ??
      valores.dados_adicionais ??
      valores.descricao ??
      "",
  ).trim();
}

function removerCondicoesComerciais(texto: string): string {
  return texto
    .split(/\r?\n/)
    .filter((linha) => {
      const normalizada = linha.trim();
      if (!normalizada) return true;
      return !(
        /R\$\s*\d/i.test(normalizada) ||
        /^(preço|preco|valor|por apenas|de r\$|por r\$|cupom|frete|desconto|promoção|promocao|oferta)\b/i.test(
          normalizada,
        )
      );
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extrairNomeDoTexto(texto: string): string {
  const linhas = texto
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter(Boolean);

  const candidata =
    linhas.find(
      (linha) =>
        !/^https?:\/\//i.test(linha) &&
        !/^(r\$|preço|preco|por\s+r\$|de\s+r\$)/i.test(linha),
    ) ?? "Produto";

  const limpa = candidata
    .replace(/^(título|titulo|nome do produto|produto)\s*[:\-]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return (limpa || "Produto").slice(0, 180);
}

export function montarPayloadProduto(
  valores: ProductDraft,
): TablesInsert<"products"> {
  const textoOriginal = textoColado(valores);
  const textoParaRoteiro =
    removerCondicoesComerciais(textoOriginal) || textoOriginal;
  const nome = extrairNomeDoTexto(textoOriginal);
  const payload: Record<string, unknown> = {
    nome,
    descricao_colada: textoOriginal,
    descricao: textoParaRoteiro,
    dados_adicionais: textoParaRoteiro,
    link: null,
    status_extracao: "success",
    extraction_status: "success",
    extraction_method: "pasted_text",
    extraction_attempts: 0,
    extraction_error_code: null,
    normalized_product_data: {
      texto_para_roteiro: textoParaRoteiro,
    },
    original_product_data: { texto_original: textoOriginal },
    dados_extraidos: { texto_para_roteiro: textoParaRoteiro },
    origem_dados: { texto_para_roteiro: "usuario" },
  };

  for (const campo of CAMPOS_ANTIGOS) payload[campo] = null;

  return payload as TablesInsert<"products">;
}

export function produtoParaDraft(
  row: Record<string, unknown>,
): ProductDraft {
  const textoExistente = String(
    row.descricao_colada ?? row.dados_adicionais ?? "",
  ).trim();

  if (textoExistente) return { descricao_colada: textoExistente };

  const blocos = [
    row.nome,
    row.descricao,
    row.beneficios,
    row.caracteristicas,
    row.diferenciais,
    row.ingredientes,
    row.modo_de_uso,
    row.informacoes_tecnicas,
  ]
    .map((valor) => String(valor ?? "").trim())
    .filter(Boolean);

  return { descricao_colada: blocos.join("\n\n") };
}
