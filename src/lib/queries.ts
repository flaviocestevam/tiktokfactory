import type { Tables } from "@/integrations/supabase/types";
import {
  atualizarRegistro,
  contarRegistros,
  criarRegistro,
  enviarImagem,
  excluirRegistro,
  listarRegistros,
  obterRegistro,
} from "./dados.functions";

type Tabela =
  | "products"
  | "characters"
  | "projects"
  | "templates"
  | "strategies"
  | "scripts"
  | "image_prompts"
  | "video_prompts"
  | "version_history";

export async function listar<T extends Tabela>(
  tabela: T,
  filtros?: Record<string, string>,
  ordem?: { coluna: string; asc?: boolean },
): Promise<Tables<T>[]> {
  const dados = await listarRegistros({ data: { tabela, filtros, ordem } });
  return dados as unknown as Tables<T>[];
}

export async function obter<T extends Tabela>(tabela: T, id: string): Promise<Tables<T> | null> {
  const dado = await obterRegistro({ data: { tabela, id } });
  return (dado ?? null) as unknown as Tables<T> | null;
}

export async function contar(tabela: Tabela): Promise<number> {
  return contarRegistros({ data: { tabela } });
}

export async function criar<T extends Tabela>(
  tabela: T,
  valores: Record<string, unknown>,
): Promise<Tables<T>> {
  const dado = await criarRegistro({ data: { tabela, valores } });
  return dado as unknown as Tables<T>;
}

export async function atualizar<T extends Tabela>(
  tabela: T,
  id: string,
  valores: Record<string, unknown>,
): Promise<Tables<T>> {
  const dado = await atualizarRegistro({ data: { tabela, id, valores } });
  return dado as unknown as Tables<T>;
}

export async function excluir(tabela: Tabela, id: string) {
  await excluirRegistro({ data: { tabela, id } });
}

export async function enviarArquivo(bucket: "produtos" | "personagens", arquivo: File) {
  const base64 = await arquivoParaBase64(arquivo);
  const res = await enviarImagem({
    data: { bucket, nome: arquivo.name, tipo: arquivo.type || "image/jpeg", base64 },
  });
  return res.url;
}

function arquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.onload = () => {
      const resultado = String(leitor.result);
      resolve(resultado.slice(resultado.indexOf(",") + 1));
    };
    leitor.readAsDataURL(arquivo);
  });
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