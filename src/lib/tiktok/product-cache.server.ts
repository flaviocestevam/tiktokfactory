/* eslint-disable @typescript-eslint/no-explicit-any */
// Cache de produtos já analisados, por país + product_id (ou hash da URL canônica).
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { LinkNormalizado, ResultadoAnalise } from "./types";

/** Dados comerciais valem 24h; a análise inteira é reaproveitada por 7 dias. */
export const VALIDADE_COMERCIAL_MS = 24 * 60 * 60 * 1000;
export const VALIDADE_DESCRITIVA_MS = 7 * 24 * 60 * 60 * 1000;

export function chaveCache(link: LinkNormalizado) {
  return link.product_id
    ? `${(link.country_code ?? "xx").toLowerCase()}:${link.product_id}`
    : `url:${link.canonical_url}`;
}

export async function buscarNoCache(link: LinkNormalizado) {
  const consulta = supabaseAdmin.from("products").select("*").limit(1);
  const { data } = link.product_id
    ? await consulta.eq("tiktok_product_id", link.product_id).order("last_analyzed_at", {
        ascending: false,
      })
    : await consulta.eq("canonical_tiktok_url", link.canonical_url);
  const registro = (data ?? [])[0] as any;
  if (!registro) return null;
  const analisado = registro.last_analyzed_at ? Date.parse(registro.last_analyzed_at) : 0;
  const idade = Date.now() - analisado;
  return {
    registro,
    fresco: idade < VALIDADE_COMERCIAL_MS,
    reaproveitavel: idade < VALIDADE_DESCRITIVA_MS && registro.extraction_status === "success",
  };
}

export async function gravarNoCache(link: LinkNormalizado, resultado: ResultadoAnalise) {
  const payload: Record<string, any> = {
    ...resultado.dados,
    nome: resultado.dados.nome ?? "Produto sem nome",
    link: link.original_url,
    original_tiktok_url: link.original_url,
    resolved_tiktok_url: link.redirected_url,
    redirected_tiktok_url: link.redirected_url,
    canonical_tiktok_url: link.canonical_url,
    fetch_tiktok_url: link.fetch_url,
    tiktok_product_id: link.product_id,
    tiktok_region: link.country_code,
    tiktok_country_code: link.country_code,
    tiktok_market: link.market,
    source_language: link.source_language,
    source_locale: link.locale,
    currency_code: resultado.oferta.currency_code || null,
    currency_symbol: resultado.oferta.currency_symbol || null,
    original_product_data: resultado.dados_originais as any,
    normalized_product_data: { ...resultado.dados, oferta: resultado.oferta } as any,
    extraction_method: resultado.fonte,
    extraction_status: resultado.status,
    extraction_attempts: resultado.tentativas,
    extraction_error_code: resultado.ok ? null : resultado.status,
    origem_dados: resultado.origem as any,
    imagens: resultado.imagens as any,
    imagem_principal: resultado.imagens[0] ?? null,
    images_downloaded_at: resultado.imagens.length ? new Date().toISOString() : null,
    status_extracao: resultado.status,
    last_analyzed_at: new Date().toISOString(),
  };

  const existente = await buscarNoCache(link);
  if (existente?.registro?.id) {
    const { data } = await supabaseAdmin
      .from("products")
      .update(payload)
      .eq("id", existente.registro.id)
      .select()
      .single();
    return data;
  }
  const { data, error } = await supabaseAdmin.from("products").insert(payload).select().single();
  if (error) {
    console.error("[tiktok] falha ao gravar cache:", error.message);
    return null;
  }
  return data;
}
