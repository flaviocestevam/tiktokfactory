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
    produto.subcategoria,
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

/** Escolhe a personagem adequada apenas quando a categoria é reconhecida com segurança. */
export function recomendarPersonagem(
  produto: Registro | null,
  personagens: Registro[],
): Recomendacao {
  if (!personagens.length) {
    return { personagem: null, motivo: "Nenhuma personagem cadastrada." };
  }

  const base = texto(produto);
  const regra = REGRAS.find((r) => r.padrao.test(base));
  if (!regra) {
    return {
      personagem: null,
      motivo:
        "Não foi possível classificar este produto em um dos cinco nichos. Escolha manualmente a personagem mais adequada.",
    };
  }

  const alvo =
    personagens.find((p) => String(p.slug ?? "").toLowerCase() === regra.slug) ??
    personagens.find((p) =>
      String(p.nome_exibicao ?? p.nome ?? "")
        .toLowerCase()
        .includes(regra.nome.toLowerCase()),
    ) ??
    null;

  if (!alvo) {
    return {
      personagem: null,
      motivo: `O produto foi classificado como ${regra.rotulo}, mas a personagem correspondente não está cadastrada.`,
    };
  }

  return {
    personagem: alvo,
    motivo: `este produto foi classificado como ${regra.rotulo}.`,
  };
}
