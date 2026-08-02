// Seleção das respostas de rede que realmente falam do produto principal.
import type { RespostaRede } from "./types";

export const PADROES_REDE_PRODUTO = [
  "product",
  "product_detail",
  "product_info",
  "pdp",
  "sku",
  "price",
  "promotion",
  "seller",
  "merchant",
  "shipping",
  "review",
  "rating",
  "inventory",
  "variation",
  "graphql",
];

const PALAVRAS_SENSIVEIS = [
  "passport",
  "account/info",
  "user/info",
  "login",
  "token",
  "cookie",
  "session",
  "address",
  "payment",
  "wallet",
  "order",
];

function pontuar(resposta: RespostaRede, productId: string | null) {
  const url = resposta.url.toLowerCase();
  if (PALAVRAS_SENSIVEIS.some((p) => url.includes(p))) return -1;
  let pontos = 0;
  if (productId && resposta.corpo.includes(productId)) pontos += 6;
  if (/product_detail|pdp|product_info/.test(url)) pontos += 3;
  if (PADROES_REDE_PRODUTO.some((p) => url.includes(p))) pontos += 1;
  for (const chave of [
    '"sku',
    '"price',
    '"currency',
    '"seller',
    '"title"',
    '"product_base',
    '"images',
  ]) {
    if (resposta.corpo.toLowerCase().includes(chave)) pontos += 1;
  }
  return pontos;
}

/** Ordena e limita as respostas úteis, descartando o que for irrelevante ou pessoal. */
export function selecionarRespostas(
  respostas: RespostaRede[],
  productId: string | null,
  limite = 6,
): RespostaRede[] {
  return respostas
    .map((r) => ({ r, p: pontuar(r, productId) }))
    .filter((x) => x.p >= 2)
    .sort((a, b) => b.p - a.p)
    .slice(0, limite)
    .map((x) => x.r);
}
