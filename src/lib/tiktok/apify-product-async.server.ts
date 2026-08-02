/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LeituraPagina } from "./types";

export type OpcoesApifyProduto = {
  country?: string | null;
  productId?: string | null;
  timeoutMs?: number;
};

type CredenciaisApify =
  | { modo: "gateway"; connectionKey: string; lovableKey: string }
  | { modo: "token"; token: string };

type RunApify = {
  id: string;
  status: string;
  defaultDatasetId: string;
};

const APIFY_API_BASE = "https://api.apify.com";
const APIFY_GATEWAY_BASE = "https://connector-gateway.lovable.dev/apify";
const ATOR_PRIMARIO = "jungle_synthesizer~tiktok-shop-product-detail-scraper";
const ATOR_FALLBACK = "herus13~tiktok-shop-scraper";
const LIMITE_CORPO = 120_000;
const TEMPO_TOTAL_MAXIMO_MS = 90_000;
const STATUS_FINAIS = new Set(["SUCCEEDED", "FAILED", "TIMED-OUT", "ABORTED"]);

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

function primeiro(...valores: unknown[]): string {
  for (const valor of valores) {
    const t = texto(valor);
    if (t) return t;
  }
  return "";
}

function objeto(valor: unknown): Record<string, any> {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, any>)
    : {};
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
  return token ? { modo: "token", token } : null;
}

export function apifyProdutoDisponivel() {
  return Boolean(obterCredenciaisApify());
}

function baseApi(credenciais: CredenciaisApify) {
  return credenciais.modo === "gateway" ? APIFY_GATEWAY_BASE : APIFY_API_BASE;
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

function desempacotar(valor: any) {
  return valor?.data ?? valor;
}

async function requisitarJson(
  credenciais: CredenciaisApify,
  url: URL,
  init: RequestInit,
  timeoutMs: number,
): Promise<any | null> {
  const resposta = await fetch(url.toString(), {
    ...init,
    headers: { ...headers(credenciais), ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(Math.max(2_000, timeoutMs)),
  });
  const corpo = await resposta.text();
  if (!resposta.ok) {
    console.error(`[tiktok] Apify ${resposta.status}: ${corpo.slice(0, 500)}`);
    return null;
  }
  try {
    return JSON.parse(corpo);
  } catch {
    console.error("[tiktok] Apify retornou conteúdo não JSON");
    return null;
  }
}

function lerRun(valor: any): RunApify | null {
  const run = desempacotar(valor);
  const id = primeiro(run?.id);
  if (!id) return null;
  return {
    id,
    status: primeiro(run?.status).toUpperCase(),
    defaultDatasetId: primeiro(run?.defaultDatasetId, run?.default_dataset_id),
  };
}

async function iniciarRun(
  credenciais: CredenciaisApify,
  actor: string,
  input: Record<string, unknown>,
  timeoutMs: number,
): Promise<RunApify | null> {
  const url = new URL(
    `${baseApi(credenciais)}/v2/acts/${encodeURIComponent(actor)}/runs`,
  );
  url.searchParams.set("timeout", String(Math.max(30, Math.ceil(timeoutMs / 1_000))));
  url.searchParams.set("maxItems", "1");

  const payload = await requisitarJson(
    credenciais,
    url,
    { method: "POST", body: JSON.stringify(input) },
    15_000,
  );
  return lerRun(payload);
}

async function consultarRun(
  credenciais: CredenciaisApify,
  runId: string,
  waitSeconds: number,
): Promise<RunApify | null> {
  const url = new URL(`${baseApi(credenciais)}/v2/actor-runs/${encodeURIComponent(runId)}`);
  url.searchParams.set("waitForFinish", String(waitSeconds));
  const payload = await requisitarJson(
    credenciais,
    url,
    { method: "GET" },
    (waitSeconds + 8) * 1_000,
  );
  return lerRun(payload);
}

async function abortarRun(credenciais: CredenciaisApify, runId: string) {
  try {
    const url = new URL(
      `${baseApi(credenciais)}/v2/actor-runs/${encodeURIComponent(runId)}/abort`,
    );
    url.searchParams.set("gracefully", "true");
    await requisitarJson(credenciais, url, { method: "POST" }, 8_000);
  } catch {
    // A execução também será encerrada pelo timeout configurado no próprio Actor.
  }
}

function listaItens(valor: any): any[] {
  if (Array.isArray(valor)) return valor;
  const aberto = desempacotar(valor);
  if (Array.isArray(aberto)) return aberto;
  if (Array.isArray(aberto?.items)) return aberto.items;
  if (Array.isArray(aberto?.data?.items)) return aberto.data.items;
  return aberto && typeof aberto === "object" ? [aberto] : [];
}

async function buscarDataset(
  credenciais: CredenciaisApify,
  datasetId: string,
): Promise<any[]> {
  const url = new URL(
    `${baseApi(credenciais)}/v2/datasets/${encodeURIComponent(datasetId)}/items`,
  );
  url.searchParams.set("clean", "true");
  url.searchParams.set("limit", "10");
  const payload = await requisitarJson(credenciais, url, { method: "GET" }, 15_000);
  return listaItens(payload);
}

function abrirRegistro(item: any): any {
  const base = objeto(item);
  const data = objeto(base.data);
  return base.product ?? data.product ?? base.result ?? (Object.keys(data).length ? data : base);
}

function registroValido(item: any, productIdEsperado: string | null) {
  const registro = abrirRegistro(item);
  if (!registro || typeof registro !== "object") return false;
  if (registro.error || registro.errorMessage || registro.error_message) return false;
  const id = primeiro(registro.product_id, registro.productId, registro.id);
  if (productIdEsperado && id && id !== productIdEsperado) return false;
  const nome = primeiro(
    registro.product_name,
    registro.productTitle,
    registro.product_title,
    registro.title,
    registro.name,
  );
  const preco = primeiro(
    registro.salePrice,
    registro.sale_price,
    registro.price,
    registro.current_price,
    registro.currentPrice,
  );
  const descricao = primeiro(
    registro.description,
    registro.product_description,
    registro.productDescription,
  );
  return Boolean(id || nome) && Boolean(nome || preco || descricao);
}

async function executarAtor(
  credenciais: CredenciaisApify,
  actor: string,
  input: Record<string, unknown>,
  productId: string | null,
  timeoutMs: number,
) {
  const deadline = Date.now() + timeoutMs;
  const inicial = await iniciarRun(credenciais, actor, input, timeoutMs);
  if (!inicial) return null;

  let run = inicial;
  while (!STATUS_FINAIS.has(run.status) && Date.now() < deadline) {
    const restante = deadline - Date.now();
    const espera = Math.max(1, Math.min(15, Math.floor(restante / 1_000)));
    const atualizado = await consultarRun(credenciais, run.id, espera);
    if (!atualizado) break;
    run = atualizado;
  }

  if (run.status !== "SUCCEEDED") {
    if (!STATUS_FINAIS.has(run.status)) await abortarRun(credenciais, run.id);
    console.error(`[tiktok] ator ${actor} terminou com status ${run.status || "DESCONHECIDO"}`);
    return null;
  }

  const datasetId = run.defaultDatasetId || inicial.defaultDatasetId;
  if (!datasetId) {
    console.error(`[tiktok] ator ${actor} concluiu sem dataset`);
    return null;
  }

  const itens = await buscarDataset(credenciais, datasetId);
  const item = itens.find((candidato) => registroValido(candidato, productId));
  if (!item) {
    console.error(`[tiktok] ator ${actor} não retornou produto válido`);
    return null;
  }
  return abrirRegistro(item);
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

function caminhoCategoria(valor: unknown): string {
  if (typeof valor === "string") return valor.trim();
  if (!Array.isArray(valor)) return "";
  return valor
    .map((item) =>
      typeof item === "string" ? item.trim() : primeiro(item?.name, item?.title),
    )
    .filter(Boolean)
    .join(" > ");
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
  const moedaBruta = primeiro(
    item?.currency_code,
    item?.currencyCode,
    item?.price_currency,
    item?.priceCurrency,
    item?.currency,
  );
  const padraoMoeda = MOEDA_POR_PAIS[pais] ?? { code: "", symbol: "" };
  const moedaCode = /^[A-Z]{3}$/i.test(moedaBruta) ? moedaBruta.toUpperCase() : padraoMoeda.code;
  const moedaSymbol = /^[A-Z]{3}$/i.test(moedaBruta)
    ? Object.values(MOEDA_POR_PAIS).find((m) => m.code === moedaCode)?.symbol ?? ""
    : moedaBruta || padraoMoeda.symbol;
  const formatarPreco = (valor: string) =>
    valor && moedaSymbol && !valor.includes(moedaSymbol) ? `${moedaSymbol} ${valor}` : valor;
  const precoFormatado = formatarPreco(precoAtual);
  const anteriorFormatado = formatarPreco(precoAnterior);
  const descontoBruto = primeiro(item?.discount_percent, item?.discountPercent, item?.discount);
  const desconto = descontoBruto
    ? descontoBruto.includes("%")
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
  const informacoesTecnicas = [
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
    informacoes_tecnicas: informacoesTecnicas,
    avaliacoes: avaliacao,
    numero_avaliacoes: numeroAvaliacoes,
    quantidade_vendida: vendidos,
    oferta: [precoFormatado, anteriorFormatado ? `antes ${anteriorFormatado}` : "", desconto]
      .filter(Boolean)
      .join(" · "),
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
    currency_code: moedaCode,
    currency_symbol: moedaSymbol,
    product_url: produtoUrl,
    region: pais,
    images: [],
    __tiktok_factory_normalized: dados,
    __tiktok_factory_offer: {
      current_price_value: precoAtual,
      current_price_formatted: precoFormatado,
      original_price_value: precoAnterior,
      original_price_formatted: anteriorFormatado,
      currency_code: moedaCode,
      currency_symbol: moedaSymbol,
      discount_text: desconto,
    },
    __tiktok_factory_product_id: productId,
    __tiktok_factory_country_code: pais,
  };
}

export async function lerProdutoComApify(
  url: string,
  op: OpcoesApifyProduto,
): Promise<LeituraPagina | null> {
  const credenciais = obterCredenciaisApify();
  if (!credenciais) return null;

  const inicio = Date.now();
  const limiteTotal = Math.min(
    TEMPO_TOTAL_MAXIMO_MS,
    Math.max(45_000, op.timeoutMs ?? TEMPO_TOTAL_MAXIMO_MS),
  );
  const countryUpper = (op.country ?? "BR").toUpperCase();
  const countryLower = countryUpper.toLowerCase();
  const itemOuUrl = op.productId || url;
  const tentativas = [
    {
      actor: process.env["APIFY_TIKTOK_PRIMARY_ACTOR_ID"] || ATOR_PRIMARIO,
      input: { items: [itemOuUrl], country: countryLower, maxItems: 1 },
      budgetMs: 60_000,
    },
    {
      actor: process.env["APIFY_TIKTOK_FALLBACK_ACTOR_ID"] || ATOR_FALLBACK,
      input: {
        product_urls: [url],
        region: countryUpper,
        max_results: 1,
        scrape_product_details: true,
      },
      budgetMs: 30_000,
    },
  ];

  for (const tentativa of tentativas) {
    const restante = limiteTotal - (Date.now() - inicio);
    if (restante < 12_000) break;
    const budget = Math.min(tentativa.budgetMs, restante);
    try {
      const item = await executarAtor(
        credenciais,
        tentativa.actor,
        tentativa.input,
        op.productId ?? null,
        budget,
      );
      if (!item) continue;
      const normalizado = normalizarRegistro(item, countryUpper, op.productId ?? null);
      const corpo = JSON.stringify(normalizado).slice(0, LIMITE_CORPO);
      return {
        motor: "apify",
        final_url: primeiro(normalizado.product_url, url),
        status: 200,
        html: `<body><pre>${corpo
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre></body>`,
        rede: [{ url: `apify-${credenciais.modo}://${tentativa.actor}`, corpo }],
        erro: null,
      };
    } catch (erro) {
      console.error(
        `[tiktok] erro no ator ${tentativa.actor}:`,
        erro instanceof Error ? erro.message : erro,
      );
    }
  }

  return null;
}
