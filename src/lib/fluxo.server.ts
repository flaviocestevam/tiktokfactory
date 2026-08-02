/* eslint-disable @typescript-eslint/no-explicit-any */
// Núcleo do fluxo TikTok Factory (somente servidor).
import {
  descreverIdentidadeFixaParaFoto,
  descreverProdutoParaFoto,
  descreverFotoDoProjeto,
  descreverPersonagemParaRoteiro,
  descreverPreferencias,
  descreverProdutoParaRoteiro,
  REGRAS_COMERCIAIS,
} from "./contextos.server";
import type { ProjectContext } from "./generation.server";

export { contarPalavras } from "./clipes.server";

export function falaDoRoteiro(roteiro: any): string {
  const cenas = Array.isArray(roteiro?.cenas) ? roteiro.cenas : [];
  return cenas
    .map((c: any) => String(c?.fala ?? ""))
    .filter(Boolean)
    .join(" ");
}

/** Contexto único usado por todas as gerações do fluxo. */
function contextoFluxo(ctx: ProjectContext, cta: string) {
  return [
    descreverProdutoParaRoteiro(ctx.product),
    descreverPersonagemParaRoteiro(ctx.character),
    descreverFotoDoProjeto(ctx.project),
    REGRAS_COMERCIAIS,
    "Não existe duração alvo: escreva o que for necessário para vender bem. O sistema calcula a duração depois e divide o vídeo em clipes.",
    `CTA ESCOLHIDO PELO USUÁRIO (use exatamente esta intenção no fecho): ${cta || "criar um CTA adequado ao produto"}`,
    descreverPreferencias(ctx.project),
  ]
    .filter(Boolean)
    .join("\n\n");
}

const REGRA_PRODUTO_UNIVERSAL = `REGRA UNIVERSAL DE PRODUTO:
O produto pode ser de qualquer categoria e não precisa ser um objeto segurado. Ele pode estar vestido, aplicado, sendo usado, testado, montado, instalado, apoiado, movimentado ou demonstrado de outra maneira coerente. Roupas, maquiagem, perfumes, brinquedos e utensílios de cozinha são apenas exemplos e NÃO formam uma lista limitada. Determine a forma correta de interação pela categoria, pelo modo de uso, pelas instruções da produção e pelo que aparece na foto. Nunca force embalagem, rótulo, tampa, mão livre ou posição na mão quando isso não fizer sentido.`;

/* ─────────── Prompt da foto inicial ─────────── */

export function promptFotoInicial(ctx: ProjectContext, ajuste?: string) {
  return {
    system:
      "Você escreve prompts técnicos de geração de imagem em inglês para um modelo multimodal que recebe DUAS imagens de referência: (1) imagem principal da personagem, usada só para identidade física; (2) imagem do produto, usada só para a aparência exata do produto. O produto pode ser de qualquer categoria e não deve ser presumido como um objeto segurado. Nunca descreva roupa, acessórios, maquiagem, local, fundo, iluminação ou enquadramento específicos vindos de cadastro.",
    prompt: `${descreverProdutoParaFoto(ctx.product)}\n\n${descreverIdentidadeFixaParaFoto(ctx.character)}\n\n${REGRA_PRODUTO_UNIVERSAL}\n\n${ajuste ? `INSTRUÇÃO ESPECÍFICA DESTA PRODUÇÃO (só isto pode definir roupa, ambiente, pose, expressão ou iluminação): ${ajuste}\n\n` : "NENHUMA instrução específica desta produção: não defina roupa, ambiente, pose, expressão nem iluminação.\n\n"}
Escreva o prompt final em inglês, em texto corrido, seguindo exatamente esta lógica e ordem:

1) "Create one single photorealistic vertical 9:16 TikTok-style image."
2) "Use the provided main character image as the sole identity reference. Create exactly the same woman, preserving her facial identity, face shape, eyes, nose, lips, eyebrows, skin tone, natural skin texture, hair identity, body proportions and unique permanent traits."
3) "Identity fidelity does not mean copying the clothing, accessories, makeup, pose, expression, gesture, hand position, objects, background, location, decoration, lighting or framing from the character reference image. These elements may naturally vary in this new production and must not be predefined unless explicitly requested."
4) "Use the provided product image as the sole product appearance reference. Reproduce exactly the same advertised product, preserving every visible category-appropriate detail, including its material, cut, texture, pattern, shape, colors, components, proportions, branding, packaging and label only when those elements actually exist and are visible in the reference."
5) "Present or demonstrate the product in the natural way appropriate to its category and intended use. The product may be worn, applied, held, operated, tested, assembled, installed, placed on a surface, moved or shown in another coherent way. These are examples, not limits. Do not force the product into the character's hand. Preserve the correct apparent scale and the correct number of units; do not duplicate it unless the advertised product is inherently a set, kit or multiple-unit item."
6) "Preserve realistic anatomy and physically coherent interaction between the character and the product. Hands and fingers must be realistic only when they are visible or involved. Do not redesign, reinterpret, translate, correct, enhance or invent any product detail. Authentic skin texture with pores, no beauty filter, no plastic look, vertical 9:16 composition, realistic TikTok content appearance, one single image, no grid and no collage."

REGRAS OBRIGATÓRIAS:
- PROIBIDO presumir que o produto precisa estar na mão, ter embalagem, rótulo, tampa ou frente voltada para a câmera.
- Identifique a forma natural de apresentação pela categoria e pelo modo de uso. Uma roupa pode estar vestida; maquiagem pode estar aplicada ou sendo aplicada; um utensílio pode estar em uso; um brinquedo pode estar sendo demonstrado. Estes são apenas exemplos, nunca limites.
- Quando mãos não participarem da demonstração, não crie instruções artificiais para segurar o produto. No campo "maos_produto", descreva somente a interação real das mãos ou escreva "not applicable".
- PROIBIDO citar cor, peça ou estilo de roupa da personagem (blusa preta, blazer branco, camisa jeans, regata etc.), exceto quando a própria roupa for o produto anunciado ou houver instrução específica desta produção.
- PROIBIDO citar joias, brincos, argolas, maquiagem específica ou penteado montado vindos do cadastro. Maquiagem só pode ser especificada quando for o próprio produto ou parte necessária da demonstração.
- PROIBIDO citar local específico (banheiro, quarto, estúdio, sala, cozinha, penteadeira etc.), fundo específico, decoração ou esquema de iluminação específico.
- Use apenas linguagem adaptativa quando precisar: composição natural e coerente com o produto, aparência de conteúdo verdadeiro de TikTok.
- Só inclua roupa, ambiente, pose, expressão ou iluminação se houver instrução específica desta produção ou se o elemento for o próprio produto demonstrado.
- Prioridade visual: 1) imagem principal da personagem para identidade; 2) imagem do produto para aparência do produto; 3) categoria e modo de uso para interação; 4) instrução específica desta produção; 5) liberdade visual apenas no que não foi definido.
- Nenhuma descrição textual pode prevalecer sobre as duas imagens de referência.
Em "enquadramento", "iluminacao", "pose" e "expressao" escreva "livre" quando não houver instrução específica desta produção.`,
    shape: `{"prompt":"","prompt_negativo":"","enquadramento":"","iluminacao":"","pose":"","maos_produto":"","expressao":"","continuidade":""}`,
  };
}

/* ─────────── Três roteiros ─────────── */

export const ANGULOS = [
  {
    variante: 1,
    nome: "Problema e solução",
    estrutura:
      "1) identificar um problema real do público; 2) apresentar o produto da forma adequada à categoria; 3) demonstrar como usar, vestir, aplicar, operar ou interagir, conforme o caso; 4) explicar apenas benefícios confirmados nos dados; 5) responder uma objeção; 6) fechar com o CTA escolhido.",
  },
  {
    variante: 2,
    nome: "Descoberta e recomendação",
    estrutura:
      "1) começar com descoberta ou reação genuína; 2) soar como recomendação natural entre amigas; 3) apresentar o produto da forma coerente com sua categoria; 4) explicar por que chamou atenção; 5) demonstrar o uso real sem presumir que esteja na mão; 6) fechar com o CTA escolhido. PROIBIDO afirmar que usou por dias, comprou, recebeu resultados ou viveu qualquer experiência pessoal.",
  },
  {
    variante: 3,
    nome: "Demonstração e oferta",
    estrutura:
      "1) tornar o produto imediatamente compreensível visualmente; 2) criar gancho visual forte; 3) demonstrar a utilização adequada à categoria; 4) destacar diferenciais confirmados; 5) mostrar praticidade ou situação de uso; 6) fechar com o CTA escolhido. PROIBIDO criar falsa urgência.",
  },
] as const;

const SHAPE_ROTEIRO = `{"angulo_nome":"","objetivo":"","publico":"","emocao":"","gancho_falado":"","gancho_visual":"","cenas":[{"inicio":0,"fim":3,"fala":"","acao":"","movimento_corpo":"","movimento_maos":"","expressao":"","posicao_produto":"","direcao_olhar":"","camera":"","texto_na_tela":""}],"demonstracao":"","cta":"","legenda":"","hashtags":""}`;

export function promptTresRoteiros(ctx: ProjectContext, cta: string) {
  return {
    system:
      "Você é roteirista brasileira de vídeos de venda para TikTok Shop. Escreve fala falada, natural e curta, como uma criadora real conversando com a câmera. Nada de locução publicitária, formalidade, palavras difíceis, frases longas ou texto robótico. Você adapta a demonstração a qualquer categoria de produto sem presumir que ele esteja na mão.",
    prompt: `${contextoFluxo(ctx, cta)}

${REGRA_PRODUTO_UNIVERSAL}

Crie TRÊS roteiros REALMENTE diferentes entre si — gancho diferente, ângulo de venda diferente, estrutura diferente, demonstração diferente, emoção diferente e forma diferente de apresentar o produto. Nada de versões quase iguais.

${ANGULOS.map((a) => `ROTEIRO ${a.variante} — ${a.nome}\nEstrutura obrigatória: ${a.estrutura}`).join("\n\n")}

Antes de escrever as cenas, determine a forma real e coerente de demonstrar este produto. Não transforme automaticamente todo produto em uma embalagem segurada. O campo "posicao_produto" deve registrar o estado, a localização e a relação do produto com a personagem ou com a superfície: vestido, aplicado, em uso, apoiado, montado, instalado, segurado ou outra forma realmente adequada.
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
      "Você é roteirista brasileira de vídeos de venda para TikTok Shop. Escreve fala falada, natural e curta, como uma criadora real conversando com a câmera. Adapte a demonstração a qualquer categoria e não presuma que o produto esteja na mão.",
    prompt: `${contextoFluxo(ctx, cta)}

${REGRA_PRODUTO_UNIVERSAL}

Crie UM roteiro no ângulo "${angulo.nome}".
Estrutura obrigatória: ${angulo.estrutura}
O campo "posicao_produto" representa o estado, a localização e a forma de interação do produto, não apenas uma posição na mão.
Sem limite de duração: escreva o necessário, em cenas curtas e naturais.
${instrucao ? `AJUSTE PEDIDO: ${instrucao}` : ""}`,
    shape: SHAPE_ROTEIRO,
  };
}

/* ─────────── Prompts por clipe (Google Flow / Gemini Omni Flash) ─────────── */

const REGRAS_CONTINUIDADE = `A foto enviada é a ÚNICA fonte visual do vídeo e o primeiro frame do clipe 1. Cada prompt deve preservar exatamente o conteúdo visual dessa foto: o mesmo fundo, a mesma iluminação, a mesma roupa, o mesmo enquadramento, a mesma posição inicial, a mesma personagem, o mesmo produto, a mesma aparência do produto, o mesmo modo de interação e os mesmos objetos já presentes na imagem.
O produto não é necessariamente um objeto segurado. Preserve exatamente como ele aparece: vestido, aplicado, em uso, apoiado, montado, instalado, segurado ou em qualquer outra condição visível. Roupas, maquiagem, perfumes, brinquedos e utensílios de cozinha são apenas exemplos, não limites.
Não descreva um novo local, não troque o fundo, não mova a personagem para outro espaço, não adicione, remova, substitua ou invente elementos visuais.
Nos clipes seguintes, mantenha a continuidade visual usando o ÚLTIMO FRAME do clipe anterior como PRIMEIRO FRAME do próximo, descrevendo isso explicitamente.
A foto enviada neste projeto é a única fonte visual do vídeo. Use essa imagem como primeiro frame e preserve exatamente a pessoa, o produto e todos os elementos já presentes nela.
Rosto, cabelo, roupa, produto e relação física entre personagem e produto devem permanecer exatamente como aparecem na foto do projeto. Não reconstrua a pessoa a partir de descrição textual, não compare com nenhuma outra imagem e não misture referências diferentes.
Nos clipes seguintes, use o último frame do clipe anterior como primeiro frame e preserve a continuidade do próprio vídeo.
O clipe 1 começa exatamente no estado visual descrito na análise da foto: mesma pose, mesma expressão, mesmo modo de interação com o produto, mesmo estado, mesma localização e mesma orientação.
Considere as mãos somente quando elas realmente estiverem visíveis ou participarem da ação. Não invente mão livre, não force o produto para uma mão e não altere a forma de uso sem uma transição visível e coerente.
Se o produto estiver vestido, preserve caimento, ajuste e posição no corpo. Se estiver aplicado, preserve área e estágio de aplicação. Se estiver em uso, preserve estado operacional, contato e posição. Se estiver apoiado, montado ou instalado, preserve essa relação até que uma ação visível a modifique. Esses são exemplos de continuidade, não uma lista fechada.
Não peça nenhuma imagem separada do produto e não use imagens da página de vendas como referência para o vídeo.
Proibido: transformar o produto em uma embalagem genérica, forçar rótulo ou tampa inexistentes, redesenhar marcas, inventar textos, duplicar ou sumir com o produto, deformar corpo, mãos ou dedos, trocar roupa, fundo, iluminação ou enquadramento, adicionar pessoas ou objetos.`;

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
      "Você escreve prompts de vídeo para o Google Flow (Gemini Omni Flash), clipe a clipe, partindo de uma foto inicial já existente. As falas ficam em português do Brasil; o restante em inglês técnico. Estruture em blocos claros e preserve qualquer forma real de interação com o produto, sem presumir que ele esteja na mão.",
    prompt: `${contextoFluxo(ctx, cta)}

O vídeo será produzido em ${clipes.length} clipes individuais e depois unido no Scenebuilder.
O CLIPE 1 usa a foto já enviada como primeiro frame. Cada clipe seguinte usa o ÚLTIMO FRAME do clipe anterior como primeiro frame — descreva isso explicitamente no prompt.

${REGRAS_CONTINUIDADE}

ROTEIRO BASE:
${JSON.stringify(roteiro).slice(0, 6000)}

PLANO DE CLIPES (respeite a divisão e a fala exata de cada clipe):
${listaClipes(clipes)}

Para CADA clipe devolva: estado inicial, fala exata, ação, gesto, expressão, estado/localização/interação do produto no campo "posicao_produto", câmera, estado final, ligação com o próximo clipe, continuidade, restrições, prompt negativo e o prompt final pronto para colar no Google Flow (campo prompt_flow, completo e autossuficiente, incluindo a duração do clipe e o formato vertical 9:16).`,
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
      "Você escreve prompts de vídeo para o Google Flow (Gemini Omni Flash) para UM clipe específico dentro de uma sequência. As falas ficam em português do Brasil; o restante em inglês técnico. Preserve a forma real de uso do produto e não presuma que esteja na mão.",
    prompt: `${contextoFluxo(ctx, cta)}

${REGRAS_CONTINUIDADE}

ROTEIRO BASE:
${JSON.stringify(roteiro).slice(0, 4000)}

${anterior ? `CLIPE ANTERIOR (${anterior.ordem}) terminou assim: ${anterior.estado_final ?? ""}\nFala anterior: ${anterior.fala ?? ""}` : "Este é o PRIMEIRO clipe: usa a foto enviada como primeiro frame."}
${proximo ? `PRÓXIMO CLIPE começa com a fala: ${proximo.fala ?? ""}` : "Este é o ÚLTIMO clipe: fecha com o CTA."}

CLIPE ${clipe.ordem} — ${clipe.duracao} segundos
Fala: ${clipe.fala || "(sem fala, só ação)"}
${instrucao ? `AJUSTE PEDIDO PELO USUÁRIO: ${instrucao}` : ""}

Devolva o clipe completo, com o prompt final pronto para colar no Google Flow. No campo "posicao_produto", descreva o estado e a forma de interação adequados à categoria, e não apenas a posição em uma mão.`,
    shape: SHAPE_CLIPE,
  };
}

export function textoRoteiro(roteiro: any) {
  const cenas = Array.isArray(roteiro?.cenas) ? roteiro.cenas : [];
  return cenas
    .map(
      (c: any) =>
        `${c.inicio}s–${c.fim}s\nFala: ${c.fala ?? ""}\nAção: ${c.acao ?? ""}\nCorpo: ${c.movimento_corpo ?? ""}\nMãos: ${c.movimento_maos ?? ""}\nExpressão: ${c.expressao ?? ""}\nProduto — estado/posição/interação: ${c.posicao_produto ?? ""}\nOlhar: ${c.direcao_olhar ?? ""}\nCâmera: ${c.camera ?? ""}\nTexto na tela: ${c.texto_na_tela ?? ""}`,
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
