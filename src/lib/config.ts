// Configuração central da TikTok Factory (client-safe).

/** Únicas durações aceitas pelo Google Flow. Não repetir esses valores em outros arquivos. */
export const FLOW_CLIP_DURATIONS = [4, 6, 8, 10] as const;

export const CTA_AUTOMATICO = "auto";
export const CTA_PERSONALIZADO = "personalizado";
export const CTA_PREDEFINIDO = "predefinido";

export const CTAS = [
  "Clique no carrinho amarelo",
  "Confira no carrinho",
  "Veja o preço no carrinho",
  "Garanta o seu",
] as const;

export const ETAPAS = [
  { numero: 1, titulo: "Produto" },
  { numero: 2, titulo: "Personagem" },
  { numero: 3, titulo: "Foto" },
  { numero: 4, titulo: "Roteiros" },
  { numero: 5, titulo: "Clipes" },
] as const;

export const STATUS_PRODUCAO = [
  "produto_analisado",
  "aguardando_foto",
  "foto_confirmada",
  "roteiros_gerados",
  "roteiro_aprovado",
  "clipes_preparados",
  "produzido",
  "publicado",
] as const;

export type StatusProducao = (typeof STATUS_PRODUCAO)[number];

export const ROTULO_STATUS: Record<string, string> = {
  produto_analisado: "Produto analisado",
  aguardando_foto: "Aguardando foto",
  foto_confirmada: "Foto confirmada",
  roteiros_gerados: "Roteiros gerados",
  roteiro_aprovado: "Roteiro aprovado",
  clipes_preparados: "Clipes preparados",
  produzido: "Produzido",
  publicado: "Publicado",
  em_andamento: "Em andamento",
  finalizado: "Roteiros gerados",
};

/** Idioma da fala e formato fixos da ferramenta. */
export const IDIOMA_FALA = "português do Brasil";
export const FORMATO_VIDEO = "9:16 vertical";

export const HOSTS_TIKTOK = ["shop.tiktok.com", "tiktok.com", "www.tiktok.com", "vt.tiktok.com"];

export function linkTikTokValido(url: string) {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return HOSTS_TIKTOK.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
