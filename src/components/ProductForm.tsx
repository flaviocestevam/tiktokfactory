import { Loader2 } from "lucide-react";
import { AreaField } from "@/components/Field";
import { Button } from "@/components/ui/button";

export type ProductDraft = { [key: string]: string | undefined };

export const CAMPOS_PRODUTO = [
  {
    chave: "descricao_colada",
    label: "Informações do produto",
  },
] as const;

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
  const texto =
    typeof valores.descricao_colada === "string" ? valores.descricao_colada : "";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Cole as informações do produto</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Copie o título e a descrição da página e cole tudo de uma vez. A IA identifica o produto e usa somente as informações confirmadas para criar os roteiros.
        </p>

        <div className="mt-5">
          <AreaField
            label="Título e descrição"
            rows={16}
            hint="Não precisa organizar, resumir ou separar os dados."
            value={texto}
            onChange={(valor) =>
              onChange({ ...valores, descricao_colada: valor })
            }
          />
        </div>
      </section>

      <div className="flex justify-stretch sm:justify-end">
        <Button
          onClick={onSalvar}
          disabled={salvando || !texto.trim()}
          className="h-11 w-full gap-2 sm:w-auto"
        >
          {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
          {rotuloSalvar}
        </Button>
      </div>
    </div>
  );
}
