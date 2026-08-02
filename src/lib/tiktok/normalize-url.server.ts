// Normalização universal de links de produto do TikTok Shop (qualquer país).
import type { LinkNormalizado } from "./types";
import { validarUrlTikTok } from "./validate-url.server";
import { resolverRedirecionamentos } from "./resolve-url.server";

/** Lista central de parâmetros puramente analíticos/rastreamento. */
export const PARAMETROS_RASTREAMENTO = [
  "source",
  "enter_method",
  "enter_from",
  "first_entrance",
  "first_entrance_position",
  "first_entrance_tt_scene",
  "btm_pre",
  "btm_pre_show_id",
  "btm_transfer_id",
  "btm_ppre",
  "btm_show_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "trace_id",
  "share_link_id",
  "share_app_id",
  "share_scene",
  "social_share_type",
  "timestamp",
  "tt_from",
  "ug_btm",
  "checksum",
  "sec_user_id",
  "_r",
  "_t",
  "is_from_webapp",
  "sender_device",
  "gclid",
  "fbclid",
];

const PARAMETROS_FUNCIONAIS = new Set([
  "product_id",
  "productId",
  "pdp_id",
  "region",
  "locale",
  "lang",
  "language",
  "currency",
  "sku_id",
  "seller_id",
  "shop_id",
  "id",
]);

/** Remove somente parâmetros de rastreamento, preservando os funcionais. */
export function limparRastreamento(url: URL): URL {
  const limpa = new URL(url.toString());
  for (const chave of [...limpa.searchParams.keys()]) {
    if (PARAMETROS_FUNCIONAIS.has(chave)) continue;
    if (PARAMETROS_RASTREAMENTO.includes(chave) || /^(btm_|utm_|tt_|ug_|share_)/.test(chave)) {
      limpa.searchParams.delete(chave);
    }
  }
  limpa.hash = "";
  return limpa;
}

/** Procura o ID do produto no caminho e na query, em qualquer formato conhecido. */
export function extrairProductId(url: URL): string | null {
  const caminho = url.pathname;
  const padroes = [
    /\/pdp\/(?:[^/]*?-)?(\d{6,})/i,
    /\/(?:view\/)?product\/(?:[^/]*?-)?(\d{6,})/i,
    /\/products?\/(\d{6,})/i,
  ];
  for (const re of padroes) {
    const m = caminho.match(re);
    if (m) return m[1];
  }
  for (const chave of ["product_id", "productId", "pdp_id", "id"]) {
    const v = url.searchParams.get(chave);
    if (v && /^\d{6,}$/.test(v)) return v;
  }
  const solto = caminho.match(/\/(\d{15,})(?:[/?]|$)/);
  return solto ? solto[1] : null;
}

/** Procura o ID do produto no conteúdo da página, quando não está na URL. */
export function extrairProductIdDoConteudo(conteudo: string): string | null {
  const padroes = [
    /"product_id"\s*:\s*"?(\d{9,})"?/i,
    /"productId"\s*:\s*"?(\d{9,})"?/i,
    /"pdp_id"\s*:\s*"?(\d{9,})"?/i,
    /\/pdp\/(?:[^/"']*?-)?(\d{9,})/i,
  ];
  const contagem = new Map<string, number>();
  for (const re of padroes) {
    const g = new RegExp(re.source, "gi");
    for (const m of conteudo.matchAll(g)) contagem.set(m[1], (contagem.get(m[1]) ?? 0) + 1);
  }
  const melhor = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0];
  return melhor ? melhor[0] : null;
}

const LOCALE_COMPOSTO = /^([a-z]{2})[-_]([A-Za-z]{2})$/;

/** Descobre país/locale sem lista fechada de países. */
export function detectarMercado(url: URL): {
  country_code: string | null;
  locale: string | null;
  source_language: string | null;
} {
  const candidatos: string[] = [];
  const segmentos = url.pathname.split("/").filter(Boolean);
  if (segmentos.length) candidatos.push(segmentos[0]);
  for (const chave of ["region", "locale", "lang", "language"]) {
    const v = url.searchParams.get(chave);
    if (v) candidatos.push(v);
  }

  let pais: string | null = null;
  let locale: string | null = null;
  let idioma: string | null = null;

  for (const bruto of candidatos) {
    const valor = bruto.trim();
    const composto = valor.match(LOCALE_COMPOSTO);
    if (composto) {
      idioma ??= composto[1].toLowerCase();
      pais ??= composto[2].toUpperCase();
      locale ??= `${composto[1].toLowerCase()}-${composto[2].toUpperCase()}`;
      continue;
    }
    if (/^[a-zA-Z]{2}$/.test(valor)) {
      pais ??= valor.toUpperCase();
      continue;
    }
  }
  return { country_code: pais, locale, source_language: idioma };
}

/** Descobre o mercado a partir do conteúdo (metadados, dados estruturados, moeda). */
export function detectarMercadoNoConteudo(conteudo: string): {
  country_code: string | null;
  locale: string | null;
  source_language: string | null;
} {
  const locale =
    conteudo.match(/"locale"\s*:\s*"([a-z]{2}[-_][A-Za-z]{2})"/i)?.[1] ??
    conteudo.match(/<html[^>]+lang=["']([a-zA-Z-]{2,10})["']/i)?.[1] ??
    null;
  const regiao =
    conteudo.match(/"region"\s*:\s*"([A-Za-z]{2})"/i)?.[1] ??
    conteudo.match(/"country_?code"\s*:\s*"([A-Za-z]{2})"/i)?.[1] ??
    null;
  const composto = locale?.replace("_", "-").match(/^([a-z]{2})-([A-Za-z]{2})$/i);
  return {
    country_code: (regiao ?? composto?.[2] ?? null)?.toUpperCase() ?? null,
    locale: composto ? `${composto[1].toLowerCase()}-${composto[2].toUpperCase()}` : locale,
    source_language: (composto?.[1] ?? locale?.slice(0, 2) ?? null)?.toLowerCase() ?? null,
  };
}

/** Função central: recebe qualquer link e devolve tudo o que der para descobrir. */
export async function normalizarLinkTikTokShop(entrada: string): Promise<LinkNormalizado> {
  const original = validarUrlTikTok(entrada);
  const resolvida = await resolverRedirecionamentos(original);
  const limpa = limparRastreamento(resolvida);
  const mercado = detectarMercado(resolvida);
  const mercadoOriginal = detectarMercado(original);
  const country = mercado.country_code ?? mercadoOriginal.country_code;

  return {
    original_url: String(entrada).trim(),
    redirected_url: resolvida.toString(),
    canonical_url: limpa.toString(),
    fetch_url: limpa.toString(),
    product_id: extrairProductId(resolvida) ?? extrairProductId(original),
    country_code: country,
    market: country,
    locale: mercado.locale ?? mercadoOriginal.locale,
    source_language: mercado.source_language ?? mercadoOriginal.source_language,
  };
}
