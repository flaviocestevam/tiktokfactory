/* eslint-disable @typescript-eslint/no-explicit-any */
// Leitura de páginas de produto do TikTok Shop (somente servidor).
import { callAIJson } from "./ai.server";

const HOSTS_PERMITIDOS = new Set([
  "shop.tiktok.com",
  "www.tiktok.com",
  "tiktok.com",
  "vt.tiktok.com",
  "vm.tiktok.com",
  "m.tiktok.com",
]);

const MAX_REDIRECIONAMENTOS = 6;
const TEMPO_LIMITE = 15_000;

export function validarUrlTikTok(bruto: string): URL {
  let url: URL;
  try {
    url = new URL(bruto.trim());
  } catch {
    throw new Error("Link inválido. Cole o link copiado do TikTok Shop.");
  }
  if (url.protocol !== "https:") throw new Error("Só aceitamos links https do TikTok.");
  const host = url.hostname.toLowerCase();
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[)/.test(host)) {
    throw new Error("Endereço não permitido.");
  }
  if (!HOSTS_PERMITIDOS.has(host)) {
    throw new Error(
      "Este link não é do TikTok Shop. Use um link de shop.tiktok.com, tiktok.com ou vt.tiktok.com.",
    );
  }
  return url;
}

export function ehLinkCurto(url: URL) {
  return url.hostname === "vt.tiktok.com" || url.hostname === "vm.tiktok.com";
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/** Segue redirecionamentos manualmente, validando cada salto. */
export async function resolverUrl(url: URL): Promise<URL> {
  let atual = url;
  for (let i = 0; i < MAX_REDIRECIONAMENTOS; i++) {
    let res: Response;
    try {
      res = await fetch(atual.toString(), {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" },
        signal: AbortSignal.timeout(TEMPO_LIMITE),
      });
    } catch {
      return atual;
    }
    const local = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && local) {
      try {
        atual = validarUrlTikTok(new URL(local, atual).toString());
      } catch {
        return atual;
      }
      continue;
    }
    return atual;
  }
  return atual;
}

export function extrairProductId(url: URL): string | null {
  const caminho = url.pathname;
  const porCaminho = caminho.match(/\/(?:view\/)?product\/(\d{6,})/);
  if (porCaminho) return porCaminho[1];
  const porQuery =
    url.searchParams.get("product_id") ??
    url.searchParams.get("pdp_id") ??
    url.searchParams.get("productId");
  if (porQuery && /^\d{6,}$/.test(porQuery)) return porQuery;
  const solto = caminho.match(/\/(\d{15,})/);
  return solto ? solto[1] : null;
}

export function extrairRegiao(url: URL): string | null {
  return (
    url.searchParams.get("region") ??
    url.searchParams.get("locale") ??
    url.pathname.match(/^\/([a-z]{2}-[A-Z]{2})\//)?.[1] ??
    null
  );
}

async function baixarHtml(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9" },
      redirect: "follow",
      signal: AbortSignal.timeout(TEMPO_LIMITE),
    });
    if (!res.ok) return { html: "", erro: `A página respondeu com o código ${res.status}.` };
    return { html: await res.text(), erro: null as string | null };
  } catch (e) {
    return { html: "", erro: e instanceof Error ? e.message : "Falha de rede ao acessar o link." };
  }
}

/** Leitura com renderização de JavaScript (opcional, via Firecrawl). */
async function lerComFirecrawl(url: string) {
  const key = process.env["FIRECRAWL_API_KEY"];
  if (!key) return null;
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: false, waitFor: 3000 }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error(`Firecrawl falhou [${res.status}]: ${await res.text()}`);
      return null;
    }
    const json = (await res.json()) as any;
    const md: string = json?.data?.markdown ?? "";
    const imagens: string[] = [];
    for (const m of md.matchAll(/!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g)) imagens.push(m[1]);
    return { texto: md, imagens: [...new Set(imagens)].slice(0, 20) };
  } catch (e) {
    console.error("Firecrawl erro:", e);
    return null;
  }
}

/* ── Coleta de dados estruturados antes de remover scripts ── */

function coletarJsonLd(html: string) {
  const blocos: string[] = [];
  for (const m of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    blocos.push(m[1].trim().slice(0, 20_000));
  }
  return blocos;
}

function coletarScriptsDeDados(html: string) {
  const blocos: string[] = [];
  const ids = [
    "__UNIVERSAL_DATA_FOR_REHYDRATION__",
    "__NEXT_DATA__",
    "SIGI_STATE",
    "RENDER_DATA",
    "__MODERN_ROUTER_DATA__",
  ];
  for (const id of ids) {
    const re = new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i");
    const m = html.match(re);
    if (m) blocos.push(m[1].slice(0, 60_000));
  }
  return blocos;
}

function coletarMeta(html: string) {
  const meta: Record<string, string> = {};
  for (const m of html.matchAll(/<meta[^>]+>/gi)) {
    const tag = m[0];
    const chave =
      tag.match(/property=["']([^"']+)["']/i)?.[1] ?? tag.match(/name=["']([^"']+)["']/i)?.[1];
    const valor = tag.match(/content=["']([^"']*)["']/i)?.[1];
    if (chave && valor) meta[chave] = valor;
  }
  const titulo = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  if (titulo) meta.title = titulo;
  return meta;
}

function coletarImagens(html: string, base: string, meta: Record<string, string>) {
  const urls = new Set<string>();
  if (meta["og:image"]) urls.add(meta["og:image"]);
  const re = /<(?:img|source)[^>]+(?:src|data-src|srcset)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && urls.size < 20) {
    const raw = m[1].split(" ")[0];
    if (!raw || raw.startsWith("data:")) continue;
    try {
      urls.add(new URL(raw, base).toString());
    } catch {
      /* ignora */
    }
  }
  return [...urls];
}

function htmlParaTexto(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const CAMPOS_PRODUTO = [
  "nome",
  "marca",
  "vendedor",
  "categoria",
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

const SHAPE = `{${CAMPOS_PRODUTO.map((c) => `"${c}":""`).join(",")}}`;

export type ResultadoAnalise = {
  ok: boolean;
  mensagem: string;
  detalhe: string | null;
  fonte: "tiktok_shop" | "firecrawl" | "nenhuma";
  dados: DadosProduto;
  origem: Record<string, string>;
  imagens: string[];
  original_tiktok_url: string;
  resolved_tiktok_url: string;
  tiktok_product_id: string | null;
  tiktok_region: string | null;
};

export async function analisarProdutoTikTokShop(linkOriginal: string): Promise<ResultadoAnalise> {
  const url = validarUrlTikTok(linkOriginal);
  const resolvido = ehLinkCurto(url) ? await resolverUrl(url) : url;

  const base: Omit<
    ResultadoAnalise,
    "ok" | "mensagem" | "detalhe" | "fonte" | "dados" | "origem" | "imagens"
  > = {
    original_tiktok_url: linkOriginal.trim(),
    resolved_tiktok_url: resolvido.toString(),
    tiktok_product_id: extrairProductId(resolvido) ?? extrairProductId(url),
    tiktok_region: extrairRegiao(resolvido) ?? extrairRegiao(url),
  };

  const { html, erro } = await baixarHtml(resolvido.toString());
  const meta = coletarMeta(html);
  const jsonld = coletarJsonLd(html);
  const scripts = coletarScriptsDeDados(html);
  let imagens = coletarImagens(html, resolvido.toString(), meta);
  let texto = htmlParaTexto(html);
  let fonte: ResultadoAnalise["fonte"] = html ? "tiktok_shop" : "nenhuma";

  const conteudoUtil = texto.length > 400 || jsonld.length > 0 || scripts.length > 0;
  if (!conteudoUtil) {
    const fire = await lerComFirecrawl(resolvido.toString());
    if (fire && fire.texto.length > 200) {
      texto = fire.texto;
      imagens = [...new Set([...imagens, ...fire.imagens])];
      fonte = "firecrawl";
    }
  }

  const bruto = [
    jsonld.length ? `JSON-LD:\n${jsonld.join("\n")}` : "",
    Object.keys(meta).length ? `METADADOS:\n${JSON.stringify(meta).slice(0, 6000)}` : "",
    scripts.length ? `DADOS EMBUTIDOS:\n${scripts.join("\n").slice(0, 40_000)}` : "",
    texto ? `TEXTO DA PÁGINA:\n${texto.slice(0, 24_000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  if (!bruto.trim()) {
    return {
      ...base,
      ok: false,
      fonte: "nenhuma",
      mensagem:
        "Não conseguimos ler todas as informações deste produto automaticamente. Cole a descrição ou envie imagens da página para continuar.",
      detalhe: erro,
      dados: {},
      origem: {},
      imagens,
    };
  }

  const dados = await callAIJson<DadosProduto>(
    "Você extrai informações factuais de páginas de produto do TikTok Shop. Só preencha um campo se ele estiver realmente presente no conteúdo. Nunca invente, nunca deduza. Deixe string vazia quando não encontrar.",
    `Extraia os dados deste produto do TikTok Shop.\nURL: ${base.resolved_tiktok_url}\n\nCONTEÚDO:\n${bruto}`,
    SHAPE,
  );

  const origem: Record<string, string> = {};
  for (const campo of CAMPOS_PRODUTO) {
    if (String(dados[campo] ?? "").trim()) origem[campo] = "tiktok_shop";
  }

  const preenchidos = Object.keys(origem).length;
  return {
    ...base,
    ok: preenchidos >= 3,
    fonte,
    mensagem:
      preenchidos >= 3
        ? "Informações lidas do TikTok Shop. Confira e ajuste antes de continuar."
        : "Não conseguimos ler todas as informações deste produto automaticamente. Cole a descrição ou envie imagens da página para continuar.",
    detalhe: erro,
    dados,
    origem,
    imagens,
  };
}
