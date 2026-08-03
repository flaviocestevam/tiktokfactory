import type { LeituraPagina } from "./types";
import {
  apifyProdutoDisponivel as apifyFallbackDisponivel,
  lerProdutoComApify as lerProdutoComFallback,
  type OpcoesApifyProduto,
} from "./apify-product-final.server";

type CredenciaisApify =
  | { modo: "gateway"; connectionKey: string; lovableKey: string }
  | { modo: "token"; token: string };

const APIFY_API_BASE = "https://api.apify.com";
const APIFY_GATEWAY_BASE = "https://connector-gateway.lovable.dev/apify";
const ATOR_MOBILE = "cunning_soil~tiktok-shop-product-scraper-mobile-api";
const LIMITE_CORPO = 120_000;

function texto(valor: unknown): string {
  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  return "";
}

function primeiro(...valores: unknown[]): string {
  for (const valor of valores) {
    const resultado = texto(valor);
    if (resultado) return resultado;
  }
  return "";
}

function obterCredenciais(): CredenciaisApify | null {
  const connectionKey = primeiro(
    process.env.APIFY_API_KEY,
    process.env.APIFY_CONNECTION_API_KEY,
  );
  const lovableKey = primeiro(process.env.LOVABLE_API_KEY);
  if (connectionKey && lovableKey) {
    return { modo: "gateway", connectionKey, lovableKey };
  }

  const token = primeiro(process.env.APIFY_TOKEN);
  return token ? { modo: "token", token } : null;
}

function headers(credenciais: CredenciaisApify): Record<string, string> {
  if (credenciais.modo === "gateway") {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${credenciais.lovableKey}`,
      "Lovable-API-Key": credenciais.lovableKey,
      "X-Connection-Api-Key": credenciais.connectionKey,
    };
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${credenciais.token}`,
  };
}

function localizarProduto(valor: unknown): Record<string, any> | null {
  const raiz = Array.isArray(valor) ? valor[0] : valor;
  if (!raiz || typeof raiz !== "object") return null;
  const objeto = raiz as Record<string, any>;
  const produtos = objeto.product_info?.products ?? objeto.products;
  if (Array.isArray(produtos) && produtos[0] && typeof produtos[0] === "object") {
    return produtos[0] as Record<string, any>;
  }
  if (objeto.product && typeof objeto.product === "object") return objeto.product;
  return objeto;
}

function normalizarProduto(
  produto: Record<string, any>,
  url: string,
  pais: string,
  productIdEsperado: string | null,
) {
  const pricing = produto.pricing ?? {};
  const seller = produto.seller ?? produto.shop ?? {};
  const sales = produto.sales ?? {};
  const inventory = produto.inventory ?? {};
  const reviews = produto.reviews ?? {};
  const category = produto.category ?? {};
  const additional = produto.additional ?? {};
  const rawProduct = additional.raw_product ?? produto.raw_product ?? {};

  const productId = primeiro(
    produto.product_id,
    produto.productId,
    produto.id,
    productIdEsperado,
  );
  if (productIdEsperado && productId && productId !== productIdEsperado) return null;

  const nome = primeiro(produto.title, produto.product_name, produto.name, rawProduct.title);
  const descricao = primeiro(
    produto.description,
    rawProduct.description,
    rawProduct.product_description,
  );
  const preco = primeiro(
    pricing.sale_price,
    pricing.salePrice,
    produto.sale_price,
    produto.salePrice,
    produto.price,
  );
  const precoAnterior = primeiro(
    pricing.original_price,
    pricing.originalPrice,
    produto.original_price,
    produto.originalPrice,
  );
  const currencyCode = primeiro(pricing.currency, produto.currency_code, produto.currencyCode);
  const currencySymbol = primeiro(
    pricing.currency_symbol,
    produto.currency_symbol,
    produto.currency,
  );
  const vendedor = primeiro(seller.name, seller.shop_name, produto.seller_name, produto.shop_name);
  const vendedorId = primeiro(seller.seller_id, seller.id, produto.seller_id, produto.shop_id);
  const categoria = primeiro(category.name, produto.category_name, produto.category);
  const avaliacao = primeiro(reviews.rating, seller.rating, produto.rating);
  const numeroAvaliacoes = primeiro(
    reviews.review_count,
    reviews.count,
    produto.review_count,
  );
  const vendidos = primeiro(sales.sold_count, produto.sold_count, produto.soldCount);
  const estoque = primeiro(inventory.total_stock, produto.stock_total, produto.stockTotal);
  const desconto = primeiro(pricing.discount, produto.discount, produto.discount_percent);
  const variacoes = JSON.stringify(inventory.sale_props ?? produto.variants ?? []).slice(0, 5_000);
  const skus = JSON.stringify(inventory.skus ?? produto.skus ?? []).slice(0, 5_000);

  if (!productId || !nome || !preco) return null;

  const dados = {
    nome,
    marca: primeiro(produto.brand, rawProduct.brand),
    vendedor,
    categoria,
    descricao,
    preco,
    preco_promocional: precoAnterior,
    desconto,
    variacoes: variacoes === "[]" ? "" : variacoes,
    informacoes_tecnicas: [
      `ID do produto: ${productId}`,
      vendedorId ? `ID da loja: ${vendedorId}` : "",
      estoque ? `Quantidade disponível: ${estoque}` : "",
      skus !== "[]" ? `SKUs: ${skus}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    avaliacoes: avaliacao,
    numero_avaliacoes: numeroAvaliacoes,
    quantidade_vendida: vendidos,
    oferta: [preco, precoAnterior ? `antes ${precoAnterior}` : "", desconto]
      .filter(Boolean)
      .join(" · "),
  };

  return {
    product_id: productId,
    product_name: nome,
    description: descricao,
    shop_name: vendedor,
    category_name: categoria,
    price: preco,
    original_price: precoAnterior,
    currency_code: currencyCode,
    currency_symbol: currencySymbol,
    product_url: url,
    region: pais,
    images: [],
    __tiktok_factory_normalized: dados,
    __tiktok_factory_offer: {
      current_price_value: preco,
      current_price_formatted: preco,
      original_price_value: precoAnterior,
      original_price_formatted: precoAnterior,
      currency_code: currencyCode,
      currency_symbol: currencySymbol,
      discount_text: desconto,
    },
    __tiktok_factory_product_id: productId,
    __tiktok_factory_country_code: pais,
  };
}

async function lerViaMobile(
  url: string,
  op: OpcoesApifyProduto,
): Promise<LeituraPagina | null> {
  const credenciais = obterCredenciais();
  if (!credenciais) return null;

  const base = credenciais.modo === "gateway" ? APIFY_GATEWAY_BASE : APIFY_API_BASE;
  const endpoint = new URL(
    `${base}/v2/acts/${encodeURIComponent(ATOR_MOBILE)}/run-sync-get-dataset-items`,
  );
  endpoint.searchParams.set("clean", "true");

  const pais = (op.country ?? "BR").toUpperCase();
  const resposta = await fetch(endpoint.toString(), {
    method: "POST",
    headers: headers(credenciais),
    body: JSON.stringify({
      productInput: op.productId || url,
      region: pais,
      outputMode: "full_readable",
    }),
    signal: AbortSignal.timeout(Math.min(40_000, Math.max(15_000, op.timeoutMs ?? 40_000))),
  });

  if (!resposta.ok) {
    const erro = await resposta.text();
    console.error(`[tiktok] Actor Mobile API falhou [${resposta.status}]: ${erro.slice(0, 500)}`);
    return null;
  }

  const bruto = await resposta.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(bruto);
  } catch {
    console.error("[tiktok] Actor Mobile API retornou conteúdo não JSON");
    return null;
  }

  const produto = localizarProduto(parsed);
  if (!produto) return null;
  const normalizado = normalizarProduto(produto, url, pais, op.productId ?? null);
  if (!normalizado) return null;

  const corpo = JSON.stringify(normalizado).slice(0, LIMITE_CORPO);
  return {
    motor: "apify",
    final_url: url,
    status: 200,
    html: `<body><pre>${corpo
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</pre></body>`,
    rede: [{ url: `apify-${credenciais.modo}://${ATOR_MOBILE}`, corpo }],
    erro: null,
  };
}

export function apifyProdutoDisponivel() {
  return Boolean(obterCredenciais()) || apifyFallbackDisponivel();
}

export async function lerProdutoComApify(
  url: string,
  op: OpcoesApifyProduto,
): Promise<LeituraPagina | null> {
  try {
    const mobile = await lerViaMobile(url, { ...op, timeoutMs: 40_000 });
    if (mobile) return mobile;
  } catch (erro) {
    console.error(
      "[tiktok] Actor Mobile API falhou:",
      erro instanceof Error ? erro.message : erro,
    );
  }

  return lerProdutoComFallback(url, { ...op, timeoutMs: 45_000 });
}
