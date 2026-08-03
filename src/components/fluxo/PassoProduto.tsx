/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listar } from "@/lib/queries";

export type ProdutoFluxo = Record<string, any>;

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

export function PassoProduto({
  produto,
  onProdutoSalvo,
  onContinuar,
}: {
  produto: ProdutoFluxo | null;
  onProdutoSalvo: (produto: ProdutoFluxo) => void;
  onContinuar: (produto: ProdutoFluxo) => void;
}) {
  const navigate = useNavigate();
  const [selecionadoId, setSelecionadoId] = useState<string>(texto(produto?.id));

  const produtos = useQuery({
    queryKey: ["products"],
    queryFn: () => listar("products", undefined, { coluna: "updated_at", asc: false }),
  });

  useEffect(() => {
    if (produto?.id) setSelecionadoId(String(produto.id));
  }, [produto?.id]);

  const lista = useMemo(
    () => (produtos.data ?? []) as unknown as ProdutoFluxo[],
    [produtos.data],
  );

  const selecionado = useMemo(
    () => lista.find((item) => String(item.id) === selecionadoId) ?? produto,
    [lista, produto, selecionadoId],
  );

  function continuar() {
    if (!selecionado?.id) {
      toast.error("Selecione um produto cadastrado.");
      return;
    }

    const nome = texto(selecionado.nome);
    const descricao = texto(selecionado.descricao);
    const beneficios = texto(selecionado.beneficios);

    if (!nome || !descricao || !beneficios) {
      toast.error("Complete o nome, a descrição e os benefícios deste produto antes de continuar.");
      navigate({ to: "/produtos/$id", params: { id: String(selecionado.id) } });
      return;
    }

    onProdutoSalvo(selecionado);
    onContinuar(selecionado);
    toast.success("Produto selecionado.");
  }

  if (produtos.isLoading) {
    return <Skeleton className="h-80 rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <section className="surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Escolha o produto</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione um produto já preenchido manualmente para criar a produção.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => navigate({ to: "/produtos/novo" })}
          >
            <PackagePlus className="size-4" />
            Cadastrar produto
          </Button>
        </div>

        {produtos.isFetching ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Atualizando produtos...
          </div>
        ) : null}

        {lista.length ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {lista.map((item) => {
              const ativo = String(item.id) === selecionadoId;
              const resumo = [
                texto(item.marca),
                texto(item.categoria),
                texto(item.preco_promocional || item.preco),
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <button
                  key={String(item.id)}
                  type="button"
                  onClick={() => setSelecionadoId(String(item.id))}
                  className={`rounded-2xl border p-4 text-left transition ${
                    ativo
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{texto(item.nome) || "Produto sem nome"}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {resumo || texto(item.descricao) || "Sem resumo preenchido"}
                      </p>
                    </div>
                    {ativo ? <CheckCircle2 className="size-5 shrink-0 text-primary" /> : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="font-medium">Nenhum produto cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre o primeiro produto manualmente para iniciar uma produção.
            </p>
            <Button className="mt-4 gap-2" onClick={() => navigate({ to: "/produtos/novo" })}>
              <PackagePlus className="size-4" />
              Cadastrar primeiro produto
            </Button>
          </div>
        )}
      </section>

      {selecionado?.id ? (
        <section className="surface p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">{texto(selecionado.nome)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {[
                  texto(selecionado.marca),
                  texto(selecionado.categoria),
                  texto(selecionado.preco_promocional || selecionado.preco),
                ]
                  .filter(Boolean)
                  .join(" · ") || "Produto cadastrado manualmente"}
              </p>
            </div>
            <Badge variant="outline">CADASTRO MANUAL</Badge>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {texto(selecionado.descricao) || "Não informada"}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3 sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Benefícios</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">
                {texto(selecionado.beneficios) || "Não informados"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate({ to: "/produtos/$id", params: { id: String(selecionado.id) } })
              }
            >
              Editar produto
            </Button>
            <Button type="button" onClick={continuar}>
              Continuar com este produto
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
