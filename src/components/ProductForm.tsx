import { Loader2 } from "lucide-react";
import { AreaField, TextField } from "@/components/Field";
import { Button } from "@/components/ui/button";

export type ProductDraft = { [key: string]: string | undefined };

type CampoProduto = {
  chave: string;
  label: string;
  area?: boolean;
  rows?: number;
  hint?: string;
};

const IDENTIFICACAO: CampoProduto[] = [
  { chave: "nome", label: "Nome do produto *" },
  { chave: "link", label: "Link do produto (opcional)" },
  { chave: "marca", label: "Marca" },
  { chave: "vendedor", label: "Loja ou vendedor" },
  { chave: "categoria", label: "Categoria" },
  { chave: "publico", label: "Público indicado" },
];

const OFERTA: CampoProduto[] = [
  { chave: "preco", label: "Preço normal" },
  { chave: "preco_promocional", label: "Preço promocional" },
  { chave: "desconto", label: "Desconto" },
  { chave: "cupom", label: "Cupom" },
  { chave: "frete", label: "Frete" },
  { chave: "tamanho", label: "Tamanho ou quantidade" },
  { chave: "cores", label: "Cores" },
  { chave: "variacoes", label: "Variações" },
  { chave: "quantidade_vendida", label: "Quantidade vendida" },
  { chave: "numero_avaliacoes", label: "Número de avaliações" },
];

const CONTEUDO: CampoProduto[] = [
  {
    chave: "descricao",
    label: "Descrição do produto *",
    area: true,
    rows: 5,
    hint: "Explique o que é o produto e para que ele serve.",
  },
  {
    chave: "beneficios",
    label: "Principais benefícios *",
    area: true,
    rows: 4,
    hint: "Liste apenas benefícios informados pelo vendedor.",
  },
  { chave: "caracteristicas", label: "Características", area: true, rows: 4 },
  { chave: "diferenciais", label: "Diferenciais", area: true, rows: 4 },
  { chave: "ingredientes", label: "Ingredientes ou composição", area: true, rows: 4 },
  { chave: "modo_de_uso", label: "Como usar", area: true, rows: 4 },
  { chave: "informacoes_tecnicas", label: "Informações técnicas", area: true, rows: 4 },
];

const PROVA_E_CUIDADOS: CampoProduto[] = [
  { chave: "avaliacoes", label: "Resumo das avaliações", area: true, rows: 4 },
  { chave: "duvidas_frequentes", label: "Perguntas frequentes", area: true, rows: 4 },
  { chave: "advertencias", label: "Advertências", area: true, rows: 3 },
  { chave: "restricoes", label: "Restrições", area: true, rows: 3 },
  { chave: "entrega", label: "Informações de entrega", area: true, rows: 3 },
  { chave: "garantias", label: "Garantias", area: true, rows: 3 },
  {
    chave: "oferta",
    label: "Detalhes da oferta",
    area: true,
    rows: 3,
    hint: "Ex.: promoção por tempo limitado, leve 2 pague 1 ou condição do cupom.",
  },
  {
    chave: "dados_adicionais",
    label: "Informações adicionais",
    area: true,
    rows: 6,
    hint: "Cole aqui qualquer informação útil que não entrou nos campos anteriores.",
  },
];

export const CAMPOS_PRODUTO = [
  ...IDENTIFICACAO,
  ...OFERTA,
  ...CONTEUDO,
  ...PROVA_E_CUIDADOS,
];

function SecaoCampos({
  titulo,
  descricao,
  campos,
  txt,
  set,
}: {
  titulo: string;
  descricao: string;
  campos: CampoProduto[];
  txt: (chave: string) => string;
  set: (chave: string, valor: string) => void;
}) {
  const camposCurtos = campos.filter((campo) => !campo.area);
  const camposLongos = campos.filter((campo) => campo.area);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-base font-semibold">{titulo}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>

      {camposCurtos.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {camposCurtos.map((campo) => (
            <TextField
              key={campo.chave}
              label={campo.label}
              value={txt(campo.chave)}
              onChange={(valor) => set(campo.chave, valor)}
            />
          ))}
        </div>
      ) : null}

      {camposLongos.length ? (
        <div className="mt-4 grid gap-4">
          {camposLongos.map((campo) => (
            <AreaField
              key={campo.chave}
              label={campo.label}
              rows={campo.rows ?? 3}
              hint={campo.hint}
              value={txt(campo.chave)}
              onChange={(valor) => set(campo.chave, valor)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function ProductForm({
  valores,
  onChange,
  onSalvar,
  salvando,
  rotuloSalvar = "Salvar produto",
}: {
  valores: ProductDraft;
  onChange: (v: ProductDraft) => void;
  onSalvar: () => void;
  salvando: boolean;
  rotuloSalvar?: string;
}) {
  const set = (chave: string, valor: string) => onChange({ ...valores, [chave]: valor });
  const txt = (chave: string) => {
    const valor = valores[chave];
    return typeof valor === "string" ? valor : "";
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
        <p className="text-sm font-medium">Cadastro manual</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha o nome, a descrição e os benefícios. Os demais campos melhoram a precisão dos roteiros e das ofertas.
        </p>
      </section>

      <SecaoCampos
        titulo="Identificação"
        descricao="Informações básicas para localizar e classificar o produto."
        campos={IDENTIFICACAO}
        txt={txt}
        set={set}
      />

      <SecaoCampos
        titulo="Preço e oferta"
        descricao="Condições comerciais que poderão aparecer nos CTAs."
        campos={OFERTA}
        txt={txt}
        set={set}
      />

      <SecaoCampos
        titulo="Informações para os roteiros"
        descricao="Conteúdo usado para criar argumentos, demonstrações e recomendações."
        campos={CONTEUDO}
        txt={txt}
        set={set}
      />

      <SecaoCampos
        titulo="Prova, segurança e informações extras"
        descricao="Dados opcionais que aumentam a credibilidade e evitam promessas incorretas."
        campos={PROVA_E_CUIDADOS}
        txt={txt}
        set={set}
      />

      <div className="flex justify-stretch gap-2 sm:justify-end">
        <Button onClick={onSalvar} disabled={salvando} className="h-11 w-full gap-2 sm:w-auto">
          {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
          {rotuloSalvar}
        </Button>
      </div>
    </div>
  );
}
