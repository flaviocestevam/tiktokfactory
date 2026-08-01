/* eslint-disable @typescript-eslint/no-explicit-any */
// Núcleo do fluxo TikTok Factory (somente servidor).
import { descreverPersonagem, descreverProduto, type ProjectContext } from "./generation.server";

export const PALAVRAS_POR_SEGUNDO = 2.7;

export function contarPalavras(texto: string) {
  return texto.split(/\s+/).filter(Boolean).length;
}

export function avaliarDuracao(fala: string, alvo: number) {
  const palavras = contarPalavras(fala);
  const estimada = Math.round((palavras / PALAVRAS_POR_SEGUNDO) * 10) / 10;
  const razao = alvo > 0 ? estimada / alvo : 0;
  const status =
    razao > 1.15 ? "provavelmente longo" : razao > 1 ? "próximo do limite" : razao < 0.6 ? "muito curto" : "adequado";
  return { palavras, estimada, status, palavras_por_segundo: PALAVRAS_POR_SEGUNDO };
}

export function falaDoRoteiro(roteiro: any): string {
  const cenas = Array.isArray(roteiro?.cenas) ? roteiro.cenas : [];
  return cenas.map((c: any) => String(c?.fala ?? "")).filter(Boolean).join(" ");
}

function contextoFluxo(ctx: ProjectContext, cta: string) {
  const p = ctx.project;
  return [
    descreverProduto(ctx.product),
    descreverPersonagem(ctx.character),
    `FORMATO: TikTok Shop, vertical 9:16, português do Brasil. Duração alvo: ${p.duracao ?? 30} segundos.`,
    `CTA ESCOLHIDO PELO USUÁRIO (use exatamente esta intenção no fecho): ${cta || "criar um CTA adequado ao produto"}`,
    p.cenario_texto ? `CENÁRIO: ${p.cenario_texto}` : "",
    p.nivel_energia ? `Nível de energia: ${p.nivel_energia}` : "",
    p.velocidade_fala ? `Velocidade da fala: ${p.velocidade_fala}` : "",
    p.observacoes ? `Observações do usuário: ${p.observacoes}` : "",
    ctx.project.reference_image_url
      ? "Já existe uma foto inicial confirmada da personagem segurando o produto; ela será o primeiro frame do vídeo."
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/* ─────────── Prompt da foto inicial ─────────── */

export function promptFotoInicial(ctx: ProjectContext, ajuste?: string) {
  const imagemProduto = ctx.project.imagem_produto_referencia || ctx.product?.imagem_principal || "";
  return {
    system:
      "Você escreve prompts técnicos de geração de imagem em inglês, para o GPT criar uma foto realista de influenciadora segurando um produto. Nomes próprios e textos de embalagem permanecem como estão.",
    prompt: `${descreverProduto(ctx.product)}\n\n${descreverPersonagem(ctx.character)}\n\n${
      imagemProduto ? `IMAGEM PRINCIPAL DO PRODUTO (referência visual obrigatória): ${imagemProduto}\n` : ""
    }${ctx.project.cenario_texto ? `CENÁRIO PEDIDO: ${ctx.project.cenario_texto}\n` : ""}${
      ajuste ? `AJUSTE PEDIDO PELO USUÁRIO: ${ajuste}\n` : ""
    }
Crie o prompt em inglês para gerar UMA única foto vertical 9:16 da personagem segurando exatamente este produto.
O prompt deve exigir: manter a identidade da personagem (rosto, olhos, pele, cabelo, corpo inalterados); usar as fotos canônicas como referência; reproduzir o produto exatamente como na imagem de referência (embalagem, rótulo, cores, proporção e tamanho reais); não redesenhar o rótulo; não inventar textos; não duplicar o produto; mãos e dedos anatomicamente corretos; produto totalmente visível com o rótulo voltado para a câmera quando fizer sentido; cenário coerente; iluminação realista; enquadramento vertical 9:16; aparência de conteúdo real de TikTok; pele ultrarrealista com poros e textura natural; sem filtro de beleza; sem aparência artificial ou plástica; sem grid, colagem ou múltiplas imagens.`,
    shape: `{"prompt":"","prompt_negativo":"","enquadramento":"","iluminacao":"","pose":"","maos_produto":"","expressao":"","continuidade":""}`,
  };
}

/* ─────────── Três roteiros ─────────── */

export const ANGULOS = [
  {
    variante: 1,
    nome: "Problema e solução",
    estrutura:
      "1) identificar um problema real do público; 2) mostrar o produto; 3) demonstrar como usar; 4) explicar apenas benefícios confirmados nos dados; 5) responder uma objeção; 6) fechar com o CTA escolhido.",
  },
  {
    variante: 2,
    nome: "Descoberta e recomendação",
    estrutura:
      "1) começar com descoberta ou reação genuína; 2) soar como recomendação natural entre amigas; 3) mostrar o produto; 4) explicar por que chamou atenção; 5) demonstrar o uso; 6) fechar com o CTA escolhido. PROIBIDO afirmar que usou por dias, comprou, recebeu resultados ou viveu qualquer experiência pessoal.",
  },
  {
    variante: 3,
    nome: "Demonstração e oferta",
    estrutura:
      "1) mostrar o produto imediatamente; 2) criar gancho visual forte; 3) demonstrar a utilização; 4) destacar diferenciais confirmados; 5) mostrar praticidade ou situação de uso; 6) fechar com o CTA escolhido. PROIBIDO criar falsa urgência.",
  },
] as const;

const SHAPE_ROTEIRO = `{"angulo_nome":"","objetivo":"","publico":"","emocao":"","gancho_falado":"","gancho_visual":"","cenas":[{"inicio":0,"fim":3,"fala":"","acao":"","movimento_corpo":"","movimento_maos":"","expressao":"","posicao_produto":"","direcao_olhar":"","camera":"","texto_na_tela":""}],"demonstracao":"","cta":"","legenda":"","hashtags":""}`;

export function promptTresRoteiros(ctx: ProjectContext, cta: string) {
  const dur = ctx.project.duracao ?? 30;
  return {
    system:
      "Você é roteirista brasileira de vídeos de venda para TikTok Shop. Escreve fala falada, natural e curta, como uma criadora real conversando com a câmera. Nada de locução publicitária, formalidade, palavras difíceis, frases longas ou texto robótico.",
    prompt: `${contextoFluxo(ctx, cta)}

Crie TRÊS roteiros REALMENTE diferentes entre si — gancho diferente, ângulo de venda diferente, estrutura diferente, demonstração diferente, emoção diferente e forma diferente de apresentar o produto. Nada de versões quase iguais.

${ANGULOS.map((a) => `ROTEIRO ${a.variante} — ${a.nome}\nEstrutura obrigatória: ${a.estrutura}`).join("\n\n")}

Cada roteiro deve caber em ${dur} segundos: aproximadamente ${Math.round(dur * PALAVRAS_POR_SEGUNDO)} palavras de fala no total, com cenas cronometradas somando exatamente ${dur} segundos.
Hashtags: no máximo 6, específicas do produto e do nicho.
A fala deve obedecer integralmente à biografia e ao estilo de comunicação da personagem.
Nunca escreva na fala pública qualquer aviso sobre dados faltantes: simplesmente não mencione o que não foi confirmado.`,
    shape: `{"roteiros":[${SHAPE_ROTEIRO},${SHAPE_ROTEIRO},${SHAPE_ROTEIRO}]}`,
  };
}

export function promptRoteiroUnico(ctx: ProjectContext, cta: string, variante: number, instrucao?: string) {
  const dur = ctx.project.duracao ?? 30;
  const angulo = ANGULOS.find((a) => a.variante === variante) ?? ANGULOS[0];
  return {
    system:
      "Você é roteirista brasileira de vídeos de venda para TikTok Shop. Escreve fala falada, natural e curta, como uma criadora real conversando com a câmera.",
    prompt: `${contextoFluxo(ctx, cta)}

Crie UM roteiro no ângulo "${angulo.nome}".
Estrutura obrigatória: ${angulo.estrutura}
Duração alvo: ${dur} segundos (~${Math.round(dur * PALAVRAS_POR_SEGUNDO)} palavras de fala).
${instrucao ? `AJUSTE PEDIDO: ${instrucao}` : ""}`,
    shape: SHAPE_ROTEIRO,
  };
}

/* ─────────── Prompt do Google Flow ─────────── */

export function promptFlow(ctx: ProjectContext, roteiro: any, cta: string) {
  const dur = ctx.project.duracao ?? 30;
  return {
    system:
      "Você escreve prompts de vídeo para o Google Flow partindo de uma foto inicial já existente. Estruture em blocos claros. As falas ficam em português do Brasil; o restante em inglês técnico.",
    prompt: `${contextoFluxo(ctx, cta)}

ROTEIRO BASE (use a fala exatamente como está):
${JSON.stringify(roteiro).slice(0, 8000)}

Crie o prompt do Google Flow para animar a foto enviada como PRIMEIRO FRAME, com ${dur} segundos, vertical 9:16.
O prompt deve instruir explicitamente: usar a imagem enviada como primeiro frame; preservar a mesma personagem, o rosto exato, pele, olhos, cabelo, corpo, roupa, cenário e iluminação; preservar o produto com embalagem, cores e proporções; não redesenhar o rótulo; não inventar textos; não duplicar o produto; não fazer o produto desaparecer; mãos naturais e dedos corretos; contato visual com a câmera quando necessário; sincronização labial com a fala; movimentos naturais e contidos; sem deformações; sem adicionar pessoas ou objetos; sem mudar o enquadramento sem instrução; sem cortes impossíveis.`,
    shape: `{"prompt_flow":"","descricao_geral":"","duracao":"","imagem_inicial":"","fala_exata":"","cenas":"","acoes":"","gestos":"","expressoes":"","camera":"","produto":"","continuidade":"","sincronizacao_labial":"","prompt_negativo":"","restricoes":""}`,
  };
}

export function textoRoteiro(roteiro: any) {
  const cenas = Array.isArray(roteiro?.cenas) ? roteiro.cenas : [];
  return cenas
    .map(
      (c: any) =>
        `${c.inicio}s–${c.fim}s\nFala: ${c.fala ?? ""}\nAção: ${c.acao ?? ""}\nCorpo: ${c.movimento_corpo ?? ""}\nMãos: ${c.movimento_maos ?? ""}\nExpressão: ${c.expressao ?? ""}\nProduto: ${c.posicao_produto ?? ""}\nOlhar: ${c.direcao_olhar ?? ""}\nCâmera: ${c.camera ?? ""}\nTexto na tela: ${c.texto_na_tela ?? ""}`,
    )
    .join("\n\n");
}

export function linhasCena(roteiro: any, campo: string) {
  const cenas = Array.isArray(roteiro?.cenas) ? roteiro.cenas : [];
  return cenas.map((c: any) => c?.[campo]).filter(Boolean).join("\n");
}