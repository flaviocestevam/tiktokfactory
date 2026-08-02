/* eslint-disable @typescript-eslint/no-explicit-any */
// Orquestrador único da importação de produtos do TikTok Shop.
import { LinkInvalido } from "./validate-url.server";
import {
  detectarMercadoNoConteudo,
  extrairProductIdDoConteudo,
  limparRastreamento,
  normalizarLinkTikTokShop,
} from "./normalize-url.server";
import { lerPagina } from "./browser-reader.server";
import { extrairConteudo } from "./structured-extractor.server";
import { normalizarProduto, validarExtracao } from "./product-normalizer.server";
import { traduzirParaPtBr } from "./product-translator.server";
import { salvarImagensDoProduto } from "./product-images.server";
import { buscarNoCache, gravarNoCache } from "./product-cache.server";
import {
  CAMPOS_PRODUTO,
  OFERTA_VAZIA,
  type LinkNormalizado,
  type ResultadoAnalise,
  type StatusExtracao,
} from "./types";

/** Limite de tentativas principais + estratégias secundárias. */
export const MAX_EXTRACTION_ATTEMPTS = 5;

const MENSAGEM_FALHA =
  "Não foi possível acessar este produto. Ele pode estar indisponível, removido ou restrito no momento.";

/** Locale/timezone derivados do país descoberto, sem lista fechada. */
const LOCALIZACAO: Record<string, { locale: string; tz: string }> = {
  BR: { locale: "pt-BR", tz: "America/Sao_Paulo" },
  US: { locale: "en-US", tz: "America/New_York" },
  GB: { locale: "en-GB", tz: "Europe/London" },
  UK: { locale: "en-GB", tz: "Europe/London" },
  TH: { locale: "th-TH", tz: "Asia/Bangkok" },
  ID: { locale: "id-ID", tz: "Asia/Jakarta" },
  SG: { locale: "en-SG", tz: "Asia/Singapore" },
  MY: { locale: "ms-MY", tz: "Asia/Kuala_Lumpur" },
  PH: { locale: "en-PH", tz: "Asia/Manila" },
  VN: { locale: "vi-VN", tz: "Asia/Ho_Chi_Minh" },
  ES: { locale: "es-ES", tz: "Europe/Madrid" },
  IT: { locale: "it-IT", tz: "Europe/Rome" },
  DE: { locale: "de-DE", tz: "Europe/Berlin" },
  FR: { locale: "fr-FR", tz: "Europe/Paris" },
  JP: { locale: "ja-JP", tz: "Asia/Tokyo" },
  MX: { locale: "es-MX", tz: "America/Mexico_City" },
};

export function localizacaoDoMercado(link: LinkNormalizado) {
  const pais = (link.country_code ?? "").toUpperCase();
  const conhecido = LOCALIZACAO[pais];
  const locale = link.locale ?? conhecido?.locale ?? (pais ? `en-${pais}` : null);
  return { locale, timezone: conhecido?.tz ?? null };
}

type Tentativa = {
  url: string;
  rolar?: boolean;
  espera?: number;
  timeout?: number;
};

function planoDeTentativas(link: LinkNormalizado): Tentativa[] {
  const canonicaSemParametros = (() => {
    try {
      const u = new URL(link.canonical_url);
      u.search = "";
      return u.toString();
    } catch {
      return link.canonical_url;
    }
  })();
  return [
    { url: link.original_url, espera: 1500, timeout: 90_000 },
    { url: link.fetch_url, espera: 2500, timeout: 90_000 },
    { url: canonicaSemParametros, espera: 4000, timeout: 120_000 },
    { url: link.fetch_url, rolar: true, espera: 3000, timeout: 120_000 },
    { url: link.redirected_url, rolar: true, espera: 3000, timeout: 120_000 },
  ].slice(0, MAX_EXTRACTION_ATTEMPTS);
}

function resultadoBase(link: LinkNormalizado): ResultadoAnalise {
  return {
    ok: false,
    status: "pending",
    mensagem: MENSAGEM_FALHA,
    detalhe: null,
    fonte: "nenhuma",
    tentativas: 0,
    do_cache: false,
    dados: {},
    dados_originais: {},
    oferta: { ...OFERTA_VAZIA },
    origem: {},
    imagens: [],
    link,
    original_tiktok_url: link.original_url,
    resolved_tiktok_url: link.redirected_url,
    tiktok_product_id: link.product_id,
    tiktok_region: link.country_code,
  };
}

function doCache(link: LinkNormalizado, registro: any): ResultadoAnalise {
  const dados: any = {};
  for (const campo of CAMPOS_PRODUTO) {
    const valor = registro[campo];
    if (typeof valor === "string" && valor.trim()) dados[campo] = valor;
  }
  const normalizados = (registro.normalized_product_data ?? {}) as any;
  return {
    ...resultadoBase(link),
    ok: true,
    status: "success",
    do_cache: true,
    fonte: registro.extraction_method ?? "cache",
    mensagem: "Produto encontrado.",
    dados,
    dados_originais: (registro.original_product_data ?? {}) as any,
    oferta: { ...OFERTA_VAZIA, ...(normalizados.oferta ?? {}) },
    origem: (registro.origem_dados ?? {}) as any,
    imagens: Array.isArray(registro.imagens) ? (registro.imagens as string[]) : [],
    tiktok_product_id: registro.tiktok_product_id ?? link.product_id,
    tiktok_region: registro.tiktok_country_code ?? link.country_code,
  };
}

/** Função pública única: cole qualquer link do TikTok Shop e receba o produto. */
export async function analisarProdutoTikTokShop(entrada: string): Promise<ResultadoAnalise> {
  const inicio = Date.now();
  let link: LinkNormalizado;
  try {
    link = await normalizarLinkTikTokShop(entrada);
  } catch (e) {
    if (e instanceof LinkInvalido) throw e;
    throw new LinkInvalido("Link inválido. Cole o link copiado do TikTok Shop.");
  }

  console.info("[tiktok] link normalizado", {
    original: link.original_url,
    final: link.redirected_url,
    canonical: link.canonical_url,
    product_id: link.product_id,
    country: link.country_code,
    locale: link.locale,
  });

  const cache = await buscarNoCache(link).catch(() => null);
  if (cache?.reaproveitavel && cache.fresco) {
    console.info("[tiktok] cache reaproveitado", { chave: link.product_id });
    return doCache(link, cache.registro);
  }

  const tentativas = planoDeTentativas(link);
  let ultimoStatus: StatusExtracao = "failed";
  let ultimoDetalhe: string | null = null;
  let melhor: ResultadoAnalise | null = null;

  for (let i = 0; i < tentativas.length; i++) {
    const t = tentativas[i];
    const { locale, timezone } = localizacaoDoMercado(link);
    const leitura = await lerPagina(t.url, {
      locale,
      country: link.country_code,
      timezone,
      rolar: t.rolar,
      esperaMs: t.espera,
      timeoutMs: t.timeout,
    });
    ultimoDetalhe = leitura.erro;

    if (!leitura.html && !leitura.rede.length) {
      ultimoStatus = "failed";
      continue;
    }

    const conteudo = extrairConteudo(leitura, link.product_id);

    // Descobre ID e mercado quando ainda não vieram da URL.
    if (!link.product_id) {
      const id = extrairProductIdDoConteudo(`${conteudo.bruto}\n${leitura.final_url}`);
      if (id) link = { ...link, product_id: id };
    }
    if (!link.country_code) {
      const m = detectarMercadoNoConteudo(conteudo.bruto);
      link = {
        ...link,
        country_code: m.country_code ?? link.country_code,
        market: m.country_code ?? link.market,
        locale: m.locale ?? link.locale,
        source_language: m.source_language ?? link.source_language,
      };
    }
    try {
      link = { ...link, canonical_url: limparRastreamento(new URL(leitura.final_url)).toString() };
    } catch {
      /* mantém a canônica anterior */
    }

    if (conteudo.bloqueio) {
      ultimoStatus =
        conteudo.bloqueio === "unavailable"
          ? "unavailable"
          : conteudo.bloqueio === "region_not_supported"
            ? "blocked"
            : "blocked";
      console.warn("[tiktok] bloqueio detectado", { tentativa: i + 1, tipo: conteudo.bloqueio });
      continue;
    }

    const normalizado = await normalizarProduto(conteudo, {
      url: leitura.final_url,
      product_id: link.product_id,
      country_code: link.country_code,
    });

    if (!normalizado.pagina_de_produto) {
      ultimoStatus = "invalid_product";
      continue;
    }
    if (
      link.product_id &&
      normalizado.product_id &&
      normalizado.product_id !== link.product_id &&
      !conteudo.bruto.includes(link.product_id)
    ) {
      ultimoStatus = "invalid_product";
      continue;
    }

    link = {
      ...link,
      product_id: link.product_id ?? normalizado.product_id,
      country_code: link.country_code ?? normalizado.country_code,
      market: link.market ?? normalizado.country_code,
      source_language: link.source_language ?? normalizado.source_language,
    };

    const candidatas = [...new Set([...normalizado.imagens, ...conteudo.imagens])];
    const imagens = await salvarImagensDoProduto(candidatas, {
      country_code: link.country_code,
      product_id: link.product_id,
    });

    const validacao = validarExtracao(normalizado.dados, normalizado.oferta, imagens);
    const traduzidos = await traduzirParaPtBr(normalizado.dados, link.source_language);
    const origem: Record<string, string> = {};
    for (const campo of CAMPOS_PRODUTO) {
      if (String(traduzidos[campo] ?? "").trim()) origem[campo] = "tiktok_shop";
    }

    const resultado: ResultadoAnalise = {
      ...resultadoBase(link),
      ok: validacao.ok,
      status: validacao.ok ? "success" : "partial",
      mensagem: validacao.ok ? "Produto encontrado." : MENSAGEM_FALHA,
      detalhe: leitura.erro,
      fonte: leitura.motor,
      tentativas: i + 1,
      dados: traduzidos,
      dados_originais: normalizado.dados,
      oferta: normalizado.oferta,
      origem,
      imagens,
    };

    if (validacao.ok) {
      await gravarNoCache(link, resultado).catch(() => null);
      console.info("[tiktok] análise concluída", {
        motor: leitura.motor,
        tentativas: i + 1,
        campos: Object.keys(origem).length,
        imagens: imagens.length,
        ms: Date.now() - inicio,
      });
      return resultado;
    }
    melhor = melhor && melhor.origem ? melhor : resultado;
    ultimoStatus = "partial";
  }

  if (cache?.reaproveitavel) return doCache(link, cache.registro);

  console.warn("[tiktok] análise falhou", {
    status: ultimoStatus,
    tentativas: tentativas.length,
    ms: Date.now() - inicio,
  });

  return {
    ...(melhor ?? resultadoBase(link)),
    ok: false,
    status: ultimoStatus,
    mensagem: MENSAGEM_FALHA,
    detalhe: ultimoDetalhe,
    tentativas: tentativas.length,
  };
}
