/* eslint-disable @typescript-eslint/no-explicit-any */
// Camada de acesso ao banco do espaço de trabalho interno.
// Roda apenas no servidor: o navegador nunca fala direto com o banco.

export const TABELAS = [
  "products",
  "characters",
  "scenarios",
  "projects",
  "templates",
  "strategies",
  "scripts",
  "image_prompts",
  "video_prompts",
  "version_history",
] as const;

export type Tabela = (typeof TABELAS)[number];

export const BUCKETS = ["produtos", "personagens"] as const;
export type Bucket = (typeof BUCKETS)[number];

const CAMPOS_PROTEGIDOS = ["id", "created_at", "updated_at"];

export function limparValores(valores: Record<string, unknown>) {
  const saida: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(valores)) {
    if (CAMPOS_PROTEGIDOS.includes(chave)) continue;
    saida[chave] = valor;
  }
  return saida;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

export async function listar(
  tabela: Tabela,
  filtros?: Record<string, string>,
  ordem?: { coluna: string; asc?: boolean },
) {
  const db = await admin();
  let q = db.from(tabela).select("*");
  for (const [coluna, valor] of Object.entries(filtros ?? {})) q = q.eq(coluna, valor);
  q = q.order(ordem?.coluna ?? "created_at", { ascending: ordem?.asc ?? false });
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, any>[];
}

export async function obter(tabela: Tabela, id: string) {
  const db = await admin();
  const { data, error } = await db.from(tabela).select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as Record<string, any> | null;
}

export async function contar(tabela: Tabela) {
  const db = await admin();
  const { count, error } = await db.from(tabela).select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function criar(tabela: Tabela, valores: Record<string, unknown>) {
  const db = await admin();
  const { data, error } = await db.from(tabela).insert(limparValores(valores)).select().single();
  if (error) throw new Error(error.message);
  return data as Record<string, any>;
}

export async function atualizar(tabela: Tabela, id: string, valores: Record<string, unknown>) {
  const db = await admin();
  const { data, error } = await db
    .from(tabela)
    .update(limparValores(valores))
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Record<string, any>;
}

export async function excluir(tabela: Tabela, id: string) {
  const db = await admin();
  const { error } = await db.from(tabela).delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

const UM_ANO = 60 * 60 * 24 * 365;

export async function enviarArquivo(bucket: Bucket, nome: string, base64: string, tipo: string) {
  const db = await admin();
  const limpo = nome.replace(/[^\w.-]/g, "_").slice(-80);
  const caminho = `${crypto.randomUUID()}-${limpo}`;
  const binario = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const { error } = await db.storage
    .from(bucket)
    .upload(caminho, binario, { contentType: tipo || "application/octet-stream" });
  if (error) throw new Error(error.message);
  const { data, error: erroUrl } = await db.storage.from(bucket).createSignedUrl(caminho, UM_ANO);
  if (erroUrl) throw new Error(erroUrl.message);
  return { caminho, url: data?.signedUrl ?? "" };
}

export async function removerArquivo(bucket: Bucket, caminho: string) {
  const db = await admin();
  const { error } = await db.storage.from(bucket).remove([caminho]);
  if (error) throw new Error(error.message);
  return { ok: true };
}