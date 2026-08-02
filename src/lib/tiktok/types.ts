// Tipos compartilhados da importação de produtos do TikTok Shop.

export type LinkNormalizado = {
  original_url: string;
  redirected_url: string;
  canonical_url: string;
  fetch_url: string;
  product_id: string | null;
  country_code: string | null;
  market: string | null;
  locale: string | null;
  source_language: string | null;
};

export type RespostaRede = { url: string; corpo: string };

export type LeituraPagina = {
  motor: "browser_service" | "firecrawl" | "fetch";
  final_url: string;
  status: number | null;
  html: string;
  rede: RespostaRede[];
  erro: string | null;
};

export type BloqueioDetectado =
  | "captcha"
  | "login_required"
  | "access_denied"
  | "region_not_supported"
  | "unavailable"
  | "not_product"
  | null;

export const CAMPOS_PRODUTO = [
  "nome",
  "marca",
  "vendedor",
  "categoria",
  "subcategoria",
  "descricao",
  "beneficios",
  "caracteristicas",
  "ingredientes",
  "modo_de_uso",
  "publico",
  "preco",
  "preco_promocional",
  "desconto",
  "cupom",
  "entrega",
  "frete",
  "variacoes",
  "tamanho",
  "cores",
  "informacoes_tecnicas",
  "avaliacoes",
  "numero_avaliacoes",
  "quantidade_vendida",
  "duvidas_frequentes",
  "advertencias",
  "restricoes",
  "diferenciais",
  "garantias",
  "oferta",
] as const;

export type CampoProduto = (typeof CAMPOS_PRODUTO)[number];
export type DadosProduto = Partial<Record<CampoProduto, string>>;

export type Oferta = {
  current_price_value: string;
  current_price_formatted: string;
  original_price_value: string;
  original_price_formatted: string;
  currency_code: string;
  currency_symbol: string;
  discount_text: string;
};

export const OFERTA_VAZIA: Oferta = {
  current_price_value: "",
  current_price_formatted: "",
  original_price_value: "",
  original_price_formatted: "",
  currency_code: "",
  currency_symbol: "",
  discount_text: "",
};

export type StatusExtracao =
  | "pending"
  | "resolving_link"
  | "opening_browser"
  | "capturing_network"
  | "extracting_data"
  | "translating"
  | "downloading_images"
  | "success"
  | "partial"
  | "blocked"
  | "unavailable"
  | "invalid_product"
  | "failed";

export type ResultadoAnalise = {
  ok: boolean;
  status: StatusExtracao;
  mensagem: string;
  detalhe: string | null;
  fonte: string;
  tentativas: number;
  do_cache: boolean;
  dados: DadosProduto;
  dados_originais: DadosProduto;
  oferta: Oferta;
  origem: Record<string, string>;
  imagens: string[];
  link: LinkNormalizado;
  /* compatibilidade com o restante do fluxo */
  original_tiktok_url: string;
  resolved_tiktok_url: string;
  tiktok_product_id: string | null;
  tiktok_region: string | null;
};
