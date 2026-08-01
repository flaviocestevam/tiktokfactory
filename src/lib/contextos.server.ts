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
Proibido: reconstruir a pessoa a partir de descrição textual, trocar o fundo, mudar de local, adicionar, remover ou inventar objetos e pessoas, redesenhar o rótulo ou duplicar o produto.
${project.reference_image_url ? "A foto já foi enviada e confirmada nesta produção." : "ATENÇÃO: a foto ainda não foi enviada."}`;

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
export function descreverAparenciaParaFoto(character: Record<string, any> | null): string {
  if (!character) return `APARÊNCIA: ${PLACEHOLDER_PERSONAGEM}. Não invente identidade.`;
  return (
    "APARÊNCIA CADASTRADA DA PERSONAGEM (siga exatamente o texto, sem inventar):\n" +
    bloco("Nome", character.nome_exibicao || character.nome) +
    bloco("Idade", character.idade) +
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
    bloco("Regras de consistência", character.regras_consistencia) +
    bloco("Prompt mestre de identidade", character.prompt_mestre) +
    bloco("Prompt negativo", character.prompt_negativo)
  );
}
