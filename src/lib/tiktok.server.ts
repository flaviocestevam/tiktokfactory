// Fonte única da importação de produtos do TikTok Shop.
export { analisarProdutoTikTokShop } from "./tiktok/product-analyzer-v2.server";
export { validarUrlTikTok, ehLinkPermitido } from "./tiktok/validate-url.server";
export { normalizarLinkTikTokShop } from "./tiktok/normalize-url.server";
export { CAMPOS_PRODUTO } from "./tiktok/types";
export type { DadosProduto, ResultadoAnalise, LinkNormalizado, Oferta } from "./tiktok/types";
