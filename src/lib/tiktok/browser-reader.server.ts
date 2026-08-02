/* eslint-disable @typescript-eslint/no-explicit-any */
// Leitura da página com fontes estruturadas e navegadores renderizados.
import type { LeituraPagina, RespostaRede } from "./types";
import { UA_NAVEGADOR } from "./resolve-url.server";
import { PADROES_REDE_PRODUTO } from "./network-capture.server";

export type OpcoesLeitura = {
  locale?: string | null;
  country?: string | null;
  timezone?: string | null;
  productId?: string | null;
  rolar?: boolean;
  esperaMs?: number;
  timeoutMs?: number;
};

const LIMITE_CORPO = 120_000;
const BLOQUEIO =
  /captcha|verify (that )?you are human|verify to continue|drag the puzzle|slide to verify|access denied|login to continue|sign up to continue|not available in your (region|country)|region not supported/i;

function endpointFuncao(base: string) {
  const limpo = base.replace(/\/+$/, "");
  return limpo.endsWith("/function") ? limpo : `${limpo}/function`;
}

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pontuarLeitura(leitura: LeituraPagina, productId?: string | null) {
  const html = leitura.html ?? "";
  const rede = leitura.rede.map((r) => r.corpo).join("\n");
  const bruto = `${html.slice(0, 180_000)}\n${rede.slice(0, 120_000)}`;
  const baixo = bruto.toLowerCase();
  let pontos = 0;

  if (leitura.status && leitura.status >= 200 && leitura.status < 400) pontos += 1;
  if (productId && bruto.includes(productId)) pontos += 12;
  if (leitura.rede.length) pontos += 6;
  if (leitura.motor === "apify" && /product|title|price|seller|description|sku/i.test(bruto)) {
    pontos += 10;
  }
  if (/application\/ld\+json/i.test(html) && /"@type"\s*:\s*"product"/i.test(html)) pontos += 6;
  if (/"product_id"|"productId"|"product_base"|"sku_list"|"skus"/i.test(bruto)) pontos += 4;
  if (/og:title|<h1|"title"\s*:/i.test(html)) pontos += 2;
  if (/price|preço|currency|moeda|r\$|\$|£|€|฿|rp\.?/i.test(baixo)) pontos += 2;
  if (/seller|vendedor|merchant|loja|shop_name/i.test(baixo)) pontos += 1;
  if (html.length > 1_500) pontos += 1;
  if (BLOQUEIO.test(bruto)) pontos -= 20;

  return pontos;
}

function leituraUtil(leitura: LeituraPagina | null, productId?: string | null) {
  return Boolean(leitura && pontuarLeitura(leitura, productId) >= 6);
}

/** Leitor estruturado prioritário. Requer APIFY_TOKEN no ambiente do servidor. */
async function lerComApify(url: string, op: OpcoesLeitura): Promise<LeituraPagina | null> {
  const token = process.env["APIFY_TOKEN"];
  if (!token) return null;

  const actor = process.env["APIFY_TIKTOK_ACTOR_ID"] || "lemur~tiktok-shop-products";
  const endpoint = new URL(
    `https://api.apify.com/v2/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items`,
  );
  endpoint.searchParams.set("token", token);
  endpoint.searchParams.set("clean", "true");

  try {
    const res = await fetch(endpoint.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product: url,
        responseType: "structured",
        country: (op.country ?? "").toLowerCase() || undefined,
        proxy: process.env["APIFY_TIKTOK_PROXY"] || "",
      }),
      signal: AbortSignal.timeout(op.timeoutMs ?? 120_000),
    });
    const texto = await res.text();
    if (!res.ok) {
      console.error(`[tiktok] apify falhou [${res.status}]: ${texto.slice(0, 500)}`);
      return null;
    }

    let itens: any;
    try {
      itens = JSON.parse(texto);
    } catch {
      console.error("[tiktok] apify retornou conteúdo não JSON");
      return null;
    }
    const lista = Array.isArray(itens) ? itens : [itens];
    const validos = lista.filter((item) => item && typeof item === "object");
    if (!validos.length) return null;

    const corpo = JSON.stringify(validos).slice(0, LIMITE_CORPO);
    if (!/product|title|price|seller|description|sku|name/i.test(corpo)) {
      console.error("[tiktok] apify não retornou sinais de produto");
      return null;
    }

    return {
      motor: "apify",
      final_url: url,
      status: res.status,
      html: `<body><pre>${escaparHtml(corpo)}</pre></body>`,
      rede: [{ url: endpoint.toString().replace(token, "***"), corpo }],
      erro: null,
    };
  } catch (e) {
    console.error("[tiktok] erro no apify:", e instanceof Error ? e.message : e);
    return null;
  }
}

/** Script executado dentro do Chromium remoto (Playwright/Browserless). */
const SCRIPT_NAVEGADOR = `
export default async function ({ page, context }) {
  const { url, locale, timezone, rolar, esperaMs, padroes } = context;
  const capturas = [];
  page.on('response', async (res) => {
    try {
      const u = res.url();
      if (!padroes.some((p) => u.toLowerCase().includes(p))) return;
      const tipo = (res.headers()['content-type'] || '').toLowerCase();
      if (!tipo.includes('json') && !tipo.includes('text')) return;
      const corpo = await res.text();
      if (corpo && corpo.length > 40) capturas.push({ url: u, corpo: corpo.slice(0, 120000) });
    } catch (_) {}
  });
  if (locale) { try { await page.setExtraHTTPHeaders({ 'Accept-Language': locale }); } catch (_) {} }
  if (timezone) { try { await page.emulateTimezone(timezone); } catch (_) {} }
  const resposta = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch (_) {}
  try {
    await page.waitForSelector('script[type="application/ld+json"], [class*="product"], h1', { timeout: 12000 });
  } catch (_) {}
  if (rolar) {
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(700);
    }
    try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (_) {}
  }
  if (esperaMs) await page.waitForTimeout(esperaMs);
  const html = await page.content();
  return {
    data: { html, final_url: page.url(), status: resposta ? resposta.status() : null, rede: capturas },
    type: 'application/json',
  };
}
`;

async function lerComNavegadorRemoto(
  url: string,
  op: OpcoesLeitura,
): Promise<LeituraPagina | null> {
  const base = process.env["BROWSER_SERVICE_URL"];
  if (!base) return null;
  const token = process.env["BROWSER_SERVICE_TOKEN"];
  const alvo = new URL(endpointFuncao(base));
  if (token && !alvo.searchParams.get("token")) alvo.searchParams.set("token", token);

  try {
    const res = await fetch(alvo.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        code: SCRIPT_NAVEGADOR,
        context: {
          url,
          locale: op.locale ?? null,
          timezone: op.timezone ?? null,
          rolar: !!op.rolar,
          esperaMs: op.esperaMs ?? 1500,
          padroes: PADROES_REDE_PRODUTO,
        },
      }),
      signal: AbortSignal.timeout(op.timeoutMs ?? 90_000),
    });
    if (!res.ok) {
      console.error(`[tiktok] navegador remoto falhou [${res.status}]: ${await res.text()}`);
      return null;
    }
    const json: any = await res.json();
    const dados = json?.data ?? json;
    const rede: RespostaRede[] = Array.isArray(dados?.rede) ? dados.rede : [];
    return {
      motor: "browser_service",
      final_url: dados?.final_url ?? url,
      status: dados?.status ?? null,
      html: String(dados?.html ?? ""),
      rede: rede.map((r) => ({ url: r.url, corpo: String(r.corpo).slice(0, LIMITE_CORPO) })),
      erro: null,
    };
  } catch (e) {
    console.error("[tiktok] erro no navegador remoto:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function lerComFirecrawl(url: string, op: OpcoesLeitura): Promise<LeituraPagina | null> {
  const key = process.env["FIRECRAWL_API_KEY"];
  if (!key) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        formats: ["rawHtml", "markdown"],
        onlyMainContent: false,
        waitFor: Math.max(6000, op.esperaMs ?? 0),
        headers: op.locale ? { "Accept-Language": op.locale } : undefined,
      }),
      signal: AbortSignal.timeout(op.timeoutMs ?? 90_000),
    });
    if (!res.ok) {
      console.error(`[tiktok] firecrawl falhou [${res.status}]: ${await res.text()}`);
      return null;
    }
    const json: any = await res.json();
    const html: string = json?.data?.rawHtml ?? json?.data?.html ?? "";
    const markdown: string = json?.data?.markdown ?? "";
    if (!html && !markdown) return null;
    return {
      motor: "firecrawl",
      final_url: json?.data?.metadata?.sourceURL ?? url,
      status: json?.data?.metadata?.statusCode ?? null,
      html: html || `<body><pre>${escaparHtml(markdown)}</pre></body>`,
      rede: [],
      erro: null,
    };
  } catch (e) {
    console.error("[tiktok] erro no firecrawl:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function lerComJina(url: string, op: OpcoesLeitura): Promise<LeituraPagina | null> {
  const key = process.env["JINA_API_KEY"];
  const alvo = `https://r.jina.ai/${url}`;
  const timeoutSegundos = Math.max(20, Math.min(120, Math.ceil((op.timeoutMs ?? 90_000) / 1000)));

  try {
    const res = await fetch(alvo, {
      method: "GET",
      headers: {
        Accept: "text/plain",
        "X-Engine": "browser",
        "X-No-Cache": "true",
        "X-Respond-With": "markdown",
        "X-Respond-Timing": "network-idle",
        "X-Timeout": String(timeoutSegundos),
        "X-Max-Tokens": "24000",
        ...(op.locale ? { "Accept-Language": op.locale } : {}),
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      signal: AbortSignal.timeout(op.timeoutMs ?? 90_000),
    });
    const texto = await res.text();
    if (!res.ok || texto.trim().length < 80) {
      console.error(`[tiktok] jina falhou [${res.status}]: ${texto.slice(0, 300)}`);
      return null;
    }
    return {
      motor: "jina",
      final_url: url,
      status: res.status,
      html: `<body><pre>${escaparHtml(texto)}</pre></body>`,
      rede: [],
      erro: null,
    };
  } catch (e) {
    console.error("[tiktok] erro no jina:", e instanceof Error ? e.message : e);
    return null;
  }
}

async function lerComFetch(url: string, op: OpcoesLeitura): Promise<LeituraPagina> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA_NAVEGADOR,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": op.locale ? `${op.locale},en;q=0.8` : "en-US,en;q=0.9",
        Referer: "https://www.tiktok.com/",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(Math.min(op.timeoutMs ?? 20_000, 45_000)),
    });
    const html = res.ok ? await res.text() : "";
    return {
      motor: "fetch",
      final_url: res.url || url,
      status: res.status,
      html,
      rede: [],
      erro: res.ok ? null : `A página respondeu com o código ${res.status}.`,
    };
  } catch (e) {
    return {
      motor: "fetch",
      final_url: url,
      status: null,
      html: "",
      rede: [],
      erro: e instanceof Error ? e.message : "Falha de rede ao acessar o link.",
    };
  }
}

export async function lerPagina(url: string, op: OpcoesLeitura = {}): Promise<LeituraPagina> {
  const candidatos: LeituraPagina[] = [];

  const apify = await lerComApify(url, op);
  if (apify) {
    candidatos.push(apify);
    if (leituraUtil(apify, op.productId)) return apify;
  }

  const remoto = await lerComNavegadorRemoto(url, op);
  if (remoto) {
    candidatos.push(remoto);
    if (leituraUtil(remoto, op.productId)) return remoto;
  }

  const fire = await lerComFirecrawl(url, op);
  if (fire) {
    candidatos.push(fire);
    if (leituraUtil(fire, op.productId)) return fire;
  }

  const jina = await lerComJina(url, op);
  if (jina) {
    candidatos.push(jina);
    if (leituraUtil(jina, op.productId)) return jina;
  }

  const direto = await lerComFetch(url, op);
  candidatos.push(direto);

  return candidatos.sort(
    (a, b) => pontuarLeitura(b, op.productId) - pontuarLeitura(a, op.productId),
  )[0];
}

export function statusLeitoresProduto() {
  return {
    apify: Boolean(process.env["APIFY_TOKEN"]),
    browser_service: Boolean(process.env["BROWSER_SERVICE_URL"]),
    firecrawl: Boolean(process.env["FIRECRAWL_API_KEY"]),
    jina: true,
  };
}

export function navegadorRenderizadoDisponivel() {
  return true;
}
