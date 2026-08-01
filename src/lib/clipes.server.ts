/* eslint-disable @typescript-eslint/no-explicit-any */
// Cálculo automático de duração e divisão do roteiro em clipes (somente servidor).

export const TAMANHOS_CLIPE = [4, 6, 8, 10] as const;
export const OCUPACAO_MAXIMA = 0.88; // 85%–90% da capacidade de fala do clipe

export function contarPalavras(texto: string) {
  return String(texto ?? "").split(/\s+/).filter(Boolean).length;
}

/** Velocidade de fala em palavras por segundo, a partir da personagem. */
export function palavrasPorSegundo(character: Record<string, any> | null) {
  const v = String(character?.velocidade_fala ?? "").toLowerCase();
  if (/(muito r|acelerad|rapidíss)/.test(v)) return 3.2;
  if (/(rápid|rapid|din[âa]mic|energ)/.test(v)) return 3.0;
  if (/(lent|calm|pausad|suave|tranquil)/.test(v)) return 2.3;
  return 2.7;
}

/** Tempo extra de pausas naturais causadas pela pontuação. */
export function segundosDePausa(texto: string) {
  const t = String(texto ?? "");
  const fortes = (t.match(/[.!?…]/g) ?? []).length;
  const fracas = (t.match(/[,;:—-]/g) ?? []).length;
  return fortes * 0.45 + fracas * 0.22;
}

const DEMO = /(mostr|demonstr|aplic|abre|abrir|gira|espirr|passa|borrif|toca|textur|derrama|encaixa|liga|test)/i;

/** Tempo extra de ações, gestos, reações e demonstrações de uma cena. */
export function segundosDeAcao(cena: Record<string, any>) {
  let extra = 0;
  const acao = String(cena?.acao ?? "");
  if (acao.trim()) extra += 0.8;
  if (DEMO.test(acao) || DEMO.test(String(cena?.movimento_maos ?? ""))) extra += 1.4;
  if (String(cena?.posicao_produto ?? "").trim()) extra += 0.4;
  if (String(cena?.movimento_corpo ?? "").trim()) extra += 0.3;
  if (String(cena?.expressao ?? "").trim()) extra += 0.2;
  return Math.min(extra, 3.5);
}

export type Unidade = {
  fala: string;
  cena: Record<string, any>;
  indiceCena: number;
  cta: boolean;
  segundosFala: number;
  segundosAcao: number;
  segundos: number;
};

function frases(texto: string) {
  const partes = String(texto ?? "")
    .split(/(?<=[.!?…])\s+/)
    .map((f) => f.trim())
    .filter(Boolean);
  return partes.length ? partes : [];
}

/** Quebra o roteiro em unidades mínimas indivisíveis (frases completas dentro de cada cena). */
export function unidadesDoRoteiro(roteiro: any, pps: number, ctaTexto?: string): Unidade[] {
  const cenas: any[] = Array.isArray(roteiro?.cenas) ? roteiro.cenas : [];
  const unidades: Unidade[] = [];
  const cta = String(roteiro?.cta ?? ctaTexto ?? "").toLowerCase();

  cenas.forEach((cena, indiceCena) => {
    const lista = frases(cena?.fala ?? "");
    const acaoTotal = segundosDeAcao(cena ?? {});
    if (!lista.length) {
      if (acaoTotal > 0) {
        unidades.push({
          fala: "",
          cena: cena ?? {},
          indiceCena,
          cta: false,
          segundosFala: 0,
          segundosAcao: acaoTotal,
          segundos: acaoTotal,
        });
      }
      return;
    }
    lista.forEach((fala, i) => {
      const segundosFala = contarPalavras(fala) / pps + segundosDePausa(fala);
      const segundosAcao = i === 0 ? acaoTotal : 0;
      unidades.push({
        fala,
        cena: cena ?? {},
        indiceCena,
        cta: Boolean(cta && fala.toLowerCase().includes(cta.slice(0, 14))),
        segundosFala,
        segundosAcao,
        segundos: segundosFala + segundosAcao,
      });
    });
  });

  return unidades;
}

function menorTamanhoQueCabe(segundos: number) {
  for (const t of TAMANHOS_CLIPE) {
    if (segundos <= t * OCUPACAO_MAXIMA) return t;
  }
  return TAMANHOS_CLIPE[TAMANHOS_CLIPE.length - 1];
}

export type ClipePlanejado = {
  ordem: number;
  duracao: number;
  unidades: Unidade[];
  fala: string;
  segundos: number;
  segundosFala: number;
  palavras: number;
  excede: boolean;
};

/** Agrupa unidades em clipes de 4, 6, 8 ou 10 segundos, cortando só em pontos naturais. */
export function planejarClipes(unidades: Unidade[], quantidadeForcada?: number): ClipePlanejado[] {
  const maximo = TAMANHOS_CLIPE[TAMANHOS_CLIPE.length - 1] * OCUPACAO_MAXIMA;
  const limite =
    quantidadeForcada && quantidadeForcada > 0
      ? Math.min(
          maximo,
          Math.max(
            1,
            unidades.reduce((s, u) => s + u.segundos, 0) / quantidadeForcada,
          ),
        )
      : maximo;

  const grupos: Unidade[][] = [];
  let atual: Unidade[] = [];
  let soma = 0;

  for (const u of unidades) {
    const mudancaDeCena = atual.length > 0 && u.indiceCena !== atual[atual.length - 1].indiceCena;
    const antesDoCta = atual.length > 0 && u.cta && soma > limite * 0.5;
    if (atual.length && (soma + u.segundos > limite || antesDoCta || (mudancaDeCena && soma > limite * 0.75))) {
      grupos.push(atual);
      atual = [];
      soma = 0;
    }
    atual.push(u);
    soma += u.segundos;
  }
  if (atual.length) grupos.push(atual);

  return grupos.map((g, i) => {
    const segundos = g.reduce((s, u) => s + u.segundos, 0);
    const segundosFala = g.reduce((s, u) => s + u.segundosFala, 0);
    const fala = g.map((u) => u.fala).filter(Boolean).join(" ");
    const duracao = menorTamanhoQueCabe(segundos);
    return {
      ordem: i + 1,
      duracao,
      unidades: g,
      fala,
      segundos: Math.round(segundos * 10) / 10,
      segundosFala: Math.round(segundosFala * 10) / 10,
      palavras: contarPalavras(fala),
      excede: segundos > duracao * OCUPACAO_MAXIMA + 0.05,
    };
  });
}

export type PlanoRoteiro = {
  clipes: ClipePlanejado[];
  duracaoFala: number;
  duracaoTotal: number;
  duracaoClipes: number;
  palavras: number;
  palavrasPorSegundo: number;
};

export function planejarRoteiro(
  roteiro: any,
  character: Record<string, any> | null,
  cta?: string,
  quantidadeForcada?: number,
): PlanoRoteiro {
  const pps = palavrasPorSegundo(character);
  const unidades = unidadesDoRoteiro(roteiro, pps, cta);
  const clipes = planejarClipes(unidades, quantidadeForcada);
  const duracaoFala = unidades.reduce((s, u) => s + u.segundosFala, 0);
  const duracaoTotal = unidades.reduce((s, u) => s + u.segundos, 0);
  return {
    clipes,
    duracaoFala: Math.round(duracaoFala * 10) / 10,
    duracaoTotal: Math.round(duracaoTotal * 10) / 10,
    duracaoClipes: clipes.reduce((s, c) => s + c.duracao, 0),
    palavras: unidades.reduce((s, u) => s + contarPalavras(u.fala), 0),
    palavrasPorSegundo: pps,
  };
}

/** Recalcula os metadados de clipes a partir de grupos de unidades já definidos. */
export function montarClipes(grupos: Unidade[][]): ClipePlanejado[] {
  return grupos
    .filter((g) => g.length)
    .map((g, i) => {
      const segundos = g.reduce((s, u) => s + u.segundos, 0);
      const segundosFala = g.reduce((s, u) => s + u.segundosFala, 0);
      const fala = g.map((u) => u.fala).filter(Boolean).join(" ");
      const duracao = menorTamanhoQueCabe(segundos);
      return {
        ordem: i + 1,
        duracao,
        unidades: g,
        fala,
        segundos: Math.round(segundos * 10) / 10,
        segundosFala: Math.round(segundosFala * 10) / 10,
        palavras: contarPalavras(fala),
        excede: segundos > duracao * OCUPACAO_MAXIMA + 0.05,
      };
    });
}

/** Une o clipe indicado ao anterior. */
export function unirComAnterior(grupos: Unidade[][], ordem: number) {
  const i = ordem - 1;
  if (i <= 0 || i >= grupos.length) return montarClipes(grupos);
  const novos = grupos.map((g) => [...g]);
  novos[i - 1] = [...novos[i - 1], ...novos[i]];
  novos.splice(i, 1);
  return montarClipes(novos);
}

/** Separa o clipe indicado em dois, cortando num ponto natural (fim de frase). */
export function separarClipe(grupos: Unidade[][], ordem: number) {
  const i = ordem - 1;
  const alvo = grupos[i];
  if (!alvo || alvo.length < 2) return montarClipes(grupos);
  const total = alvo.reduce((s, u) => s + u.segundos, 0);
  let acumulado = 0;
  let corte = 1;
  for (let k = 0; k < alvo.length - 1; k++) {
    acumulado += alvo[k].segundos;
    corte = k + 1;
    if (acumulado >= total / 2) break;
  }
  const novos = grupos.map((g) => [...g]);
  novos.splice(i, 1, alvo.slice(0, corte), alvo.slice(corte));
  return montarClipes(novos);
}