/* eslint-disable @typescript-eslint/no-explicit-any */
// Leitura da página com navegador renderizado (Chromium remoto), com alternativas.
import type { LeituraPagina, RespostaRede } from "./types";
import { UA_NAVEGADOR } from "./resolve-url.server";
import { PADROES_REDE_PRODUTO } from "./network-capture.server";

export type OpcoesLeitura = {
  locale?: string | null;
  country?: string | null;
  timezone?: string | null;
  rolar?: boolean;
  esperaMs?: number;
  timeoutMs?: number;
};

const LIMITE_CORPO = 120_000;

function endpointFuncao(base: string) {
  const limpo = base.replace(/\/+$/, "");
  return limpo.endsWith("/function") ? limpo : `${limpo}/function`;
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
    try {
      const botoes = await page.$$('button, [role="button"]');
      for (const b of botoes.slice(0, 12)) { try { await b.click({ timeout: 800 }); } catch (_) {} }
    } catch (_) {}
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

/** Leitor renderizado secundário. */
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
        waitFor: 6000,
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
      html: html || `<body>${markdown}</body>`,
      rede: [],
      erro: null,
    };
  } catch (e) {
    console.error("[tiktok] erro no firecrawl:", e instanceof Error ? e.message : e);
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
      },
      redirect: "follow",
      signal: AbortSignal.timeout(op.timeoutMs ?? 20_000),
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

/** Motor principal: navegador renderizado; alternativas só quando ele não está disponível. */
export async function lerPagina(url: string, op: OpcoesLeitura = {}): Promise<LeituraPagina> {
  const remoto = await lerComNavegadorRemoto(url, op);
  if (remoto && (remoto.html.length > 500 || remoto.rede.length)) return remoto;
  const fire = await lerComFirecrawl(url, op);
  if (fire && fire.html.length > 500) return fire;
  return remoto ?? fire ?? (await lerComFetch(url, op));
}

export function navegadorRenderizadoDisponivel() {
  return Boolean(process.env["BROWSER_SERVICE_URL"] || process.env["FIRECRAWL_API_KEY"]);
}
