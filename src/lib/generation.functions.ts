import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  contextoCompleto,
  extrairPagina,
  gerarJson,
  gerarTexto,
  loadContext,
  promptEstrategia,
  promptImagem,
  promptRoteiro,
  promptVideo,
  registrarHistorico,
} from "./generation.server";

export const extrairProduto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ url: z.string().url("Informe um link válido.") }).parse(i))
  .handler(async ({ data }) => extrairPagina(data.url));

export const gerarEstrategia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await loadContext(supabase, data.projectId);
    const out = await gerarJson<Record<string, unknown>>(promptEstrategia(ctx));

    const { data: anterior } = await supabase
      .from("strategies")
      .select("*")
      .eq("project_id", data.projectId)
      .maybeSingle();

    const payload = {
      user_id: userId,
      project_id: data.projectId,
      analise: out as never,
      publico: (out.publico as string) ?? null,
      problema: (out.problema as string) ?? null,
      beneficios: (out.beneficios_secundarios ?? []) as never,
      objecoes: (out.objecoes ?? []) as never,
      angulos: (out.angulos ?? []) as never,
      angulo_escolhido: anterior?.angulo_escolhido ?? null,
    };

    const query = anterior
      ? supabase.from("strategies").update(payload).eq("id", anterior.id).select().single()
      : supabase.from("strategies").insert(payload).select().single();

    const { data: saved, error } = await query;
    if (error) throw new Error(error.message);
    await registrarHistorico(supabase, userId, data.projectId, "estrategia", anterior, saved);
    return saved;
  });

export const gerarRoteiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        instrucoes: z.string().max(2000).optional(),
        rotulo: z.string().max(120).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await loadContext(supabase, data.projectId);
    const { data: estrategia } = await supabase
      .from("strategies")
      .select("angulo_escolhido")
      .eq("project_id", data.projectId)
      .maybeSingle();

    const out = await gerarJson<Record<string, any>>(
      promptRoteiro(ctx, estrategia?.angulo_escolhido, data.instrucoes),
    );

    const { count } = await supabase
      .from("scripts")
      .select("id", { count: "exact", head: true })
      .eq("project_id", data.projectId);

    const cenas = Array.isArray(out.cenas) ? out.cenas : [];
    const { data: saved, error } = await supabase
      .from("scripts")
      .insert({
        user_id: userId,
        project_id: data.projectId,
        versao: (count ?? 0) + 1,
        rotulo: data.rotulo ?? out.titulo_interno ?? `Versão ${(count ?? 0) + 1}`,
        gancho: out.gancho ?? null,
        roteiro_completo: cenas
          .map(
            (c: any) =>
              `${c.inicio}s–${c.fim}s\nFala: ${c.fala ?? ""}\nAção: ${c.acao ?? ""}\nExpressão: ${c.expressao ?? ""}\nCâmera: ${c.camera ?? ""}\nTexto na tela: ${c.texto_na_tela ?? ""}`,
          )
          .join("\n\n"),
        cenas: cenas as never,
        dialogo: cenas.map((c: any) => c.fala).filter(Boolean).join("\n"),
        acoes: cenas.map((c: any) => c.acao).filter(Boolean).join("\n"),
        movimentos_camera: cenas.map((c: any) => c.camera).filter(Boolean).join("\n"),
        textos_tela: cenas.map((c: any) => c.texto_na_tela).filter(Boolean).join("\n"),
        cta: out.cta ?? null,
        legenda: out.legenda ?? null,
        hashtags: out.hashtags ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    await registrarHistorico(supabase, userId, data.projectId, "roteiro", null, saved);
    return saved;
  });

export const gerarPromptImagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid(), scriptId: z.string().uuid().optional() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await loadContext(supabase, data.projectId);
    const { data: roteiro } = await supabase
      .from("scripts")
      .select("*")
      .eq("project_id", data.projectId)
      .order("versao", { ascending: false })
      .limit(1)
      .maybeSingle();

    const out = await gerarJson<Record<string, string>>(promptImagem(ctx, roteiro));
    const { count } = await supabase
      .from("image_prompts")
      .select("id", { count: "exact", head: true })
      .eq("project_id", data.projectId);

    const { data: saved, error } = await supabase
      .from("image_prompts")
      .insert({
        user_id: userId,
        project_id: data.projectId,
        versao: (count ?? 0) + 1,
        prompt: out.prompt ?? null,
        prompt_negativo: out.prompt_negativo ?? null,
        enquadramento: out.enquadramento ?? null,
        pose: out.pose ?? null,
        iluminacao: out.iluminacao ?? null,
        maos_produto: out.maos_produto ?? null,
        expressao: out.expressao ?? null,
        continuidade: out.continuidade ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await registrarHistorico(supabase, userId, data.projectId, "prompt_imagem", null, saved);
    return saved;
  });

export const gerarPromptVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await loadContext(supabase, data.projectId);
    const { data: roteiro } = await supabase
      .from("scripts")
      .select("*")
      .eq("project_id", data.projectId)
      .order("versao", { ascending: false })
      .limit(1)
      .maybeSingle();

    const out = await gerarJson<Record<string, string>>(promptVideo(ctx, roteiro));
    const { count } = await supabase
      .from("video_prompts")
      .select("id", { count: "exact", head: true })
      .eq("project_id", data.projectId);

    const { data: saved, error } = await supabase
      .from("video_prompts")
      .insert({
        user_id: userId,
        project_id: data.projectId,
        versao: (count ?? 0) + 1,
        prompt_flow: out.prompt_flow ?? null,
        descricao_cena: out.descricao_cena ?? null,
        acoes: out.acoes ?? null,
        camera: out.camera ?? null,
        dialogo: out.dialogo ?? null,
        expressao: out.expressao ?? null,
        produto: out.produto ?? null,
        continuidade: out.continuidade ?? null,
        restricoes: out.restricoes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await registrarHistorico(supabase, userId, data.projectId, "prompt_video", null, saved);
    return saved;
  });

export const sugerirCenarios = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const ctx = await loadContext(context.supabase, data.projectId);
    return gerarJson<{ cenarios: Array<Record<string, string>> }>({
      system: "Você sugere cenários de gravação coerentes para vídeos de venda no TikTok Shop.",
      prompt: `${contextoCompleto(ctx)}\n\nSugira 5 cenários adequados para este produto.`,
      shape: `{"cenarios":[{"nome":"","descricao":"","ambiente":"","horario":"","iluminacao":"","enquadramento":"","estilo":"","objetos":"","por_que_funciona":""}]}`,
    });
  });

export const gerarAlternativas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        tipo: z.enum(["gancho", "cta", "legenda", "hashtags"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const ctx = await loadContext(context.supabase, data.projectId);
    const { data: roteiro } = await context.supabase
      .from("scripts")
      .select("*")
      .eq("project_id", data.projectId)
      .order("versao", { ascending: false })
      .limit(1)
      .maybeSingle();

    return gerarJson<{ opcoes: string[] }>({
      system: "Você cria variações curtas e naturais de conteúdo para TikTok Shop em português do Brasil.",
      prompt: `${contextoCompleto(ctx)}\n\nROTEIRO ATUAL:\n${JSON.stringify(roteiro ?? {}).slice(0, 5000)}\n\nGere 3 alternativas para: ${data.tipo}.`,
      shape: `{"opcoes":["","",""]}`,
    });
  });

export const regenerarParte = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        scriptId: z.string().uuid(),
        campo: z.enum(["gancho", "cta", "legenda", "hashtags", "dialogo"]),
        instrucao: z.string().max(1000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ctx = await loadContext(supabase, data.projectId);
    const { data: roteiro } = await supabase.from("scripts").select("*").eq("id", data.scriptId).single();

    const texto = await gerarTexto(
      "Você reescreve apenas o trecho pedido de um roteiro de TikTok Shop, mantendo todo o resto intacto. Responda somente com o novo texto, sem explicações.",
      `${contextoCompleto(ctx)}\n\nROTEIRO ATUAL:\n${JSON.stringify(roteiro ?? {}).slice(0, 6000)}\n\nReescreva apenas o campo "${data.campo}".${
        data.instrucao ? ` Instrução: ${data.instrucao}` : ""
      }`,
    );

    const { data: saved, error } = await supabase
      .from("scripts")
      .update({ [data.campo]: texto.trim() } as never)
      .eq("id", data.scriptId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await registrarHistorico(supabase, userId, data.projectId, `roteiro:${data.campo}`, roteiro, saved);
    return saved;
  });