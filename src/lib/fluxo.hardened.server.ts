/* eslint-disable @typescript-eslint/no-explicit-any */
import { callAIJson } from "./ai.server";
import {
  db,
  loadContext,
  registrarHistorico,
  type ProjectContext,
} from "./generation.server";
import { promptClipes } from "./fluxo.server";
import {
  montarClipes,
  planejarRoteiro,
  separarClipe,
  unirComAnterior,
  type ClipePlanejado,
  type Unidade,
} from "./clipes.server";
import * as legado from "./fluxo.persist.server";

const CONTINUIDADE_AVISO =
  "Depois de gerar o clipe anterior no Google Flow, salve o último frame e use-o como primeiro frame do próximo clipe.";

async function obterProjeto(projectId: string) {
  const supabase = await db();
  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error || !data) throw new Error("Produção não encontrada.");
  return { supabase, projeto: data as any };
}

async function obterScript(projectId: string, scriptId: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("scripts")
    .select("*")
    .eq("id", scriptId)
    .eq("project_id", projectId)
    .single();
  if (error || !data) throw new Error("O roteiro não pertence a esta produção.");
  return { supabase, script: data as any };
}

async function obterClipe(projectId: string, clipId: string) {
  const supabase = await db();
  const { data, error } = await supabase
    .from("clips")
    .select("*")
    .eq("id", clipId)
    .eq("project_id", projectId)
    .single();
  if (error || !data) throw new Error("O clipe não pertence a esta produção.");
  return { supabase, clipe: data as any };
}

function garantirFotoAnalisada(projeto: any) {
  if (!projeto.reference_image_url || !projeto.reference_image_path) {
    throw new Error("Envie a foto pronta da produção antes de continuar.");
  }
  if (!projeto.image_confirmed) throw new Error("Confirme a foto da produção antes de continuar.");
  if (projeto.image_analysis_status !== "ok" || !projeto.project_image_analysis) {
    throw new Error("A análise visual da foto precisa ser concluída com sucesso.");
  }
}

async function garantirProdutoValidado(projeto: any) {
  if (!projeto.product_id) throw new Error("Confirme o produto antes de continuar.");
  const supabase = await db();
  const { data: produto, error } = await supabase
    .from("products")
    .select("id, extraction_status, status_extracao")
    .eq("id", projeto.product_id)
    .single();
  if (error || !produto) throw new Error("Produto não encontrado.");
  if (produto.extraction_status !== "success" && produto.status_extracao !== "success") {
    throw new Error("O produto precisa de uma extração automática válida.");
  }
}

function gruposDoScript(script: any): Unidade[][] {
  const plano = script?.plano_clipes;
  return Array.isArray(plano) ? (plano as Unidade[][]).filter((g) => Array.isArray(g)) : [];
}

function validarPlano(clipes: ClipePlanejado[]) {
  if (!clipes.length) throw new Error("O roteiro não possui conteúdo suficiente para gerar clipes.");
  const excedido = clipes.find((c) => c.excede);
  if (excedido) {
    throw new Error(
      `A fala do clipe ${excedido.ordem} ultrapassa a capacidade máxima de 10 segundos. Encurte o roteiro antes de gerar os clipes.`,
    );
  }
}

async function gerarEGravarClipesSeguro(
  supabase: any,
  ctx: ProjectContext,
  script: any,
  roteiro: any,
  clipes: ClipePlanejado[],
  cta: string,
) {
  validarPlano(clipes);
  const prompt = promptClipes(ctx, roteiro, clipes, cta);
  const out = await callAIJson<{ clipes: any[] }>(prompt.system, prompt.prompt, prompt.shape);
  const gerados = Array.isArray(out?.clipes) ? out.clipes : [];
  if (gerados.length < clipes.length) {
    throw new Error("A IA não retornou todos os prompts dos clipes. Nenhum clipe foi substituído.");
  }

  const linhas = clipes.map((c, i) => {
    const g = gerados.find((x: any) => Number(x?.ordem) === c.ordem) ?? gerados[i];
    const promptFlow = String(g?.prompt_flow ?? "").trim();
    if (!promptFlow) {
      throw new Error(`O prompt do clipe ${c.ordem} veio vazio. Nenhum clipe foi substituído.`);
    }
    return {
      project_id: ctx.project.id,
      script_id: script.id,
      ordem: c.ordem,
      duracao: c.duracao,
      fala: c.fala || g?.fala_exata || null,
      acao: g?.acao ?? null,
      gesto: g?.gesto ?? null,
      expressao: g?.expressao ?? null,
      camera: g?.camera ?? null,
      posicao_produto: g?.posicao_produto ?? null,
      estado_inicial:
        c.ordem === 1
          ? (g?.estado_inicial ?? "Foto enviada como primeiro frame.")
          : (g?.estado_inicial ?? null),
      estado_final: g?.estado_final ?? null,
      continuidade:
        c.ordem === 1
          ? (g?.continuidade ?? null)
          : [CONTINUIDADE_AVISO, g?.continuidade].filter(Boolean).join("\n"),
      ligacao_proximo: g?.ligacao_proximo ?? null,
      restricoes: g?.restricoes ?? null,
      prompt_negativo: g?.prompt_negativo ?? null,
      prompt_flow: promptFlow,
      duracao_fala: c.segundosFala,
      duracao_estimada: c.segundos,
      palavras: c.palavras,
      status: "pronto",
    };
  });

  const { data: antigos, error: erroAntigos } = await supabase
    .from("clips")
    .select("id")
    .eq("script_id", script.id)
    .eq("project_id", ctx.project.id);
  if (erroAntigos) throw new Error(erroAntigos.message);

  const { data: salvos, error } = await supabase
    .from("clips")
    .insert(linhas)
    .select()
    .order("ordem");
  if (error) throw new Error(error.message);

  const idsAntigos = (antigos ?? []).map((c: any) => c.id);
  if (idsAntigos.length) {
    const { error: erroDelete } = await supabase.from("clips").delete().in("id", idsAntigos);
    if (erroDelete) {
      const idsNovos = (salvos ?? []).map((c: any) => c.id);
      if (idsNovos.length) await supabase.from("clips").delete().in("id", idsNovos);
      throw new Error("Não foi possível substituir os clipes antigos com segurança.");
    }
  }
  return salvos ?? [];
}

export async function criarTresRoteiros(projectId: string) {
  const { projeto } = await obterProjeto(projectId);
  garantirFotoAnalisada(projeto);
  await garantirProdutoValidado(projeto);
  return legado.criarTresRoteiros(projectId);
}

export async function regerarRoteiro(projectId: string, scriptId: string, instrucao?: string) {
  const { supabase } = await obterScript(projectId, scriptId);
  const salvo = await legado.regerarRoteiro(projectId, scriptId, instrucao);
  await supabase.from("clips").delete().eq("script_id", scriptId).eq("project_id", projectId);
  await supabase
    .from("projects")
    .update({ etapa: 4, status: "roteiros_gerados" } as any)
    .eq("id", projectId);
  return salvo;
}

export async function aprovarRoteiro(projectId: string, scriptId: string) {
  await obterScript(projectId, scriptId);
  return legado.aprovarRoteiro(projectId, scriptId);
}

export async function prepararClipes(projectId: string, scriptId: string) {
  const { supabase, script } = await obterScript(projectId, scriptId);
  if (!script.aprovado) throw new Error("Aprove este roteiro antes de preparar os clipes.");

  const ctx = await loadContext(supabase, projectId);
  garantirFotoAnalisada(ctx.project);
  await garantirProdutoValidado(ctx.project);

  const cta = ctx.project.cta ?? script.cta ?? "";
  const roteiro = { cenas: script.cenas ?? [], cta: script.cta ?? cta };
  const grupos = gruposDoScript(script);
  const planejados = grupos.length
    ? montarClipes(grupos)
    : planejarRoteiro(roteiro, ctx.character, cta).clipes;
  const clipes = await gerarEGravarClipesSeguro(
    supabase,
    ctx,
    script,
    roteiro,
    planejados,
    cta,
  );

  const { error: erroScript } = await supabase
    .from("scripts")
    .update({
      num_clipes: planejados.length,
      plano_clipes: planejados.map((c) => c.unidades) as any,
      clipes_json: clipes as any,
    })
    .eq("id", scriptId)
    .eq("project_id", projectId);
  if (erroScript) throw new Error(erroScript.message);

  await supabase
    .from("projects")
    .update({ etapa: 5, status: "clipes_preparados" } as any)
    .eq("id", projectId);
  await registrarHistorico(supabase, projectId, "clipes", null, {
    scriptId,
    total: clipes.length,
  });
  return clipes;
}

export async function carregarResultados(projectId: string) {
  return legado.carregarResultados(projectId);
}

export async function regerarClipe(projectId: string, clipId: string, instrucao?: string) {
  const { supabase, clipe } = await obterClipe(projectId, clipId);
  const salvo = await legado.regerarClipe(projectId, clipId, instrucao);
  if (!String(salvo?.prompt_flow ?? "").trim()) {
    const { id: _id, created_at: _created, project_id: _project, script_id: _script, ...resto } =
      clipe;
    await supabase.from("clips").update(resto).eq("id", clipId).eq("project_id", projectId);
    throw new Error("A IA retornou um prompt vazio. O clipe anterior foi preservado.");
  }
  return salvo;
}

export async function ajustarClipes(
  projectId: string,
  scriptId: string,
  modo: "redistribuir" | "unir" | "separar",
  ordem?: number,
) {
  const { supabase, script } = await obterScript(projectId, scriptId);
  if (!script.aprovado) throw new Error("Aprove este roteiro antes de reorganizar os clipes.");
  const ctx = await loadContext(supabase, projectId);
  const cta = ctx.project.cta ?? script.cta ?? "";
  const grupos = gruposDoScript(script);

  let novos: ClipePlanejado[];
  if (modo === "redistribuir" || !grupos.length) {
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
  validarPlano(novos);

  const roteiro = { cenas: script.cenas ?? [], cta: script.cta ?? cta };
  const clipes = await gerarEGravarClipesSeguro(supabase, ctx, script, roteiro, novos, cta);
  await supabase
    .from("scripts")
    .update({
      num_clipes: novos.length,
      plano_clipes: novos.map((c) => c.unidades) as any,
      clipes_json: clipes as any,
    })
    .eq("id", scriptId)
    .eq("project_id", projectId);
  await registrarHistorico(supabase, projectId, `clipes:${modo}`, null, {
    scriptId,
    total: novos.length,
  });
  return clipes;
}

export async function editarRoteiroManual(
  projectId: string,
  scriptId: string,
  campos: Record<string, string>,
) {
  const { supabase, script: atual } = await obterScript(projectId, scriptId);
  const ctx = await loadContext(supabase, projectId);
  const roteiroCompleto = String(campos.roteiro_completo ?? atual.roteiro_completo ?? "").trim();
  const dialogo = String(campos.dialogo ?? atual.dialogo ?? "").trim();
  if (!roteiroCompleto || !dialogo) {
    throw new Error("O roteiro e a fala exata não podem ficar vazios.");
  }

  const cenas = [
    {
      ordem: 1,
      fala: dialogo,
      acao: atual.acoes || "Manter a ação coerente com a foto inicial da produção.",
      camera: atual.movimentos_camera || "Manter continuidade de câmera com a foto inicial.",
      texto_na_tela: atual.textos_tela || "",
    },
  ];
  const plano = planejarRoteiro({ cenas, cta: atual.cta }, ctx.character, atual.cta ?? "");
  const payload = {
    roteiro_completo: roteiroCompleto,
    dialogo,
    cenas: cenas as any,
    palavras: plano.palavras,
    duracao_fala: plano.duracaoFala,
    duracao_total: plano.duracaoTotal,
    duracao_estimada: Math.round(plano.duracaoTotal),
    num_clipes: plano.clipes.length,
    plano_clipes: plano.clipes.map((c) => c.unidades) as any,
    clipes_json: null,
    aprovado: false,
    updated_at: new Date().toISOString(),
  };
  const { data: salvo, error } = await supabase
    .from("scripts")
    .update(payload)
    .eq("id", scriptId)
    .eq("project_id", projectId)
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("clips").delete().eq("script_id", scriptId).eq("project_id", projectId);
  await supabase
    .from("projects")
    .update({ etapa: 4, status: "roteiros_gerados" } as any)
    .eq("id", projectId);
  await registrarHistorico(supabase, projectId, "roteiro:edicao_manual", atual, salvo);
  return salvo;
}

export async function editarClipeManual(
  projectId: string,
  clipId: string,
  campos: Record<string, string>,
) {
  await obterClipe(projectId, clipId);
  if (Object.prototype.hasOwnProperty.call(campos, "prompt_flow") && !campos.prompt_flow.trim()) {
    throw new Error("O prompt do Google Flow não pode ficar vazio.");
  }
  return legado.editarClipeManual(projectId, clipId, campos);
}
