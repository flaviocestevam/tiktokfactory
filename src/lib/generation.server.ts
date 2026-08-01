import type { SupabaseClient } from "@supabase/supabase-js";
import { callAI, callAIJson } from "./ai.server";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

export type ProjectContext = {
  project: Record<string, any>;
  product: Record<string, any> | null;
  character: Record<string, any> | null;
};

export async function loadContext(supabase: Client, projectId: string): Promise<ProjectContext> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!project) throw new Error("Projeto não encontrado.");

  const [product, character] = await Promise.all([
    project.product_id
      ? supabase
          .from("products")
          .select("*")
          .eq("id", project.product_id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
    project.character_id
      ? supabase
          .from("characters")
          .select("*")
          .eq("id", project.character_id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  return { project, product, character };
}

export async function db(): Promise<Client> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as Client;
}

export async function registrarHistorico(
  supabase: Client,
  projectId: string,
  tipo: string,
  anterior: unknown,
  novo: unknown,
) {
  const { count } = await supabase
    .from("version_history")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("tipo_conteudo", tipo);

  await supabase.from("version_history").insert({
    project_id: projectId,
    tipo_conteudo: tipo,
    versao: (count ?? 0) + 1,
    conteudo_anterior: (anterior ?? null) as any,
    conteudo_novo: (novo ?? null) as any,
  });
}

/* ─────────────── Extração de página de vendas ─────────────── */

export async function extrairPagina(url: string) {
  let html = "";
  let falha: string | null = null;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) falha = `A página respondeu com o código ${res.status}.`;
    else html = await res.text();
  } catch (e) {
    falha = e instanceof Error ? e.message : "Falha de rede ao acessar o link.";
  }

  const texto = htmlParaTexto(html);
  const imagens = extrairImagens(html, url);

  if (falha || texto.length < 200 || /captcha|verifique que você não é um rob/i.test(texto)) {
    return {
      ok: false as const,
      mensagem:
        "Não foi possível ler todas as informações desta página. Complete ou cole os dados manualmente.",
      detalhe: falha,
      dados: {} as Record<string, string>,
      imagens,
    };
  }

  const dados = await callAIJson<Record<string, string>>(
    "Você extrai informações factuais de páginas de venda. Só preencha um campo se ele estiver realmente presente no texto. Nunca invente. Deixe string vazia quando não encontrar.",
    `Extraia os dados desta página de vendas.\nURL: ${url}\n\nCONTEÚDO:\n${texto.slice(0, 24000)}`,
    `{"nome":"","marca":"","categoria":"","descricao":"","beneficios":"","caracteristicas":"","ingredientes":"","modo_de_uso":"","publico":"","preco":"","preco_promocional":"","variacoes":"","tamanho":"","cores":"","informacoes_tecnicas":"","avaliacoes":"","duvidas_frequentes":"","advertencias":"","restricoes":"","diferenciais":"","entrega":"","garantias":"","oferta":""}`,
  );

  const preenchidos = Object.values(dados).filter((v) => String(v ?? "").trim() !== "").length;

  return {
    ok: true as const,
    mensagem:
      preenchidos < 4
        ? "Não foi possível ler todas as informações desta página. Complete ou cole os dados manualmente."
        : "Informações extraídas. Revise e ajuste antes de gerar.",
    detalhe: null,
    dados,
    imagens,
  };
}

function htmlParaTexto(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr|section)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extrairImagens(html: string, base: string): string[] {
  const urls = new Set<string>();
  const re = /<(?:img|source)[^>]+(?:src|data-src|srcset)=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && urls.size < 12) {
    const raw = m[1].split(" ")[0];
    if (!raw || raw.startsWith("data:")) continue;
    try {
      urls.add(new URL(raw, base).toString());
    } catch {
      /* ignora url inválida */
    }
  }
  return [...urls];
}

export async function gerarJson<T>(p: {
  system: string;
  prompt: string;
  shape: string;
}): Promise<T> {
  return callAIJson<T>(p.system, p.prompt, p.shape);
}

export async function gerarTexto(system: string, prompt: string) {
  return callAI(system, prompt);
}
