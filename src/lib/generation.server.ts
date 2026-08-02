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
