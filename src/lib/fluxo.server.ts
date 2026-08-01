/* eslint-disable @typescript-eslint/no-explicit-any */
// Núcleo do fluxo TikTok Factory (somente servidor).
import {
  descreverPersonagem,
  descreverPersonagemParaRoteiro,
  descreverProduto,
  REGRAS_FOTO_UNICA_FONTE,
  type ProjectContext,
} from "./generation.server";

export { contarPalavras } from "./clipes.server";

export function falaDoRoteiro(roteiro: any): string {
  const cenas = Array.isArray(roteiro?.cenas) ? roteiro.cenas : [];
  return cenas
    .map((c: any) => String(c?.fala ?? ""))
    .filter(Boolean)
    .join(" ");
}

function contextoFluxo(ctx: ProjectContext, cta: string) {
  const p = ctx.project;
  return [
    descreverProduto(ctx.product),
    descreverPersonagemParaRoteiro(ctx.character),
    "FORMATO: TikTok Shop, vertical 9:16, português do Brasil. NÃO existe duração alvo: escreva o que for necessário para vender bem. O sistema calcula a duração depois e divide o vídeo em clipes.",
    `CTA ESCOLHIDO PELO USUÁRIO (use exatamente esta intenção no fecho): ${cta || "criar um CTA adequado ao produto"}`,
    REGRAS_FOTO_UNICA_FONTE,
    p.nivel_energia ? `Nível de energia: ${p.nivel_energia}` : "",
    p.velocidade_fala ? `Velocidade da fala: ${p.velocidade_fala}` : "",
    p.observacoes ? `Observações do usuário: ${p.observacoes}` : "",
    p.reference_image_url
      ? "A foto enviada neste projeto é a única fonte visual do vídeo e o primeiro frame. Não existe nenhuma outra referência de imagem."
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/* ─────────── Prompt da foto inicial ─────────── */

export function promptFotoInicial(ctx: ProjectContext, ajuste?: string) {
  const imagemProduto =
    ctx.project.imagem_produto_referencia || ctx.product?.imagem_principal || "";
  return {
    system:
      "Você escreve prompts técnicos de geração de imagem em inglês, para o GPT criar uma foto realista de influenciadora segurando um produto. Nomes próprios e textos de embalagem permanecem como estão.",
    prompt: `${descreverProduto(ctx.product)}\n\n${descreverPersonagem(ctx.character)}\n\n${
      imagemProduto
        ? `IMAGEM PRINCIPAL DO PRODUTO (referência visual obrigatória): ${imagemProduto}\n`
        : ""
    }${ajuste ? `AJUSTE PEDIDO PELO USUÁRIO: ${ajuste}\n` : ""}
Crie o prompt em inglês para gerar UMA única foto vertical 9:16 da personagem segurando exatamente este produto.
O prompt deve exigir: seguir exatamente a descrição textual cadastrada da personagem (rosto, olhos, pele, cabelo, corpo conforme o texto); reproduzir o produto exatamente como na imagem de referência (embalagem, rótulo, cores, proporção e tamanho reais); não redesenhar o rótulo; não inventar textos; não duplicar o produto; mãos e dedos anatomicamente corretos; produto totalmente visível com o rótulo voltado para a câmera quando fizer sentido; iluminação realista; enquadramento vertical 9:16; aparência de conteúdo real de TikTok; pele ultrarrealista com poros e textura natural; sem filtro de beleza; sem aparência artificial ou plástica; sem grid, colagem ou múltiplas imagens.`,
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
  return {
    system:
      "Você é roteirista brasileira de vídeos de venda para TikTok Shop. Escreve fala falada, natural e curta, como uma criadora real conversando com a câmera. Nada de locução publicitária, formalidade, palavras difíceis, frases longas ou texto robótico.",
    prompt: `${contextoFluxo(ctx, cta)}

Crie TRÊS roteiros REALMENTE diferentes entre si — gancho diferente, ângulo de venda diferente, estrutura diferente, demonstração diferente, emoção diferente e forma diferente de apresentar o produto. Nada de versões quase iguais.

${ANGULOS.map((a) => `ROTEIRO ${a.variante} — ${a.nome}\nEstrutura obrigatória: ${a.estrutura}`).join("\n\n")}

Não existe limite de duração. Escreva o roteiro completo necessário para apresentar, demonstrar e vender o produto, com começo, demonstração e fecho. Divida em cenas curtas e naturais (cada cena com uma ideia). Os campos "inicio" e "fim" são apenas uma referência aproximada em segundos.
Hashtags: no máximo 6, específicas do produto e do nicho.
A fala deve obedecer integralmente à biografia e ao estilo de comunicação da personagem.
Nunca escreva na fala pública qualquer aviso sobre dados faltantes: simplesmente não mencione o que não foi confirmado.`,
    shape: `{"roteiros":[${SHAPE_ROTEIRO},${SHAPE_ROTEIRO},${SHAPE_ROTEIRO}]}`,
  };
}

export function promptRoteiroUnico(
  ctx: ProjectContext,
  cta: string,
  variante: number,
  instrucao?: string,
) {
  const angulo = ANGULOS.find((a) => a.variante === variante) ?? ANGULOS[0];
  return {
    system:
      "Você é roteirista brasileira de vídeos de venda para TikTok Shop. Escreve fala falada, natural e curta, como uma criadora real conversando com a câmera.",
    prompt: `${contextoFluxo(ctx, cta)}

Crie UM roteiro no ângulo "${angulo.nome}".
Estrutura obrigatória: ${angulo.estrutura}
Sem limite de duração: escreva o necessário, em cenas curtas e naturais.
${instrucao ? `AJUSTE PEDIDO: ${instrucao}` : ""}`,
    shape: SHAPE_ROTEIRO,
  };
}

/* ─────────── Prompts por clipe (Google Flow / Gemini Omni Flash) ─────────── */

const REGRAS_CONTINUIDADE = `A foto enviada é a ÚNICA fonte visual do vídeo e o primeiro frame do clipe 1. Cada prompt deve preservar exatamente o conteúdo visual dessa foto: o mesmo fundo, a mesma iluminação, a mesma roupa, o mesmo enquadramento, a mesma posição inicial, a mesma personagem, o mesmo produto, a mesma embalagem e os mesmos objetos já presentes na imagem.
Não descreva um novo local, não troque o fundo, não mova a personagem para outro espaço, não adicione, remova, substitua ou invente elementos visuais.
Nos clipes seguintes, mantenha a continuidade visual usando o ÚLTIMO FRAME do clipe anterior como PRIMEIRO FRAME do próximo, descrevendo isso explicitamente.
A foto enviada neste projeto é a única fonte visual do vídeo. Use essa imagem como primeiro frame e preserve exatamente a pessoa, o produto e todos os elementos já presentes nela.
Rosto, cabelo, roupa e produto devem permanecer exatamente como aparecem na foto do projeto. Não reconstrua a pessoa a partir de descrição textual, não compare com nenhuma outra imagem e não misture referências diferentes.
Nos clipes seguintes, use o último frame do clipe anterior como primeiro frame e preserve a continuidade do próprio vídeo.
Proibido: redesenhar o rótulo, inventar textos, duplicar ou sumir com o produto, deformar mãos e dedos, trocar roupa, fundo ou enquadramento, adicionar pessoas ou objetos.`;

const SHAPE_CLIPE = `{"ordem":1,"estado_inicial":"","fala_exata":"","acao":"","gesto":"","expressao":"","posicao_produto":"","camera":"","estado_final":"","ligacao_proximo":"","continuidade":"","restricoes":"","prompt_negativo":"","prompt_flow":""}`;

function listaClipes(clipes: any[]) {
  return clipes
    .map(
      (c: any) =>
        `CLIPE ${c.ordem} — ${c.duracao} segundos\nFala exata (não altere uma palavra): ${c.fala || "(sem fala, só ação)"}\nAções e cenas de referência: ${JSON.stringify(
          c.unidades?.map((u: any) => u.cena) ?? [],
        ).slice(0, 1500)}`,
    )
    .join("\n\n");
}

export function promptClipes(ctx: ProjectContext, roteiro: any, clipes: any[], cta: string) {
  return {
    system:
      "Você escreve prompts de vídeo para o Google Flow (Gemini Omni Flash), clipe a clipe, partindo de uma foto inicial já existente. As falas ficam em português do Brasil; o restante em inglês técnico. Estruture em blocos claros.",
    prompt: `${contextoFluxo(ctx, cta)}

O vídeo será produzido em ${clipes.length} clipes individuais e depois unido no Scenebuilder.
O CLIPE 1 usa a foto já enviada como primeiro frame. Cada clipe seguinte usa o ÚLTIMO FRAME do clipe anterior como primeiro frame — descreva isso explicitamente no prompt.

${REGRAS_CONTINUIDADE}

ROTEIRO BASE:
${JSON.stringify(roteiro).slice(0, 6000)}

PLANO DE CLIPES (respeite a divisão e a fala exata de cada clipe):
${listaClipes(clipes)}

Para CADA clipe devolva: estado inicial, fala exata, ação, gesto, expressão, posição do produto, câmera, estado final, ligação com o próximo clipe, continuidade, restrições, prompt negativo e o prompt final pronto para colar no Google Flow (campo prompt_flow, completo e autossuficiente, incluindo a duração do clipe e o formato vertical 9:16).`,
    shape: `{"clipes":[${SHAPE_CLIPE}]}`,
  };
}

export function promptClipeUnico(
  ctx: ProjectContext,
  roteiro: any,
  clipe: any,
  anterior: any,
  proximo: any,
  cta: string,
  instrucao?: string,
) {
  return {
    system:
      "Você escreve prompts de vídeo para o Google Flow (Gemini Omni Flash) para UM clipe específico dentro de uma sequência. As falas ficam em português do Brasil; o restante em inglês técnico.",
    prompt: `${contextoFluxo(ctx, cta)}

${REGRAS_CONTINUIDADE}

ROTEIRO BASE:
${JSON.stringify(roteiro).slice(0, 4000)}

${anterior ? `CLIPE ANTERIOR (${anterior.ordem}) terminou assim: ${anterior.estado_final ?? ""}\nFala anterior: ${anterior.fala ?? ""}` : "Este é o PRIMEIRO clipe: usa a foto enviada como primeiro frame."}
${proximo ? `PRÓXIMO CLIPE começa com a fala: ${proximo.fala ?? ""}` : "Este é o ÚLTIMO clipe: fecha com o CTA."}

CLIPE ${clipe.ordem} — ${clipe.duracao} segundos
Fala: ${clipe.fala || "(sem fala, só ação)"}
${instrucao ? `AJUSTE PEDIDO PELO USUÁRIO: ${instrucao}` : ""}

Devolva o clipe completo, com o prompt final pronto para colar no Google Flow.`,
    shape: SHAPE_CLIPE,
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
  return cenas
    .map((c: any) => c?.[campo])
    .filter(Boolean)
    .join("\n");
}
