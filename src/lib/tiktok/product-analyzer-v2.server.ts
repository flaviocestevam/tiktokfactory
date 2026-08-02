/* eslint-disable @typescript-eslint/no-explicit-any */
import { analisarProdutoTikTokShop as analisarComMotorLegado } from "./product-analyzer.server";
import { apifyProdutoDisponivel, lerProdutoComApify } from "./apify-product.server";
import { normalizarLinkTikTokShop } from "./normalize-url.server";
import { traduzirParaPtBr } from "./product-translator.server";
import { validarExtracao } from "./product-normalizer.server";
import {
  CAMPOS_PRODUTO,
  OFERTA_VAZIA,
  type DadosProduto,
  type Oferta,
  type ResultadoAnalise,
} from "./types";

const IDIOMA_POR_PAIS: Record<string, string> = {
  BR: "pt-BR",
  US: "en-US",
  GB: "en-GB",
  UK: "en-GB",
  JP: "ja-JP",
  TH: "th-TH",
  ID: "id-ID",
  MY: "ms-MY",
  SG: "en-SG",
  PH: "en-PH",
  VN: "vi-VN",
  MX: "es-MX",
  FR: "fr-FR",
  DE: "de-DE",
  ES: "es-ES",
  IT: "it-IT",
  IE: "en-IE",
};

function objeto(valor: unknown): Record<string, any> | null {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, any>)
    : null;
}

function limparDados(valor: unknown): DadosProduto {
  const entrada = objeto(valor) ?? {};
  const saida: DadosProduto = {};
  for (const campo of CAMPOS_PRODUTO) {
    const texto = String(entrada[campo] ?? "").trim();
    if (texto && !/^(undefined|null|n\/a|-)$/i.test(texto)) saida[campo] = texto;
  }
  return saida;
}

function limparOferta(valor: unknown): Oferta {
  const entrada = objeto(valor) ?? {};
  const saida: Oferta = { ...OFERTA_VAZIA };
  for (const chave of Object.keys(OFERTA_VAZIA) as Array<keyof Oferta>) {
    saida[chave] = String(entrada[chave] ?? "").trim();
  }
  return saida;
}

function lerRegistro(leitura: { rede: Array<{ corpo: string }> }) {
  for (const resposta of leitura.rede) {
    try {
      const parsed = JSON.parse(resposta.corpo);
      if (parsed && typeof parsed === "object") return parsed as Record<string, any>;
    } catch {
      // Tenta a próxima resposta estruturada.
    }
  }
  return null;
}

/**
 * Rota principal simples e previsível:
 * 1. normaliza URL/ID/país;
 * 2. consulta um scraper de produto com proxy residencial e solução de CAPTCHA;
 * 3. converte o JSON diretamente para o formato interno;
 * 4. usa o motor anterior apenas como contingência.
 */
export async function analisarProdutoTikTokShop(entrada: string): Promise<ResultadoAnalise> {
  if (!apifyProdutoDisponivel()) return analisarComMotorLegado(entrada);

  try {
    const link = await normalizarLinkTikTokShop(entrada);
    const leitura = await lerProdutoComApify(link.fetch_url || link.canonical_url, {
      productId: link.product_id,
      country: link.country_code,
      timeoutMs: 150_000,
    });
    if (!leitura) return analisarComMotorLegado(entrada);

    const registro = lerRegistro(leitura);
    if (!registro) return analisarComMotorLegado(entrada);

    const idRetornado = String(
      registro.__tiktok_factory_product_id ?? registro.product_id ?? registro.productId ?? "",
    ).trim();
    if (link.product_id && idRetornado && idRetornado !== link.product_id) {
      console.error("[tiktok] scraper retornou um produto diferente do solicitado", {
        esperado: link.product_id,
        recebido: idRetornado,
      });
      return analisarComMotorLegado(entrada);
    }

    const dadosOriginais = limparDados(registro.__tiktok_factory_normalized);
    const oferta = limparOferta(registro.__tiktok_factory_offer);
    const validacao = validarExtracao(dadosOriginais, oferta);
    if (!validacao.ok) {
      console.error("[tiktok] scraper retornou dados insuficientes", {
        campos: Object.keys(dadosOriginais),
      });
      return analisarComMotorLegado(entrada);
    }

    const pais = String(
      registro.__tiktok_factory_country_code ?? registro.region ?? link.country_code ?? "",
    )
      .toUpperCase()
      .slice(0, 2);
    const idioma = IDIOMA_POR_PAIS[pais] ?? link.source_language ?? null;
    const dados = await traduzirParaPtBr(dadosOriginais, idioma);
    const origem: Record<string, string> = {};
    for (const campo of CAMPOS_PRODUTO) {
      if (String(dados[campo] ?? "").trim()) origem[campo] = "tiktok_shop";
    }

    const productIdFinal = link.product_id ?? (idRetornado || null);
    const countryFinal = link.country_code ?? (pais || null);

    return {
      ok: true,
      status: "success",
      mensagem: "Produto encontrado.",
      detalhe: null,
      fonte: leitura.rede[0]?.url ?? "apify",
      tentativas: 1,
      do_cache: false,
      dados,
      dados_originais: dadosOriginais,
      oferta,
      origem,
      imagens: [],
      link: {
        ...link,
        product_id: productIdFinal,
        country_code: countryFinal,
        market: link.market ?? countryFinal,
        source_language: link.source_language ?? idioma,
      },
      original_tiktok_url: link.original_url,
      resolved_tiktok_url: link.redirected_url,
      tiktok_product_id: productIdFinal,
      tiktok_region: countryFinal,
    };
  } catch (e) {
    console.error(
      "[tiktok] rota estruturada falhou; usando contingência:",
      e instanceof Error ? e.message : e,
    );
    return analisarComMotorLegado(entrada);
  }
}
