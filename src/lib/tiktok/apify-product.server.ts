/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LeituraPagina } from "./types";

export type OpcoesApifyProduto = {
  country?: string | null;
  productId?: string | null;
  timeoutMs?: number;
};

type CredenciaisApify =
  | {
      modo: "gateway";
      connectionKey: string;
      lovableKey: string;
    }
  | {
      modo: "token";
      token: string;
    };

const LIMITE_CORPO = 120_000;
const APIFY_API_BASE = "https://api.apify.com";
const APIFY_GATEWAY_BASE = "https://connector-gateway.lovable.dev/apify";
const ATOR_PRIMARIO = "jungle_synthesizer~tiktok-shop-product-detail-scraper";
const ATOR_FALLBACK = "herus13~tiktok-shop-scraper";

const MOEDA_POR_PAIS: Record<string, { code: string; symbol: string }> = {
  BR: { code: "BRL", symbol: "R$" },
  US: { code: "USD", symbol: "$" },
  GB: { code: "GBP", symbol: "£" },
  UK: { code: "GBP", symbol: "£" },
  JP: { code: "JPY", symbol: "¥" },
  TH: { code: "THB", symbol: "฿" },
  ID: { code: "IDR", symbol: "Rp" },
  MY: { code: "MYR", symbol: "RM" },
  SG: { code: "SGD", symbol: "S$" },
  PH: { code: "PHP", symbol: "₱" },
  VN: { code: "VND", symbol: "₫" },
  MX: { code: "MXN", symbol: "$" },
  FR: { code: "EUR", symbol: "€" },
  DE: { code: "EUR", symbol: "€" },
  ES: { code: "EUR", symbol: "€" },
  IT: { code: "EUR", symbol: "€" },
  IE: { code: "EUR", symbol: "€" },
};

function texto(valor: unknown): string {
  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  return "";
}

function primeiro(...valores: unknown[]) {
  for (const valor of valores) {
    const t = texto(valor);
    if (t) return t;
  }
  return "";
}

function obterCredenciaisApify(): CredenciaisApify | null {
  const connectionKey = primeiro(
    process.env["APIFY_API_KEY"],
    process.env["APIFY_CONNECTION_API_KEY"],
  );
  const lovableKey = primeiro(process.env["LOVABLE_API_KEY"]);

  if (connectionKey && lovableKey) {
    return { modo: "gateway", connectionKey, lovableKey };
  }

  const token = primeiro(process.env["APIFY_TOKEN"]);
  if (token) return { modo: "token", token };

  return null;
}

export function apifyProdutoDisponivel() {
  return Boolean(obterCredenciaisApify());
}

function caminhoCategoria(valor: unknown): string {
  if (typeof valor === "string") return valor.trim();
  if (!Array.isArray(valor)) return "";
  return valor
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") return primeiro((item as any).name, (item as any).title);
      return "";
    })
    .filter(Boolean)
    .join(" > ");
}

function jsonCurto(valor: unknown, limite = 5_000): string {
  if (valor == null) return "";
  try {
    const saida = JSON.stringify(valor);
    return saida === "{}" || saida === "[]" ? "" : saida.slice(0, limite);
  } catch {
    return "";
  }
}

function moedaDoRegistro(item: any, pais: string) {
  const bruto = primeiro(
    item?.currency_code,
    item?.currencyCode,
    item?.price_currency,
    item?.priceCurrency,
    item?.currency,
  );
  const padrao = MOEDA_POR_PAIS[pais] ?? { code: "", symbol: "" };
  if (/^[A-Z]{3}$/i.test(bruto)) {
    const code = bruto.toUpperCase();
    const symbol = Object.values(MOEDA_POR_PAIS).find((m) => m.code === code)?.symbol ?? "";
    return { code, symbol };
  }
  return { code: padrao.code, symbol: bruto || padrao.symbol };
}

function formatarPreco(valor: unknown, simbolo: string): string {
  const v = texto(valor);
  if (!v) return "";
  if (simbolo && !v.includes(simbolo)) return `${simbolo} ${v}`.trim();
  return v;
}

function normalizarRegistro(item: any, paisInformado: string, productIdEsperado: string | null) {
  const pais = primeiro(item?.region, item?.country_code, item?.countryCode, paisInformado)
    .toUpperCase()
    .slice(0, 2);
  const productId = primeiro(item?.product_id, item?.productId, item?.id, productIdEsperado);
  const nome = primeiro(
    item?.product_name,
    item?.productTitle,
    item?.product_title,
    item?.title,
    item?.name,
  );
  const descricao = primeiro(
    item?.description,
    item?.product_description,
    item?.productDescription,
  );
  const marca = primeiro(item?.brand, item?.brand_name, item?.brandName);
  const vendedor = primeiro(
    item?.shop_name,
    item?.seller_name,
    item?.sellerName,
    item?.shop?.name,
    item?.seller?.name,
  );
  const categoria = caminhoCategoria(
    item?.category_path ?? item?.categoryPath ?? item?.breadcrumb ?? item?.productCategory,
  );
  const precoAtual = primeiro(
    item?.salePrice,
    item?.sale_price,
    item?.price,
    item?.current_price,
    item?.currentPrice,
  );
  const precoAnterior = primeiro(
    item?.original_price,
    item?.originalPrice,
    item?.listPrice,
    item?.list_price,
    item?.compare_at_price,
  );
  const moeda = moedaDoRegistro(item, pais);
  const precoFormatado = formatarPreco(precoAtual, moeda.symbol);
  const anteriorFormatado = formatarPreco(precoAnterior, moeda.symbol);
  const descontoBruto = primeiro(item?.discount_percent, item?.discountPercent, item?.discount);
  const desconto = descontoBruto
    ? /%/.test(descontoBruto)
      ? descontoBruto
      : `${descontoBruto}%`
    : "";
  const variacoes = jsonCurto(
    item?.variants ?? item?.variantOptions ?? item?.variant_options ?? item?.skus,
  );
  const especificacoes = jsonCurto(
    item?.specifications ?? item?.attributes ?? item?.product_attributes,
  );
  const avaliacao = primeiro(item?.rating, item?.product_rating, item?.ratingValue);
  const numeroAvaliacoes = primeiro(
    item?.review_count,
    item?.reviewCount,
    item?.reviews_count,
    item?.rating_count,
  );
  const vendidos = primeiro(item?.sold_count, item?.soldCount, item?.product_sold_count);
  const quantidade = primeiro(
    item?.available_quantity,
    item?.availableQuantity,
    item?.stock_total,
    item?.stockTotal,
  );
  const lojaId = primeiro(item?.shop_id, item?.shopId, item?.seller_id, item?.sellerId);
  const produtoUrl = primeiro(item?.product_url, item?.productUrl, item?.url);
  const imagens = item?.images ?? item?.image_urls ?? item?.imageUrls ?? item?.main_image ?? [];

  const tecnicas = [
    productId ? `ID do produto: ${productId}` : "",
    lojaId ? `ID da loja: ${lojaId}` : "",
    quantidade ? `Quantidade disponível: ${quantidade}` : "",
    especificacoes ? `Especificações: ${especificacoes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const dados = {
    nome,
    marca,
    vendedor,
    categoria,
    descricao,
    preco: precoFormatado,
    preco_promocional: anteriorFormatado,
    desconto,
    variacoes,
    informacoes_tecnicas: tecnicas,
    avaliacoes: avaliacao,
    numero_avaliacoes: numeroAvaliacoes,
    quantidade_vendida: vendidos,
    oferta: [precoFormatado, anteriorFormatado ? `antes ${anteriorFormatado}` : "", desconto]
      .filter(Boolean)
      .join(" · "),
  };

  const oferta = {
    current_price_value: precoAtual,
    current_price_formatted: precoFormatado,
    original_price_value: precoAnterior,
    original_price_formatted: anteriorFormatado,
    currency_code: moeda.code,
    currency_symbol: moeda.symbol,
    discount_text: desconto,
  };

  return {
    ...item,
    product_id: productId,
    product_name: nome,
    description: descricao,
    brand_name: marca,
    shop_name: vendedor,
    category_name: categoria,
    price: precoAtual,
    original_price: precoAnterior,
    currency_code: moeda.code,
    currency_symbol: moeda.symbol,
    product_url: produtoUrl,
    region: pais,
    images: imagens,
    __tiktok_factory_normalized: dados,
    __tiktok_factory_offer: oferta,
    __tiktok_factory_product_id: productId,
    __tiktok_factory_country_code: pais,
  };
}

function registroValido(item: any, productId: string | null) {
  if (!item || typeof item !== "object") return false;
  if (item.error || item.errorMessage || item.error_message) return false;
  const id = primeiro(item.product_id, item.productId, item.id);
  const nome = primeiro(item.product_name, item.productTitle, item.title, item.name);
  const preco = primeiro(item.price, item.salePrice, item.sale_price, item.current_price);
  const descricao = primeiro(item.description, item.product_description, item.productDescription);
  if (productId && id && id !== productId) return false;
  return Boolean(id || nome) && Boolean(nome || preco || descricao);
}

function montarEndpointAtor(actor: string, credenciais: CredenciaisApify) {
  const base = credenciais.modo === "gateway" ? APIFY_GATEWAY_BASE : APIFY_API_BASE;
  const endpoint = new URL(
    `${base}/v2/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items`,
  );
  endpoint.searchParams.set("clean", "true");
  endpoint.searchParams.set("timeout", "120");
  return endpoint;
}

function montarHeadersApify(credenciais: CredenciaisApify): Record<string, string> {
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

async function executarAtor(
  credenciais: CredenciaisApify,
  actor: string,
  input: Record<string, unknown>,
  op: OpcoesApifyProduto,
) {
  const endpoint = montarEndpointAtor(actor, credenciais);
  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: montarHeadersApify(credenciais),
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(Math.max(op.timeoutMs ?? 120_000, 135_000)),
  });
  const bruto = await res.text();
  if (!res.ok) {
    console.error(
      `[tiktok] ator ${actor} via ${credenciais.modo} falhou [${res.status}]: ${bruto.slice(0, 500)}`,
    );
    return null;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(bruto);
  } catch {
    console.error(`[tiktok] ator ${actor} retornou conteúdo não JSON`);
    return null;
  }
  const lista = Array.isArray(parsed) ? parsed : [parsed];
  const item = lista.find((i) => registroValido(i, op.productId ?? null));
  if (!item) {
    console.error(`[tiktok] ator ${actor} não retornou produto válido`);
    return null;
  }

  return { actor, item, modo: credenciais.modo };
}

export async function lerProdutoComApify(
  url: string,
  op: OpcoesApifyProduto,
): Promise<LeituraPagina | null> {
  const credenciais = obterCredenciaisApify();
  if (!credenciais) return null;

  const countryUpper = (op.country ?? "BR").toUpperCase();
  const countryLower = countryUpper.toLowerCase();
  const itemOuUrl = op.productId || url;

  const tentativas = [
    {
      actor: process.env["APIFY_TIKTOK_PRIMARY_ACTOR_ID"] || ATOR_PRIMARIO,
      input: { items: [itemOuUrl], country: countryLower, maxItems: 1 },
    },
    {
      actor: process.env["APIFY_TIKTOK_FALLBACK_ACTOR_ID"] || ATOR_FALLBACK,
      input: {
        product_urls: [url],
        region: countryUpper,
        max_results: 1,
        scrape_product_details: true,
      },
    },
  ];

  for (const tentativa of tentativas) {
    try {
      const resposta = await executarAtor(
        credenciais,
        tentativa.actor,
        tentativa.input,
        op,
      );
      if (!resposta) continue;
      const normalizado = normalizarRegistro(
        resposta.item,
        countryUpper,
        op.productId ?? null,
      );
      const corpo = JSON.stringify(normalizado).slice(0, LIMITE_CORPO);
      return {
        motor: "apify",
        final_url: primeiro(normalizado.product_url, url),
        status: 200,
        html: `<body><pre>${corpo.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body>`,
        rede: [{ url: `apify-${resposta.modo}://${resposta.actor}`, corpo }],
        erro: null,
      };
    } catch (e) {
      console.error(
        `[tiktok] erro no ator ${tentativa.actor}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return null;
}
