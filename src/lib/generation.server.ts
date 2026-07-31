import type { SupabaseClient } from "@supabase/supabase-js";
import { callAI, callAIJson } from "./ai.server";
import { AVISO_SEM_PERSONAGEM, PLACEHOLDER_PERSONAGEM } from "./variables";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

export type ProjectContext = {
  project: Record<string, any>;
  product: Record<string, any> | null;
  character: Record<string, any> | null;
  scenario: Record<string, any> | null;
};

export async function loadContext(supabase: Client, projectId: string): Promise<ProjectContext> {
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (error) throw new Error(error.message);
  if (!project) throw new Error("Projeto não encontrado.");

  const [product, character, scenario] = await Promise.all([
    project.product_id
      ? supabase.from("products").select("*").eq("id", project.product_id).maybeSingle().then((r) => r.data)
      : Promise.resolve(null),
    project.character_id
      ? supabase.from("characters").select("*").eq("id", project.character_id).maybeSingle().then((r) => r.data)
      : Promise.resolve(null),
    project.scenario_id
      ? supabase.from("scenarios").select("*").eq("id", project.scenario_id).maybeSingle().then((r) => r.data)
      : Promise.resolve(null),
  ]);

  return { project, product, character, scenario };
}

function bloco(titulo: string, valor: unknown): string {
  if (valor === null || valor === undefined || String(valor).trim() === "") return "";
  return `${titulo}: ${String(valor).trim()}\n`;
}

export function descreverProduto(product: Record<string, any> | null): string {
  if (!product) return "Nenhum produto vinculado ao projeto.";
  return (
    "DADOS DO PRODUTO (única fonte de verdade):\n" +
    bloco("Nome", product.nome) +
    bloco("Marca", product.marca) +
    bloco("Categoria", product.categoria) +
    bloco("Link", product.link) +
    bloco("Descrição", product.descricao) +
    bloco("Benefícios informados", product.beneficios) +
    bloco("Características", product.caracteristicas) +
    bloco("Ingredientes", product.ingredientes) +
    bloco("Modo de uso", product.modo_de_uso) +
    bloco("Público indicado", product.publico) +
    bloco("Preço", product.preco) +
    bloco("Preço promocional", product.preco_promocional) +
    bloco("Variações", product.variacoes) +
    bloco("Tamanho", product.tamanho) +
    bloco("Cores", product.cores) +
    bloco("Informações técnicas", product.informacoes_tecnicas) +
    bloco("Avaliações", product.avaliacoes) +
    bloco("Dúvidas frequentes", product.duvidas_frequentes) +
    bloco("Advertências", product.advertencias) +
    bloco("Restrições", product.restricoes) +
    bloco("Diferenciais", product.diferenciais) +
    bloco("Entrega", product.entrega) +
    bloco("Garantias", product.garantias) +
    bloco("Oferta", product.oferta) +
    bloco("Informações adicionais", product.dados_adicionais)
  );
}

export function descreverPersonagem(character: Record<string, any> | null): string {
  if (!character) {
    return `PERSONAGEM: ainda não definida. Use o marcador ${PLACEHOLDER_PERSONAGEM} onde o nome apareceria.\n${AVISO_SEM_PERSONAGEM}\nNão invente nome, aparência, biografia ou identidade.`;
  }
  return (
    "PERSONAGEM SELECIONADA (respeite integralmente, sem misturar identidades):\n" +
    bloco("Nome", character.nome) +
    bloco("Nome de exibição", character.nome_exibicao) +
    bloco("Nicho", character.nicho) +
    bloco("Idade", character.idade) +
    bloco("Profissão", character.profissao) +
    bloco("Biografia", character.biografia) +
    bloco("Personalidade", character.personalidade) +
    bloco("Arquétipo", character.arquetipo) +
    bloco("Público principal", character.publico_principal) +
    bloco("Tipo de comunicação", character.tipo_comunicacao) +
    bloco("Velocidade da fala", character.velocidade_fala) +
    bloco("Nível de energia", character.nivel_energia) +
    bloco("Estilo de humor", character.estilo_humor) +
    bloco("Vocabulário", character.vocabulario) +
    bloco("Expressões permitidas", character.expressoes_permitidas) +
    bloco("Expressões PROIBIDAS", character.expressoes_proibidas) +
    bloco("Bordões", character.bordoes) +
    bloco("Estilo de venda", character.estilo_venda) +
    bloco("Nível de autoridade", character.nivel_autoridade) +
    bloco("Forma de demonstrar produtos", character.forma_demonstrar) +
    bloco("Tipos de CTA", character.tipos_cta) +
    bloco("Categorias permitidas", character.categorias_permitidas) +
    bloco("Categorias PROIBIDAS", character.categorias_proibidas) +
    bloco("Aparência física", character.aparencia_fisica) +
    bloco("Rosto", character.descricao_rosto) +
    bloco("Olhos", character.descricao_olhos) +
    bloco("Pele", character.descricao_pele) +
    bloco("Cabelo", character.descricao_cabelo) +
    bloco("Corpo", character.descricao_corpo) +
    bloco("Altura", character.altura) +
    bloco("Estilo de roupas", character.estilo_roupas) +
    bloco("Acessórios", character.acessorios) +
    bloco("Maquiagem", character.maquiagem) +
    bloco("Características fixas", character.caracteristicas_fixas) +
    bloco("Características variáveis", character.caracteristicas_variaveis) +
    bloco("Regras de consistência", character.regras_consistencia) +
    bloco("Prompt mestre de identidade", character.prompt_mestre) +
    bloco("Prompt negativo", character.prompt_negativo)
  );
}

export function descreverCenario(ctx: ProjectContext): string {
  const s = ctx.scenario;
  const texto = ctx.project.cenario_texto;
  if (!s && !texto) return "CENÁRIO: não definido pelo usuário. Proponha algo simples e coerente, sinalizando que é sugestão.";
  return (
    "CENÁRIO:\n" +
    bloco("Descrição livre", texto) +
    (s
      ? bloco("Nome", s.nome) +
        bloco("Descrição", s.descricao) +
        bloco("Ambiente", s.ambiente) +
        bloco("Horário", s.horario) +
        bloco("Iluminação", s.iluminacao) +
        bloco("Enquadramento", s.enquadramento) +
        bloco("Estilo", s.estilo) +
        bloco("Pessoas ao fundo", s.pessoas_ao_fundo ? "sim" : "não") +
        bloco("Objetos", s.objetos) +
        bloco("Regras", s.regras)
      : "")
  );
}

export function descreverFormato(project: Record<string, any>): string {
  return (
    "FORMATO DO VÍDEO:\n" +
    bloco("Plataforma", project.plataforma) +
    bloco("Duração em segundos", project.duracao) +
    bloco("Formato", project.formato) +
    bloco("Objetivo principal", project.objetivo) +
    bloco("Estilo do vídeo", project.estilo) +
    bloco("Tom de linguagem", project.tom_linguagem) +
    bloco("Nível de energia", project.nivel_energia) +
    bloco("Velocidade da fala", project.velocidade_fala) +
    bloco("Observações do usuário", project.observacoes)
  );
}

export function contextoCompleto(ctx: ProjectContext): string {
  return [
    descreverProduto(ctx.product),
    descreverPersonagem(ctx.character),
    descreverCenario(ctx),
    descreverFormato(ctx.project),
  ].join("\n\n");
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

/* ─────────────── Gerações ─────────────── */

export function promptEstrategia(ctx: ProjectContext) {
  return {
    system:
      "Você é estrategista de performance para TikTok Shop no Brasil. Analisa produtos com honestidade e propõe ângulos de venda realistas.",
    prompt: `${contextoCompleto(ctx)}\n\nProduza a análise estratégica completa e ao menos 5 ângulos de venda distintos.`,
    shape: `{"resumo":"","problema":"","publico":"","beneficio_principal":"","beneficios_secundarios":[""],"diferenciais":[""],"objecoes":[{"objecao":"","resposta":""}],"riscos":[""],"informacoes_a_confirmar":[""],"situacoes_de_uso":[""],"elementos_visuais":[""],"melhor_demonstracao":"","melhor_cta":"","angulos":[{"nome":"","ideia_central":"","publico":"","emocao":"","gancho":"","demonstracao":"","cta":""}]}`,
  };
}

export function promptRoteiro(ctx: ProjectContext, angulo: unknown, instrucoes?: string) {
  const dur = ctx.project.duracao ?? 30;
  return {
    system:
      "Você é roteirista de vídeos de venda para TikTok Shop no Brasil. Escreve fala natural, conversada, como uma pessoa real falando com a câmera. Nada de locução publicitária, nada de linguagem robótica ou formal demais.",
    prompt: `${contextoCompleto(ctx)}\n\nÂNGULO DE VENDA ESCOLHIDO:\n${JSON.stringify(angulo ?? "não definido")}\n\n${
      instrucoes ? `INSTRUÇÕES EXTRAS DO USUÁRIO: ${instrucoes}\n\n` : ""
    }Crie o roteiro dividido por tempo, cobrindo exatamente ${dur} segundos. Cada cena deve ter início e fim em segundos, e a fala precisa caber no tempo (cerca de 2,5 a 3 palavras por segundo em português falado).`,
    shape: `{"titulo_interno":"","gancho":"","cenas":[{"inicio":0,"fim":3,"fala":"","acao":"","gesto":"","expressao":"","posicao_produto":"","camera":"","enquadramento":"","texto_na_tela":""}],"demonstracao":"","prova_visual":"","quebra_objecao":"","cta":"","legenda":"","hashtags":"","perfil_publico":"","emocao_desejada":""}`,
  };
}

export function promptImagem(ctx: ProjectContext, roteiro: Record<string, any> | null) {
  return {
    system:
      "Você escreve prompts técnicos de geração de imagem em inglês. Falas, textos de tela e informações comerciais permanecem em português do Brasil.",
    prompt: `${contextoCompleto(ctx)}\n\nROTEIRO BASE:\n${JSON.stringify(roteiro ?? {}).slice(0, 6000)}\n\nCrie o prompt em inglês técnico para gerar a FOTO INICIAL da personagem segurando/usando o produto.
Use as variáveis literais {{NOME_DA_PERSONAGEM}}, {{IMAGEM_CANONICA_PRINCIPAL}}, {{IMAGENS_CANONICAS_AUXILIARES}}, {{DESCRICAO_VISUAL_DA_PERSONAGEM}}, {{REGRAS_DE_IDENTIDADE}}, {{PRODUTO}}, {{IMAGEM_DO_PRODUTO}}, {{CENARIO}} sempre que o dado ainda não existir.
O prompt deve exigir: imagem canônica como referência visual principal; exatamente a mesma mulher; rosto, tom de pele, cabelo e proporções corporais inalterados; produto reproduzido corretamente com embalagem, logotipo, formato, cor e proporções preservados; mãos e dedos corretos; interação natural; cenário coerente; iluminação realista; aparência de frame real de TikTok; vertical 9:16; textura natural de pele; sem aparência plástica; sem texto aleatório; sem produtos duplicados; sem deformações.`,
    shape: `{"prompt":"","prompt_negativo":"","enquadramento":"","iluminacao":"","pose":"","maos_produto":"","expressao":"","continuidade":""}`,
  };
}

export function promptVideo(ctx: ProjectContext, roteiro: Record<string, any> | null) {
  return {
    system:
      "Você escreve prompts de vídeo para o Google Flow, partindo de uma foto inicial já criada. Estruture em blocos claros. Diálogos ficam em português do Brasil.",
    prompt: `${contextoCompleto(ctx)}\n\nROTEIRO BASE:\n${JSON.stringify(roteiro ?? {}).slice(0, 6000)}\n\nCrie o prompt do Google Flow partindo da foto inicial. Inclua duração, vertical 9:16, movimentos, gestos, expressão, contato visual, interação com o produto, câmera, estabilidade da embalagem, sincronização labial, ritmo e pausas da fala, ações por trecho, cenário, iluminação, continuidade e CTA.
Nas restrições negativas, proíba: mudança de rosto, mudança de roupa na mesma cena, mudança do produto, deformação das mãos, dedos extras, duplicação do produto, alteração de logotipo, produto desaparecendo, troca de cenário sem instrução, movimentos exagerados, gestos robóticos, expressões artificiais, câmera instável sem necessidade, olhar fora da câmera sem motivo, texto visual não autorizado, outras pessoas falando e mudanças bruscas de iluminação.
Use variáveis literais quando o dado da personagem ainda não existir.`,
    shape: `{"prompt_flow":"","descricao_cena":"","acoes":"","camera":"","dialogo":"","expressao":"","produto":"","continuidade":"","restricoes":""}`,
  };
}

export async function gerarJson<T>(p: { system: string; prompt: string; shape: string }): Promise<T> {
  return callAIJson<T>(p.system, p.prompt, p.shape);
}

export async function gerarTexto(system: string, prompt: string) {
  return callAI(system, prompt);
}