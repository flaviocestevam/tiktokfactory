/* eslint-disable @typescript-eslint/no-explicit-any */
// Organiza o conteúdo capturado. A extração determinística funciona mesmo se a IA falhar.
import { callAIJson } from "../ai.server";
import { CAMPOS_PRODUTO, OFERTA_VAZIA, type DadosProduto, type Oferta } from "./types";
import type { ConteudoExtraido } from "./structured-extractor.server";

const SHAPE = `{"produto":{${CAMPOS_PRODUTO.map((c) => `"${c}":""`).join(",")}},"oferta":{"current_price_value":"","current_price_formatted":"","original_price_value":"","original_price_formatted":"","currency_code":"","currency_symbol":"","discount_text":""},"pagina_de_produto":true,"product_id":"","country_code":"","source_language":""}`;

const SISTEMA = `Você organiza dados já capturados de uma página de produto do TikTok Shop, em qualquer idioma.
- Só preencha um campo se a informação estiver realmente presente no conteúdo fornecido.
- Nunca invente, nunca deduza, nunca converta moedas, nunca traduza nesta etapa.
- Preserve o idioma original dos textos e o formato original de preços e moedas.
- Não troque preço atual por preço anterior: o preço atual é o que o comprador paga agora.
- "pagina_de_produto" deve ser false se o conteúdo for categoria, coleção, home, login, captcha ou erro.
- Deixe string vazia quando não encontrar.`;

export type SaidaNormalizada = {
  dados: DadosProduto;
  oferta: Oferta;
  pagina_de_produto: boolean;
  product_id: string | null;
  country_code: string | null;
  source_language: string | null;
};

function texto(valor: unknown): string {
  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number") return String(valor);
  return "";
}

function primeiro<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}

function tipoProduto(obj: any) {
  const tipo = obj?.["@type"];
  return Array.isArray(tipo)
    ? tipo.some((v) => String(v).toLowerCase() === "product")
    : String(tipo ?? "").toLowerCase() === "product";
}

function procurarProdutoJson(valor: any, profundidade = 0): any | null {
  if (!valor || profundidade > 8) return null;
  if (Array.isArray(valor)) {
    for (const item of valor) {
      const achado = procurarProdutoJson(item, profundidade + 1);
      if (achado) return achado;
    }
    return null;
  }
  if (typeof valor !== "object") return null;
  if (tipoProduto(valor)) return valor;
  for (const item of Object.values(valor)) {
    const achado = procurarProdutoJson(item, profundidade + 1);
    if (achado) return achado;
  }
  return null;
}

function lerProdutoJsonLd(blocos: string[]) {
  for (const bloco of blocos) {
    try {
      const parsed = JSON.parse(bloco);
      const produto = procurarProdutoJson(parsed);
      if (produto) return produto;
    } catch {
      // Alguns blocos não são JSON válido; a camada de IA ainda poderá usar o texto bruto.
    }
  }
  return null;
}

function nomeMarca(brand: any) {
  if (typeof brand === "string") return brand.trim();
  return texto(brand?.name);
}

function nomeVendedor(seller: any) {
  if (typeof seller === "string") return seller.trim();
  return texto(seller?.name ?? seller?.legalName);
}

function limparTitulo(titulo: string) {
  return titulo
    .replace(/\s*[|–—-]\s*TikTok Shop.*$/i, "")
    .replace(/^TikTok Shop\s*[|–—-]\s*/i, "")
    .trim();
}

function regexValor(bruto: string, chaves: string[]): string {
  for (const chave of chaves) {
    const re = new RegExp(`"${chave}"\\s*:\\s*"((?:\\\\.|[^"\\\\]){2,2000})"`, "i");
    const match = bruto.match(re)?.[1];
    if (!match) continue;
    try {
      return JSON.parse(`"${match}"`).trim();
    } catch {
      return match.replace(/\\u002F/gi, "/").replace(/\\n/g, " ").trim();
    }
  }
  return "";
}

function moedaSimbolo(codigo: string) {
  const mapa: Record<string, string> = {
    BRL: "R$",
    USD: "$",
    GBP: "£",
    EUR: "€",
    THB: "฿",
    IDR: "Rp",
    JPY: "¥",
    MYR: "RM",
    SGD: "S$",
    PHP: "₱",
    VND: "₫",
    MXN: "$",
  };
  return mapa[codigo.toUpperCase()] ?? "";
}

function extrairDeterministicamente(
  conteudo: ConteudoExtraido,
  contexto: { url: string; product_id: string | null; country_code: string | null },
): SaidaNormalizada {
  const produtoLd = lerProdutoJsonLd(conteudo.jsonld);
  const ofertaLd = primeiro<any>(produtoLd?.offers);
  const rating = produtoLd?.aggregateRating;
  const meta = conteudo.meta;
  const bruto = conteudo.bruto;

  const dados: DadosProduto = {};
  const nome =
    texto(produtoLd?.name) ||
    limparTitulo(texto(meta["og:title"] ?? meta["twitter:title"] ?? meta.title)) ||
    regexValor(bruto, ["product_name", "productName", "product_title", "title"]);
  if (nome) dados.nome = nome;

  const marca = nomeMarca(produtoLd?.brand) || regexValor(bruto, ["brand_name", "brandName"]);
  if (marca) dados.marca = marca;

  const vendedor =
    nomeVendedor(ofertaLd?.seller ?? produtoLd?.seller) ||
    regexValor(bruto, ["shop_name", "seller_name", "sellerName", "merchant_name"]);
  if (vendedor) dados.vendedor = vendedor;

  const descricao =
    texto(produtoLd?.description) ||
    texto(meta["og:description"] ?? meta.description ?? meta["twitter:description"]) ||
    regexValor(bruto, ["product_description", "description"]);
  if (descricao) dados.descricao = descricao;

  const categoria = texto(produtoLd?.category) || regexValor(bruto, ["category_name", "categoryName"]);
  if (categoria) dados.categoria = categoria;

  const sku = texto(produtoLd?.sku ?? produtoLd?.mpn);
  if (sku) dados.informacoes_tecnicas = `SKU: ${sku}`;

  const nota = texto(rating?.ratingValue);
  if (nota) dados.avaliacoes = nota;
  const numeroAvaliacoes = texto(rating?.reviewCount ?? rating?.ratingCount);
  if (numeroAvaliacoes) dados.numero_avaliacoes = numeroAvaliacoes;

  const oferta: Oferta = { ...OFERTA_VAZIA };
  const precoAtual =
    texto(ofertaLd?.price ?? ofertaLd?.lowPrice) ||
    texto(meta["product:price:amount"] ?? meta["og:price:amount"]);
  const moeda =
    texto(ofertaLd?.priceCurrency) ||
    texto(meta["product:price:currency"] ?? meta["og:price:currency"]).toUpperCase();
  if (precoAtual) {
    oferta.current_price_value = precoAtual;
    oferta.current_price_formatted = [moedaSimbolo(moeda), precoAtual].filter(Boolean).join(" ");
    dados.preco = oferta.current_price_formatted || precoAtual;
  }
  if (moeda) {
    oferta.currency_code = moeda;
    oferta.currency_symbol = moedaSimbolo(moeda);
  }

  const temSinalProduto = Boolean(
    produtoLd ||
      (contexto.product_id && bruto.includes(contexto.product_id)) ||
      /"product_id"\s*:|"productId"\s*:|\/pdp\/\d{6,}/i.test(bruto) ||
      (nome && (precoAtual || descricao || vendedor)),
  );

  return {
    dados,
    oferta,
    pagina_de_produto: temSinalProduto,
    product_id: contexto.product_id,
    country_code: contexto.country_code,
    source_language: null,
  };
}

function mesclarDados(base: DadosProduto, adicional: DadosProduto): DadosProduto {
  const saida: DadosProduto = { ...base };
  for (const campo of CAMPOS_PRODUTO) {
    const valor = texto(adicional[campo]);
    if (valor) saida[campo] = valor;
  }
  return saida;
}

export async function normalizarProduto(
  conteudo: ConteudoExtraido,
  contexto: { url: string; product_id: string | null; country_code: string | null },
): Promise<SaidaNormalizada> {
  const deterministico = extrairDeterministicamente(conteudo, contexto);

  let out: any = null;
  try {
    out = await callAIJson<any>(
      SISTEMA,
      `Organize os dados deste produto do TikTok Shop.
URL final: ${contexto.url}
ID esperado do produto: ${contexto.product_id ?? "desconhecido"}
País detectado: ${contexto.country_code ?? "desconhecido"}

CONTEÚDO CAPTURADO:
${conteudo.bruto}`,
      SHAPE,
    );
  } catch (e) {
    console.error(
      "[tiktok] normalização por IA falhou; usando extração determinística:",
      e instanceof Error ? e.message : e,
    );
  }

  const produtoIa: DadosProduto = {};
  for (const campo of CAMPOS_PRODUTO) {
    const valor = texto(out?.produto?.[campo]);
    if (valor && !/^(undefined|null|n\/a|-)$/i.test(valor)) produtoIa[campo] = valor;
  }

  const ofertaIa: Oferta = { ...OFERTA_VAZIA };
  for (const chave of Object.keys(OFERTA_VAZIA) as Array<keyof Oferta>) {
    ofertaIa[chave] = texto(out?.oferta?.[chave]);
  }

  const oferta: Oferta = { ...deterministico.oferta };
  for (const chave of Object.keys(OFERTA_VAZIA) as Array<keyof Oferta>) {
    if (ofertaIa[chave]) oferta[chave] = ofertaIa[chave];
  }

  const dados = mesclarDados(deterministico.dados, produtoIa);
  if (!dados.preco && (oferta.current_price_formatted || oferta.current_price_value)) {
    dados.preco = oferta.current_price_formatted || oferta.current_price_value;
  }

  return {
    dados,
    oferta,
    pagina_de_produto:
      deterministico.pagina_de_produto && (out?.pagina_de_produto !== false || !out),
    product_id: texto(out?.product_id) || deterministico.product_id,
    country_code:
      texto(out?.country_code).toUpperCase().slice(0, 2) || deterministico.country_code,
    source_language: texto(out?.source_language).toLowerCase() || null,
  };
}

const CAMPOS_COMERCIAIS = [
  "preco",
  "descricao",
  "vendedor",
  "marca",
  "caracteristicas",
  "beneficios",
  "variacoes",
] as const;

/** Critério prático: nome + pelo menos um campo comercial real. */
export function validarExtracao(
  dados: DadosProduto,
  oferta: Oferta,
): { ok: boolean; comerciais: number } {
  const comerciais =
    CAMPOS_COMERCIAIS.filter((c) => texto(dados[c]).length > 2).length +
    (oferta.current_price_formatted || oferta.current_price_value ? 1 : 0);
  const ok = Boolean(texto(dados.nome)) && comerciais >= 1;
  return { ok, comerciais };
}
