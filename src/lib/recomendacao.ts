// Recomendação automática de personagem a partir da categoria do produto (client-safe).

type Registro = Record<string, unknown>;

const REGRAS: Array<{ slug: string; nome: string; rotulo: string; padrao: RegExp }> = [
  {
    slug: "isabela",
    nome: "Isabela",
    rotulo: "skincare",
    padrao:
      /(skincare|pele|s[ée]rum|hidratante|protetor solar|[áa]cido|niacinamida|limpeza facial|sabonete facial|acne)/i,
  },
  {
    slug: "julia",
    nome: "Júlia",
    rotulo: "maquiagem",
    padrao:
      /(maquiagem|makeup|batom|base|corretivo|r[íi]mel|m[áa]scara de c[íi]lios|blush|p[óo] compacto|delineador|sombra|gloss|il+uminador)/i,
  },
  {
    slug: "camila",
    nome: "Camila",
    rotulo: "cabelo",
    padrao:
      /(cabelo|capilar|shampoo|condicionador|m[áa]scara capilar|progressiva|cachos|finalizador|[óo]leo capilar|antiqueda)/i,
  },
  {
    slug: "marina",
    nome: "Marina",
    rotulo: "gadget de beleza",
    padrao:
      /(gadget|aparelho|dispositivo|el[ée]tric|massageador|led|depilador|escova alisadora|secador|chapinha|microcorrente|limpador facial|barbeador)/i,
  },
  {
    slug: "manu",
    nome: "Manu",
    rotulo: "perfume, rotina e autocuidado",
    padrao:
      /(perfume|fragr[âa]ncia|body splash|colônia|deo|rotina|autocuidado|hidratante corporal|creme corporal|bem-estar|aromaterapia|vela)/i,
  },
];

function texto(produto: Registro | null) {
  if (!produto) return "";
  return [
    produto.categoria,
    produto.nome,
    produto.marca,
    produto.descricao,
    produto.beneficios,
    produto.caracteristicas,
  ]
    .map((v) => String(v ?? ""))
    .join(" ");
}

export type Recomendacao = {
  personagem: Registro | null;
  motivo: string;
};

/** Escolhe a personagem mais adequada e explica o motivo em uma frase. */
export function recomendarPersonagem(
  produto: Registro | null,
  personagens: Registro[],
): Recomendacao {
  const base = texto(produto);
  const regra = REGRAS.find((r) => r.padrao.test(base));
  if (!regra || !personagens.length) {
    return {
      personagem: personagens[0] ?? null,
      motivo: personagens.length
        ? "Não foi possível classificar a categoria deste produto automaticamente. Escolha a personagem mais adequada."
        : "Nenhuma personagem cadastrada.",
    };
  }

  const alvo =
    personagens.find((p) => String(p.slug ?? "").toLowerCase() === regra.slug) ??
    personagens.find((p) =>
      String(p.nome_exibicao ?? p.nome ?? "")
        .toLowerCase()
        .includes(regra.nome.toLowerCase()),
    ) ??
    personagens[0];

  return {
    personagem: alvo ?? null,
    motivo: `este produto foi classificado como ${regra.rotulo}.`,
  };
}
