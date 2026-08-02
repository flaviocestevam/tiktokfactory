/* eslint-disable @typescript-eslint/no-explicit-any */
// Geração + persistência do fluxo (somente servidor).
import { callAIJson } from "./ai.server";
import { analisarFotoDaProducao } from "./analise-imagem.server";
import { db, loadContext, registrarHistorico, type ProjectContext } from "./generation.server";
import {
  ANGULOS,
  falaDoRoteiro,
  linhasCena,
  promptClipeUnico,
  promptClipes,
  promptFotoInicial,
  promptRoteiroUnico,
  promptTresRoteiros,
  textoRoteiro,
} from "./fluxo.server";
import {
  montarClipes,
  planejarRoteiro,
  separarClipe,
  unirComAnterior,
  type ClipePlanejado,
  type Unidade,
} from "./clipes.server";

const CONTINUIDADE_AVISO =
  "Depois de gerar o clipe anterior no Google Flow, salve o último frame e use-o como primeiro frame do próximo clipe.";

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
    .update({
      image_prompt_used: out.prompt ?? null,
      etapa: Math.max(3, ctx.project.etapa ?? 1),
    } as any)
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
  const fala = falaDoRoteiro(roteiro);
  const angulo = ANGULOS.find((a) => a.variante === variante);
  const plano = planejarRoteiro(roteiro, ctx.character, cta);

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
    duracao_estimada: Math.round(plano.duracaoTotal),
    palavras: plano.palavras,
    duracao_fala: plano.duracaoFala,
    duracao_total: plano.duracaoTotal,
    num_clipes: plano.clipes.length,
    plano_clipes: plano.clipes.map((c) => c.unidades) as any,
    aprovado: false,
  };

  const q = scriptIdExistente
    ? supabase.from("scripts").update(payload).eq("id", scriptIdExistente).select().single()
    : supabase.from("scripts").insert(payload).select().single();
  const { data: script, error } = await q;
  if (error) throw new Error(error.message);

  // Os clipes são preparados só depois da aprovação do roteiro (etapa 5).
  return {
    script,
    clipes: [] as any[],
    plano: resumoPlano(plano.clipes, plano),
    medida: resumoPlano(plano.clipes, plano),
  };
}

function resumoPlano(
  clipes: ClipePlanejado[],
  plano: { duracaoFala: number; duracaoTotal: number; palavras: number },
) {
  return {
    palavras: plano.palavras,
    estimada: plano.duracaoTotal,
    duracao_fala: plano.duracaoFala,
    duracao_total: plano.duracaoTotal,
    duracao_clipes: clipes.reduce((s, c) => s + c.duracao, 0),
    num_clipes: clipes.length,
  };
}

/** Gera os prompts de cada clipe com a IA e grava na tabela clips. */
async function gerarEGravarClipes(
  supabase: any,
  ctx: ProjectContext,
  script: any,
  roteiro: any,
  clipes: ClipePlanejado[],
  cta: string,
) {
  let gerados: any[] = [];
  try {
    const out = await gerar<{ clipes: any[] }>(promptClipes(ctx, roteiro, clipes, cta));
    gerados = Array.isArray(out?.clipes) ? out.clipes : [];
  } catch (e) {
    // Sem os detalhes da IA ainda gravamos o plano de clipes (fala, duração e ordem),
    // para o usuário poder regerar clipe a clipe em vez de perder o roteiro inteiro.
    console.error("Falha ao gerar os prompts dos clipes:", e);
  }

  const linhas = clipes.map((c, i) => {
    const g = gerados.find((x: any) => Number(x?.ordem) === c.ordem) ?? gerados[i] ?? {};
    return {
      project_id: ctx.project.id,
      script_id: script.id,
      ordem: c.ordem,
      duracao: c.duracao,
      fala: c.fala || g.fala_exata || null,
      acao: g.acao ?? null,
      gesto: g.gesto ?? null,
      expressao: g.expressao ?? null,
      camera: g.camera ?? null,
      posicao_produto: g.posicao_produto ?? null,
      estado_inicial:
        c.ordem === 1
          ? (g.estado_inicial ?? "Foto enviada como primeiro frame.")
          : (g.estado_inicial ?? null),
      estado_final: g.estado_final ?? null,
      continuidade:
        c.ordem === 1
          ? (g.continuidade ?? null)
          : [CONTINUIDADE_AVISO, g.continuidade].filter(Boolean).join("\n"),
      ligacao_proximo: g.ligacao_proximo ?? null,
      restricoes: g.restricoes ?? null,
      prompt_negativo: g.prompt_negativo ?? null,
      prompt_flow: g.prompt_flow ?? null,
      duracao_fala: c.segundosFala,
      duracao_estimada: c.segundos,
      palavras: c.palavras,
    };
  });

  // Grava os novos clipes ANTES de apagar os antigos: se a inserção falhar,
  // o roteiro continua com os clipes que já existiam em vez de ficar vazio.
  const { data: antigos } = await supabase.from("clips").select("id").eq("script_id", script.id);
  const { data: salvos, error } = await supabase
    .from("clips")
    .insert(linhas)
    .select()
    .order("ordem");
  if (error) throw new Error(error.message);
  const idsAntigos = (antigos ?? []).map((c: any) => c.id);
  if (idsAntigos.length) await supabase.from("clips").delete().in("id", idsAntigos);
  return salvos ?? [];
}

export async function criarTresRoteiros(projectId: string) {
  const supabase = await db();
  const ctx = await loadContext(supabase, projectId);
  if (!ctx.character) throw new Error("Selecione uma personagem.");
  if (!ctx.product) throw new Error("Confirme o produto.");
  if (!ctx.project.image_confirmed)
    throw new Error("Confirme a foto inicial antes de criar os roteiros.");

  // Garante o estado visual inicial da foto antes de escrever qualquer roteiro.
  if (!ctx.project.project_image_analysis) {
    const analise = await analisarFotoDaProducao(projectId);
    if (analise.ok) ctx.project.project_image_analysis = analise.analise as any;
  }

  const cta = ctx.project.cta ?? "";
  const out = await gerar<{ roteiros: any[] }>(promptTresRoteiros(ctx, cta));
  const roteiros = Array.isArray(out.roteiros) ? out.roteiros.slice(0, 3) : [];
  if (roteiros.length < 3) throw new Error("A IA não retornou os três roteiros. Tente novamente.");

  const { data: existentes } = await supabase
    .from("scripts")
    .select("id, variante")
    .eq("project_id", projectId);

  const resultados = await Promise.all(
    roteiros.map((roteiro, i) => {
      const variante = i + 1;
      const anterior = (existentes ?? []).find((s: any) => s.variante === variante);
      return salvarRoteiro(supabase, ctx, roteiro, variante, cta, anterior?.id);
    }),
  );

  await supabase
    .from("projects")
    .update({ etapa: 4, status: "roteiros_gerados" } as any)
    .eq("id", projectId);
  await registrarHistorico(
    supabase,
    projectId,
    "tres_roteiros",
    null,
    resultados.map((r) => r.script),
  );
  return resultados;
}

export async function regerarRoteiro(projectId: string, scriptId: string, instrucao?: string) {
  const supabase = await db();
  const ctx = await loadContext(supabase, projectId);
  const { data: atual, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .single();
  if (error) throw new Error(error.message);

  const variante = atual.variante ?? atual.versao ?? 1;
  const cta = ctx.project.cta ?? atual.cta ?? "";
  const out = await gerar<any>(promptRoteiroUnico(ctx, cta, variante, instrucao));
  const salvo = await salvarRoteiro(supabase, ctx, out, variante, cta, scriptId);
  await registrarHistorico(supabase, projectId, `roteiro:${variante}`, atual, salvo.script);
  return salvo;
}

/** Marca um roteiro como aprovado (apenas um por produção). */
export async function aprovarRoteiro(projectId: string, scriptId: string) {
  const supabase = await db();
  await supabase
    .from("scripts")
    .update({ aprovado: false } as any)
    .eq("project_id", projectId);
  const { data: script, error } = await supabase
    .from("scripts")
    .update({ aprovado: true } as any)
    .eq("id", scriptId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await supabase
    .from("projects")
    .update({ etapa: 5, status: "roteiro_aprovado" } as any)
    .eq("id", projectId);
  await registrarHistorico(supabase, projectId, "roteiro_aprovado", null, { scriptId });
  return script;
}

/** Etapa 5: divide o roteiro aprovado em clipes de 4/6/8/10s e gera os prompts do Google Flow. */
export async function prepararClipes(projectId: string, scriptId: string) {
  const supabase = await db();
  const ctx = await loadContext(supabase, projectId);
  const { data: script, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .single();
  if (error) throw new Error(error.message);

  const cta = ctx.project.cta ?? script.cta ?? "";
  const roteiro = { cenas: script.cenas ?? [], cta: script.cta ?? cta };
  const grupos = gruposDoScript(script);
  const planejados = grupos.length
    ? montarClipes(grupos)
    : planejarRoteiro(roteiro, ctx.character, cta).clipes;

  const clipes = await gerarEGravarClipes(supabase, ctx, script, roteiro, planejados, cta);
  await supabase
    .from("scripts")
    .update({
      num_clipes: planejados.length,
      plano_clipes: planejados.map((c) => c.unidades) as any,
      clipes_json: clipes as any,
    })
    .eq("id", scriptId);
  await supabase
    .from("projects")
    .update({ etapa: 5, status: "clipes_preparados" } as any)
    .eq("id", projectId);
  await registrarHistorico(supabase, projectId, "clipes", null, { scriptId, total: clipes.length });
  return clipes;
}

export async function carregarResultados(projectId: string) {
  const supabase = await db();
  const [{ data: scripts }, { data: clipes }] = await Promise.all([
    supabase
      .from("scripts")
      .select("*")
      .eq("project_id", projectId)
      .order("variante", { ascending: true }),
    supabase
      .from("clips")
      .select("*")
      .eq("project_id", projectId)
      .order("ordem", { ascending: true }),
  ]);
  return (scripts ?? []).map((s: any) => {
    const meus = (clipes ?? []).filter((c: any) => c.script_id === s.id);
    return {
      script: s,
      clipes: meus,
      medida: {
        palavras: s.palavras ?? 0,
        estimada: s.duracao_total ?? s.duracao_estimada ?? 0,
        duracao_fala: s.duracao_fala ?? 0,
        duracao_total: s.duracao_total ?? s.duracao_estimada ?? 0,
        duracao_clipes: meus.reduce((t: number, c: any) => t + (c.duracao ?? 0), 0),
        num_clipes: meus.length,
      },
    };
  });
}

/* ─────────── Ajustes por clipe ─────────── */

function gruposDoScript(script: any): Unidade[][] {
  const plano = script?.plano_clipes;
  return Array.isArray(plano) ? (plano as Unidade[][]).filter((g) => Array.isArray(g)) : [];
}

async function regravarPlano(
  supabase: any,
  ctx: ProjectContext,
  script: any,
  novos: ClipePlanejado[],
  cta: string,
) {
  await supabase
    .from("scripts")
    .update({
      num_clipes: novos.length,
      plano_clipes: novos.map((c) => c.unidades) as any,
    })
    .eq("id", script.id);
  const roteiro = { cenas: script.cenas ?? [], cta: script.cta ?? cta };
  return gerarEGravarClipes(supabase, ctx, script, roteiro, novos, cta);
}

async function carregarClipe(supabase: any, clipId: string) {
  const { data: clipe, error } = await supabase.from("clips").select("*").eq("id", clipId).single();
  if (error) throw new Error(error.message);
  const { data: script, error: e2 } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", clipe.script_id)
    .single();
  if (e2) throw new Error(e2.message);
  return { clipe, script };
}

/** Regenera (ou encurta) apenas um clipe. */
export async function regerarClipe(projectId: string, clipId: string, instrucao?: string) {
  const supabase = await db();
  const ctx = await loadContext(supabase, projectId);
  const { clipe, script } = await carregarClipe(supabase, clipId);
  const cta = ctx.project.cta ?? script.cta ?? "";
  const { data: irmaos } = await supabase
    .from("clips")
    .select("*")
    .eq("script_id", script.id)
    .order("ordem", { ascending: true });
  const lista = irmaos ?? [];
  const anterior = lista.find((c: any) => c.ordem === clipe.ordem - 1) ?? null;
  const proximo = lista.find((c: any) => c.ordem === clipe.ordem + 1) ?? null;
  const roteiro = { cenas: script.cenas ?? [], cta: script.cta ?? cta };

  const g = await gerar<any>(
    promptClipeUnico(ctx, roteiro, clipe, anterior, proximo, cta, instrucao),
  );
  const payload = {
    fala: g.fala_exata || clipe.fala,
    acao: g.acao ?? clipe.acao,
    gesto: g.gesto ?? clipe.gesto,
    expressao: g.expressao ?? clipe.expressao,
    camera: g.camera ?? clipe.camera,
    posicao_produto: g.posicao_produto ?? clipe.posicao_produto,
    estado_inicial: g.estado_inicial ?? clipe.estado_inicial,
    estado_final: g.estado_final ?? clipe.estado_final,
    continuidade:
      clipe.ordem === 1
        ? (g.continuidade ?? null)
        : [CONTINUIDADE_AVISO, g.continuidade].filter(Boolean).join("\n"),
    ligacao_proximo: g.ligacao_proximo ?? clipe.ligacao_proximo,
    restricoes: g.restricoes ?? clipe.restricoes,
    prompt_negativo: g.prompt_negativo ?? clipe.prompt_negativo,
    prompt_flow: g.prompt_flow ?? clipe.prompt_flow,
    updated_at: new Date().toISOString(),
  };
  const { data: salvo, error } = await supabase
    .from("clips")
    .update(payload)
    .eq("id", clipId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await registrarHistorico(supabase, projectId, `clipe:${clipe.ordem}`, clipe, salvo);
  return salvo;
}

/** Redistribui o roteiro entre os clipes, unindo ou separando conforme o modo. */
export async function ajustarClipes(
  projectId: string,
  scriptId: string,
  modo: "redistribuir" | "unir" | "separar",
  ordem?: number,
) {
  const supabase = await db();
  const ctx = await loadContext(supabase, projectId);
  const { data: script, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .single();
  if (error) throw new Error(error.message);
  const cta = ctx.project.cta ?? script.cta ?? "";

  let novos: ClipePlanejado[];
  if (modo === "redistribuir") {
    novos = planejarRoteiro(
      { cenas: script.cenas ?? [], cta: script.cta },
      ctx.character,
      cta,
    ).clipes;
  } else {
    const grupos = gruposDoScript(script);
    if (!grupos.length) {
      novos = planejarRoteiro(
        { cenas: script.cenas ?? [], cta: script.cta },
        ctx.character,
        cta,
      ).clipes;
    } else if (modo === "unir") {
      novos = unirComAnterior(grupos, ordem ?? 2);
    } else {
      novos = separarClipe(grupos, ordem ?? 1);
    }
    if (!novos.length) novos = montarClipes(grupos);
  }

  const clipes = await regravarPlano(supabase, ctx, script, novos, cta);
  await registrarHistorico(supabase, projectId, `clipes:${modo}`, null, {
    scriptId,
    total: novos.length,
  });
  return clipes;
}

/** Edição manual do texto de um roteiro. */
export async function editarRoteiroManual(
  projectId: string,
  scriptId: string,
  campos: Record<string, string>,
) {
  const supabase = await db();
  const { data: atual } = await supabase.from("scripts").select("*").eq("id", scriptId).single();
  const { data: salvo, error } = await supabase
    .from("scripts")
    .update({ ...campos, updated_at: new Date().toISOString() } as any)
    .eq("id", scriptId)
    .eq("project_id", projectId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await registrarHistorico(supabase, projectId, "roteiro:edicao_manual", atual, salvo);
  return salvo;
}

/** Edição manual dos campos de um clipe. */
export async function editarClipeManual(
  projectId: string,
  clipId: string,
  campos: Record<string, string>,
) {
  const supabase = await db();
  const { data: atual } = await supabase.from("clips").select("*").eq("id", clipId).single();
  const { data: salvo, error } = await supabase
    .from("clips")
    .update({ ...campos, updated_at: new Date().toISOString() } as any)
    .eq("id", clipId)
    .eq("project_id", projectId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await registrarHistorico(supabase, projectId, "clipe:edicao_manual", atual, salvo);
  return salvo;
}
