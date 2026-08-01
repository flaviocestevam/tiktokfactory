export const VARIAVEIS = [
  "{{PRODUTO}}",
  "{{MARCA}}",
  "{{CATEGORIA}}",
  "{{BENEFICIO_PRINCIPAL}}",
  "{{PUBLICO}}",
  "{{PRECO}}",
  "{{OFERTA}}",
  "{{NOME_DA_PERSONAGEM}}",
  "{{BIOGRAFIA_DA_PERSONAGEM}}",
  "{{TOM_DE_VOZ}}",
  "{{ESTILO_DE_VENDA}}",
  "{{APARENCIA_DA_PERSONAGEM}}",
  "{{IMAGEM_CANONICA_PRINCIPAL}}",
  "{{IMAGENS_CANONICAS_AUXILIARES}}",
  "{{REGRAS_DE_IDENTIDADE}}",
  "{{DURACAO}}",
  "{{OBJETIVO}}",
  "{{ANGULO_DE_VENDA}}",
  "{{CTA}}",
] as const;

export type NomeVariavel = (typeof VARIAVEIS)[number];

/** Substitui variáveis conhecidas. Variáveis sem valor permanecem como marcador — nunca viram "undefined". */
export function renderVariaveis(texto: string, valores: Record<string, string | null | undefined>): string {
  return texto.replace(/\{\{([A-Z_]+)\}\}/g, (match, chave: string) => {
    const valor = valores[chave];
    if (valor === undefined || valor === null || String(valor).trim() === "") return match;
    return String(valor);
  });
}

export function variaveisAusentes(texto: string, valores: Record<string, string | null | undefined>): string[] {
  const encontradas = texto.match(/\{\{([A-Z_]+)\}\}/g) ?? [];
  return [...new Set(encontradas)].filter((v) => {
    const chave = v.replace(/[{}]/g, "");
    const valor = valores[chave];
    return valor === undefined || valor === null || String(valor).trim() === "";
  });
}

export const DURACOES = [10, 15, 20, 30, 45, 60] as const;

export const ESTILOS_VIDEO = [
  "Demonstração",
  "Depoimento",
  "Problema e solução",
  "Descoberta",
  "Produto viral",
  "Comparação",
  "Rotina",
  "Tutorial",
  "Unboxing",
  "Antes e depois",
  "Primeira impressão",
  "Avaliação honesta",
  "História pessoal",
  "Oferta direta",
  "Resposta a uma dúvida",
  "Lista de benefícios",
  "Quebra de objeção",
  "Amiga recomendando",
  "Especialista explicando",
] as const;

export const OBJETIVOS = [
  "Gerar clique",
  "Gerar venda",
  "Apresentar o produto",
  "Despertar curiosidade",
  "Mostrar resultado",
  "Quebrar objeção",
  "Explicar o funcionamento",
  "Mostrar praticidade",
  "Criar desejo",
  "Apresentar oferta",
  "Aumentar confiança",
] as const;

export const TONS_LINGUAGEM = [
  "Popular",
  "Profissional",
  "Divertida",
  "Emocional",
  "Didática",
  "Direta",
] as const;

export const NIVEIS = ["Baixo", "Médio", "Alto"] as const;

export const VARIACOES_ALTERNATIVAS = [
  { id: "curta", label: "Mais curta" },
  { id: "direta", label: "Mais direta" },
  { id: "emocional", label: "Mais emocional" },
  { id: "divertida", label: "Mais divertida" },
  { id: "profissional", label: "Mais profissional" },
  { id: "demonstracao", label: "Mais demonstração" },
  { id: "menos_fala", label: "Menos fala" },
  { id: "sem_voz", label: "Sem voz (só textos na tela)" },
  { id: "ab", label: "Versão para teste A/B" },
] as const;

export const HORARIOS = ["Manhã", "Tarde", "Fim de tarde", "Noite"] as const;
export const ILUMINACOES = ["Natural", "Suave difusa", "Luz de janela", "Ring light", "Quente", "Fria", "Dramática"] as const;
export const ENQUADRAMENTOS = ["Close", "Meio-primeiro plano", "Plano médio", "Plano americano", "Corpo inteiro"] as const;

export const PLACEHOLDER_PERSONAGEM = "{{PERSONAGEM_A_SER_DEFINIDA}}";
export const AVISO_SEM_PERSONAGEM =
  "Este projeto ainda não possui uma personagem. A linguagem, o comportamento e a identidade visual serão finalizados depois que uma personagem for selecionada.";