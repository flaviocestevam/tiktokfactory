/* eslint-disable @typescript-eslint/no-explicit-any */
// Contextos separados enviados à IA (somente servidor).
import { AVISO_SEM_PERSONAGEM, PLACEHOLDER_PERSONAGEM } from "./variables";
import { FORMATO_VIDEO, IDIOMA_FALA } from "./config";

function bloco(titulo: string, valor: unknown): string {
  if (valor === null || valor === undefined || String(valor).trim() === "") return "";
  return `${titulo}: ${String(valor).trim()}\n`;
}

/** Contexto do produto: única fonte de verdade sobre o que é vendido. */
export function descreverProdutoParaRoteiro(product: Record<string, any> | null): string {
  if (!product) return "PRODUTO: nenhum produto vinculado. Não invente informações de produto.";
  return (
    "PRODUTO (única fonte de verdade — nunca invente nada além do que está aqui):\n" +
    bloco("Nome", product.nome) +
    bloco("Marca", product.marca) +
    bloco("Categoria", product.categoria) +
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

/**
 * Contexto da personagem: SOMENTE comportamento, comunicação e estratégia.
 * A foto de perfil da personagem é apenas visual de interface e nunca entra aqui.
 */
export function descreverPersonagemParaRoteiro(character: Record<string, any> | null): string {
  if (!character) {
    return `PERSONAGEM: ainda não definida. Use o marcador ${PLACEHOLDER_PERSONAGEM} onde o nome apareceria.\n${AVISO_SEM_PERSONAGEM}\nNão invente nome, biografia ou identidade.`;
  }
  return (
    "PERSONAGEM (comportamento e comunicação — respeite integralmente, sem misturar identidades):\n" +
    bloco("Nome", character.nome_exibicao || character.nome) +
    bloco("Nicho", character.nicho) +
    bloco("Idade", character.idade) +
    bloco("Profissão", character.profissao) +
    bloco("Biografia", character.biografia) +
    bloco("História pessoal", character.historia_pessoal) +
    bloco("Personalidade", character.personalidade) +
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
    bloco("Posicionamento", character.posicionamento) +
    bloco("Promessa central", character.promessa_central) +
    bloco("Direção estratégica interna", character.biografia_interna) +
    bloco("Dores do público", character.dores_publico) +
    bloco("Desejos do público", character.desejos_publico) +
    bloco("Pilares de conteúdo", character.pilares_conteudo) +
    bloco("Gatilhos de persuasão", character.gatilhos_persuasao) +
    bloco("Formatos de roteiro ideais", character.formatos_roteiro) +
    bloco("Estilo de interpretação em vídeo", character.estilo_interpretacao) +
    bloco("Palavras e alegações PROIBIDAS", character.palavras_proibidas) +
    "IMPORTANTE: a aparência física NÃO vem daqui. A única fonte visual é a foto enviada nesta produção.\n"
  );
}

/** Contexto visual: a foto enviada na produção é a única fonte de imagem. */
export const descreverFotoDoProjeto = (project: Record<string, any>) =>
  `FONTE VISUAL ÚNICA: a foto enviada nesta produção é a única referência visual do vídeo e o primeiro frame do primeiro clipe.
Ela já contém a pessoa, o produto, a roupa, a posição, a iluminação, o enquadramento e o fundo definitivos.
Preserve exatamente: mesmo rosto, mesmo cabelo, mesma roupa, mesmo produto, mesma embalagem, mesmo fundo, mesma iluminação e mesmo enquadramento.
Não existe imagem separada do produto: nunca peça, cite ou use imagens da página de vendas como referência visual.
Proibido: reconstruir a pessoa a partir de descrição textual, trocar o fundo, mudar de local, adicionar, remover ou inventar objetos e pessoas, redesenhar o rótulo ou duplicar o produto.
${project.reference_image_url ? "A foto já foi enviada e confirmada nesta produção." : "ATENÇÃO: a foto ainda não foi enviada."}

${descreverAnaliseVisual(project)}`;

/**
 * Estado visual inicial lido automaticamente da foto da produção.
 * Orienta apenas ações, gestos e continuidade — nunca dados comerciais.
 */
export function descreverAnaliseVisual(project: Record<string, any>): string {
  const a = project?.project_image_analysis as Record<string, any> | null;
  if (!a || typeof a !== "object") {
    return "ANÁLISE VISUAL DA FOTO: ainda não disponível. Não deduza pose, mãos ou posição do produto.";
  }
  const lista = (v: unknown) => (Array.isArray(v) && v.length ? v.join("; ") : "");
  return (
    "ANÁLISE VISUAL DA FOTO (estado inicial real — orienta ações e continuidade, nunca dados comerciais):\n" +
    bloco("Enquadramento", a.framing) +
    bloco("Posição da câmera", a.camera_position) +
    bloco("Distância da câmera", a.camera_distance) +
    bloco("Posição do corpo", a.body_position) +
    bloco("Pose inicial", a.initial_pose) +
    bloco("Expressão inicial", a.initial_expression) +
    bloco("Direção do olhar", a.gaze_direction) +
    bloco("Mão que segura o produto", a.product_hand) +
    bloco("Mão livre", a.free_hand) +
    bloco("Posição do produto", a.product_position) +
    bloco("Orientação do produto", a.product_orientation) +
    bloco("Tamanho aparente do produto", a.product_apparent_size) +
    bloco("Visibilidade do rótulo", a.label_visibility) +
    bloco("Iluminação", a.lighting) +
    bloco("Elementos visíveis", lista(a.visible_elements)) +
    bloco("Movimentos seguros", lista(a.safe_movements)) +
    bloco("Riscos de continuidade", lista(a.continuity_risks)) +
    "Use estas informações apenas para escolher ações, gestos e câmera compatíveis com a imagem inicial.\n" +
    "Nunca use a análise visual para afirmar benefícios, características, ingredientes ou qualquer alegação comercial.\n"
  );
}

/** Regras comerciais e de honestidade aplicadas a todo texto gerado. */
export const REGRAS_COMERCIAIS = `REGRAS COMERCIAIS OBRIGATÓRIAS:
- Fale somente o que está confirmado nos dados do produto. Nunca invente ingredientes, resultados, prazos, preços ou promoções.
- Proibido inventar experiência pessoal: não diga que comprou, recebeu, usou por dias ou teve resultados.
- Proibido promessa de cura, garantia de resultado, urgência falsa e comparação com marcas concorrentes.
- Nunca escreva na fala qualquer aviso interno sobre dados faltantes: apenas não mencione o que não foi confirmado.
- Fala em ${IDIOMA_FALA}, natural e conversada, formato ${FORMATO_VIDEO} para TikTok Shop.`;

/** Preferências do usuário salvas na produção. */
export function descreverPreferencias(project: Record<string, any>): string {
  const texto =
    bloco("Nível de energia", project.nivel_energia) +
    bloco("Velocidade da fala", project.velocidade_fala) +
    bloco("Observações do usuário", project.observacoes);
  return texto ? `PREFERÊNCIAS DA PRODUÇÃO:\n${texto}` : "";
}

/**
 * Descrição textual da aparência da personagem — usada APENAS no prompt da foto
 * inicial, quando ainda não existe imagem da produção.
 */
/**
 * Identidade FIXA da personagem para a foto inicial.
 * Só traços imutáveis: nada de roupa, acessórios, maquiagem, ambiente,
 * pose, expressão, iluminação ou enquadramento (variam a cada produção).
 */
export function descreverIdentidadeFixaParaFoto(character: Record<string, any> | null): string {
  if (!character) return `IDENTIDADE: ${PLACEHOLDER_PERSONAGEM}. Não invente identidade.`;
  return (
    "IDENTIDADE FIXA DA PERSONAGEM (apenas traços permanentes — a imagem principal da personagem é a referência final):\n" +
    bloco("Nome", character.nome_exibicao || character.nome) +
    bloco("Idade adulta", character.idade) +
    bloco("Rosto", character.descricao_rosto) +
    bloco("Olhos", character.descricao_olhos) +
    bloco("Pele", character.descricao_pele) +
    bloco("Cabelo (cor e textura básica)", character.descricao_cabelo) +
    bloco("Proporções corporais", character.descricao_corpo) +
    bloco("Altura", character.altura) +
    bloco("Características únicas permanentes", character.caracteristicas_fixas) +
    "\nIGNORE qualquer menção a roupa, acessórios, joias, maquiagem, ambiente, local, fundo, pose, expressão, iluminação, enquadramento ou estilo fotográfico que apareça nos textos acima: esses elementos variam em cada produção e NÃO podem entrar no prompt.\n"
  );
}

/** Produto para a foto: apenas identificação. A aparência vem da imagem do produto. */
export function descreverProdutoParaFoto(product: Record<string, any> | null): string {
  if (!product) return "PRODUTO: nenhum produto vinculado.";
  return (
    "PRODUTO (somente identificação e uso — a APARÊNCIA vem exclusivamente da imagem do produto):\n" +
    bloco("Nome", product.nome) +
    bloco("Marca", product.marca) +
    bloco("Categoria", product.categoria) +
    bloco("Tamanho", product.tamanho) +
    bloco("Modo de uso", product.modo_de_uso) +
    "\nPROIBIDO transformar dados comerciais (benefícios, ingredientes, preço, avaliações, oferta, garantias, dúvidas) em texto visual na embalagem ou em elementos da imagem.\n"
  );
}

