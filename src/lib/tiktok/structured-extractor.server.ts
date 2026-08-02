/* eslint-disable @typescript-eslint/no-explicit-any */
// Camadas 1 a 5: rede, JSON-LD, hidratação, metadados e DOM renderizado.
import type { BloqueioDetectado, LeituraPagina, RespostaRede } from "./types";
import { selecionarRespostas } from "./network-capture.server";

export type ConteudoExtraido = {
  rede: RespostaRede[];
  jsonld: string[];
  hidratacao: string[];
  meta: Record<string, string>;
  texto: string;
  imagens: string[];
  bloqueio: BloqueioDetectado;
  bruto: string;
};

export function coletarJsonLd(html: string) {
  const blocos: string[] = [];
  for (const m of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    const texto = m[1].trim();
    if (texto) blocos.push(texto.slice(0, 20_000));
  }
  return blocos;
}

/** Dados de hidratação: procura por IDs conhecidos e por qualquer script com product_id. */
export function coletarHidratacao(html: string) {
  const blocos: string[] = [];
  const ids = [
    "__UNIVERSAL_DATA_FOR_REHYDRATION__",
    "__NEXT_DATA__",
    "SIGI_STATE",
    "RENDER_DATA",
    "__MODERN_ROUTER_DATA__",
    "__PACE_DATA__",
  ];
  for (const id of ids) {
    const m = html.match(
      new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, "i"),
    );
    if (m?.[1]?.trim()) blocos.push(m[1].slice(0, 80_000));
  }
  if (!blocos.length) {
    for (const m of html.matchAll(/<script[^>]*>([\s\S]{200,200000}?)<\/script>/gi)) {
      const corpo = m[1];
      if (/product_id|productId|"skus?"|"product_base"/.test(corpo)) {
        blocos.push(corpo.slice(0, 80_000));
        if (blocos.length >= 3) break;
      }
    }
  }
  return blocos;
}

export function coletarMeta(html: string) {
  const meta: Record<string, string> = {};
  for (const m of html.matchAll(/<meta[^>]+>/gi)) {
    const tag = m[0];
    const chave =
      tag.match(/property=["']([^"']+)["']/i)?.[1] ?? tag.match(/name=["']([^"']+)["']/i)?.[1];
    const valor = tag.match(/content=["']([^"']*)["']/i)?.[1];
    if (chave && valor) meta[chave] = valor;
  }
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1];
  if (canonical) meta.canonical = canonical;
  const titulo = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  if (titulo) meta.title = titulo;
  const lang = html.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1];
  if (lang) meta.lang = lang;
  return meta;
}

const IMAGEM_IRRELEVANTE =
  /(logo|avatar|icon|flag|placeholder|sprite|pixel|banner|qrcode|blank|default_|tiktok_?logo)/i;

export function coletarImagens(
  html: string,
  base: string,
  meta: Record<string, string>,
  extras: string[] = [],
) {
  const urls = new Set<string>();
  const adicionar = (bruto?: string | null) => {
    if (!bruto) return;
    const limpo = bruto.split(" ")[0].trim();
    if (!limpo || limpo.startsWith("data:")) return;
    if (IMAGEM_IRRELEVANTE.test(limpo)) return;
    try {
      const u = new URL(limpo, base);
      if (u.protocol !== "https:") return;
      urls.add(u.toString());
    } catch {
      /* ignora */
    }
  };
  for (const e of extras) adicionar(e);
  for (const m of html.matchAll(
    /"(?:img_url|image|image_url|thumb_url|url_list|main_image)"\s*:\s*"(https:\/\/[^"]+)"/gi,
  )) {
    adicionar(m[1].replace(/\\u002F/gi, "/"));
  }
  for (const m of html.matchAll(/<(?:img|source)[^>]+(?:src|data-src|srcset)=["']([^"']+)["']/gi)) {
    adicionar(m[1]);
  }
  adicionar(meta["og:image"]);
  return [...urls].slice(0, 24);
}

export function htmlParaTexto(html: string) {
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

const SINAIS_BLOQUEIO: Array<[BloqueioDetectado, RegExp]> = [
  ["captcha", /captcha|verify (that )?you are human|verifique que você não é um rob|slide to verify/i],
  ["login_required", /log ?in to continue|faça login para continuar|sign up to continue/i],
  ["access_denied", /access denied|acesso negado|403 forbidden|blocked by/i],
  ["region_not_supported", /not available in your (region|country)|região não suportada|region not supported/i],
  ["unavailable", /product (is )?(unavailable|removed|not found)|produto (indisponível|removido)|page not found|404/i],
];

export function detectarBloqueio(texto: string, html: string): BloqueioDetectado {
  const amostra = `${texto.slice(0, 6000)} ${html.slice(0, 3000)}`;
  for (const [tipo, re] of SINAIS_BLOQUEIO) if (re.test(amostra)) return tipo;
  return null;
}

export function extrairConteudo(leitura: LeituraPagina, productId: string | null): ConteudoExtraido {
  const html = leitura.html;
  const meta = coletarMeta(html);
  const jsonld = coletarJsonLd(html);
  const hidratacao = coletarHidratacao(html);
  const rede = selecionarRespostas(leitura.rede, productId);
  const texto = htmlParaTexto(html);
  const imagens = coletarImagens(
    html,
    leitura.final_url,
    meta,
    rede.flatMap((r) => [...r.corpo.matchAll(/"(https:\/\/[^"]+\.(?:jpe?g|png|webp)[^"]*)"/gi)].map((m) => m[1])),
  );
  const bloqueio = detectarBloqueio(texto, html);

  const bruto = [
    rede.length
      ? `RESPOSTAS DE REDE DO PRODUTO:\n${rede.map((r) => `${r.url}\n${r.corpo.slice(0, 20_000)}`).join("\n---\n")}`
      : "",
    jsonld.length ? `JSON-LD:\n${jsonld.join("\n")}` : "",
    hidratacao.length ? `DADOS DE HIDRATAÇÃO:\n${hidratacao.join("\n").slice(0, 40_000)}` : "",
    Object.keys(meta).length ? `METADADOS:\n${JSON.stringify(meta).slice(0, 6_000)}` : "",
    texto ? `TEXTO RENDERIZADO:\n${texto.slice(0, 24_000)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { rede, jsonld, hidratacao, meta, texto, imagens, bloqueio, bruto };
}
