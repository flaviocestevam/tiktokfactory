import { supabase } from "@/integrations/supabase/client";

export async function listar(tabela: "products" | "characters" | "scenarios" | "projects" | "templates") {
  const { data, error } = await supabase.from(tabela).select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function obterUsuarioId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Sessão expirada. Entre novamente.");
  return data.user.id;
}

export function baixarTexto(nomeArquivo: string, conteudo: string) {
  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatarData(valor?: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}