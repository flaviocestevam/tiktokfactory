/* eslint-disable @typescript-eslint/no-explicit-any */
// Geração + persistência do fluxo (somente servidor).
import { callAIJson } from "./ai.server";
import { db, loadContext, registrarHistorico, type ProjectContext } from "./generation.server";
import {
  ANGULOS,
  avaliarDuracao,
  falaDoRoteiro,
  linhasCena,
  promptFlow,
  promptFotoInicial,
  promptRoteiroUnico,
  promptTresRoteiros,
  textoRoteiro,
} from "./fluxo.server";

async function gerar<T>(p: { system: string; prompt: string; shape: string }) {
  return callAIJson<T>(p.system, p.prompt, p.shape);
}

export async function gerarFotoInicial(projectId: string, ajuste?: string) {
  const supabase = await db();
  const ctx = await loadContext(supabase, projectId);
  if (!ctx.character) throw new Error("Selecione uma personagem antes de gerar o prompt da foto.");
  if (!ctx.product) throw new Error("Confirme o produto antes de gerar o prompt da foto.");

  const out = await gerar<Record<string, string>>(promptFotoInicial(ctx, ajuste));
  const { count } = await supabase
    .from("image_prompts")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { data: saved, error } = await supabase
    .from("image_prompts")
    .insert({
      project_id: projectId,
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

  await supabase
    .from("projects")
    .update({ image_prompt_used: out.prompt ?? null, etapa: Math.max(3, ctx.project.etapa ?? 1) } as any)
    .eq("id", projectId);
  await registrarHistorico(supabase, projectId, "prompt_foto", null, saved);
  return saved;
}

async function salvarRoteiro(
  supabase: any,
  ctx: ProjectContext,
  roteiro: any,
  variante: number,
  cta: string,
  scriptIdExistente?: string,
) {
  const alvo = ctx.project.duracao ?? 30;
  const fala = falaDoRoteiro(roteiro);
  const medida = avaliarDuracao(fala, alvo);
  const angulo = ANGULOS.find((a) => a.variante === variante);

  const payload = {
    project_id: ctx.project.id,
    versao: variante,
    variante,
    rotulo: `Roteiro ${variante}`,
    angulo_nome: roteiro.angulo_nome || angulo?.nome || `Roteiro ${variante}`,
    objetivo: roteiro.objetivo ?? null,
    publico: roteiro.publico ?? null,
    emocao: roteiro.emocao ?? null,
    gancho: roteiro.gancho_falado ?? null,
    gancho_visual: roteiro.gancho_visual ?? null,
    roteiro_completo: textoRoteiro(roteiro),
    cenas: (Array.isArray(roteiro.cenas) ? roteiro.cenas : []) as any,
    dialogo: fala,
    acoes: linhasCena(roteiro, "acao"),
    movimentos_camera: linhasCena(roteiro, "camera"),
    textos_tela: linhasCena(roteiro, "texto_na_tela"),
    cta: roteiro.cta || cta || null,
    legenda: roteiro.legenda ?? null,
    hashtags: roteiro.hashtags ?? null,
    duracao_estimada: medida.estimada,
    palavras: medida.palavras,
  };

  const q = scriptIdExistente
    ? supabase.from("scripts").update(payload).eq("id", scriptIdExistente).select().single()
    : supabase.from("scripts").insert(payload).select().single();
  const { data: script, error } = await q;
  if (error) throw new Error(error.message);

  const flow = await gerar<Record<string, string>>(promptFlow(ctx, roteiro, cta));
  const promptPayload = {
    project_id: ctx.project.id,
    script_id: script.id,
    versao: variante,
    prompt_flow: flow.prompt_flow ?? null,
    descricao_cena: [flow.descricao_geral, flow.cenas].filter(Boolean).join("\n\n") || null,
    acoes: [flow.acoes, flow.gestos].filter(Boolean).join("\n") || null,
    camera: flow.camera ?? null,
    dialogo: flow.fala_exata ?? null,
    expressao: flow.expressoes ?? null,
    produto: flow.produto ?? null,
    continuidade: [flow.continuidade, flow.sincronizacao_labial].filter(Boolean).join("\n") || null,
    restricoes: [flow.restricoes, flow.prompt_negativo].filter(Boolean).join("\n") || null,
  };

  const { data: antigo } = await supabase
    .from("video_prompts")
    .select("id")
    .eq("script_id", script.id)
    .maybeSingle();

  const qp = antigo
    ? supabase.from("video_prompts").update(promptPayload).eq("id", antigo.id).select().single()
    : supabase.from("video_prompts").insert(promptPayload).select().single();
  const { data: videoPrompt, error: erroPrompt } = await qp;
  if (erroPrompt) throw new Error(erroPrompt.message);

  return { script, videoPrompt, medida };
}

export async function criarTresRoteiros(projectId: string) {
  const supabase = await db();
  const ctx = await loadContext(supabase, projectId);
  if (!ctx.character) throw new Error("Selecione uma personagem.");
  if (!ctx.product) throw new Error("Confirme o produto.");
  if (!ctx.project.image_confirmed) throw new Error("Confirme a foto inicial antes de criar os roteiros.");

  const cta = ctx.project.cta ?? "";
  const out = await gerar<{ roteiros: any[] }>(promptTresRoteiros(ctx, cta));
  const roteiros = Array.isArray(out.roteiros) ? out.roteiros.slice(0, 3) : [];
  if (roteiros.length < 3) throw new Error("A IA não retornou os três roteiros. Tente novamente.");

  const { data: existentes } = await supabase.from("scripts").select("id, variante").eq("project_id", projectId);

  const resultados = [];
  for (let i = 0; i < 3; i++) {
    const variante = i + 1;
    const anterior = (existentes ?? []).find((s: any) => s.variante === variante);
    resultados.push(await salvarRoteiro(supabase, ctx, roteiros[i], variante, cta, anterior?.id));
  }

  await supabase.from("projects").update({ etapa: 5, status: "finalizado" } as any).eq("id", projectId);
  await registrarHistorico(supabase, projectId, "tres_roteiros", null, resultados.map((r) => r.script));
  return resultados;
}

export async function regerarRoteiro(projectId: string, scriptId: string, instrucao?: string) {
  const supabase = await db();
  const ctx = await loadContext(supabase, projectId);
  const { data: atual, error } = await supabase.from("scripts").select("*").eq("id", scriptId).single();
  if (error) throw new Error(error.message);

  const variante = atual.variante ?? atual.versao ?? 1;
  const cta = ctx.project.cta ?? atual.cta ?? "";
  const out = await gerar<any>(promptRoteiroUnico(ctx, cta, variante, instrucao));
  const salvo = await salvarRoteiro(supabase, ctx, out, variante, cta, scriptId);
  await registrarHistorico(supabase, projectId, `roteiro:${variante}`, atual, salvo.script);
  return salvo;
}

export async function carregarResultados(projectId: string) {
  const supabase = await db();
  const [{ data: scripts }, { data: prompts }] = await Promise.all([
    supabase.from("scripts").select("*").eq("project_id", projectId).order("variante", { ascending: true }),
    supabase.from("video_prompts").select("*").eq("project_id", projectId),
  ]);
  return (scripts ?? []).map((s: any) => ({
    script: s,
    videoPrompt: (prompts ?? []).find((p: any) => p.script_id === s.id) ?? null,
    medida: avaliarDuracao(s.dialogo ?? "", s.duracao_estimada ? Number(s.duracao_estimada) : 30),
  }));
}