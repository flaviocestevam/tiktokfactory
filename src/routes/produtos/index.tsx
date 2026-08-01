import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { excluir as excluirRegistro, formatarData, listar } from "@/lib/queries";

export const Route = createFileRoute("/produtos/")({
  head: () => ({
    meta: [
      { title: "Produtos | TikTok Factory" },
      { name: "description", content: "Cadastre e organize os produtos usados nos seus vídeos." },
      { property: "og:title", content: "Produtos | TikTok Factory" },
      {
        property: "og:description",
        content: "Cadastre e organize os produtos usados nos seus vídeos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Produtos,
});

function Produtos() {
  const [busca, setBusca] = useState("");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => listar("products"),
  });

  const lista = (data ?? []).filter((p) =>
    `${p.nome} ${p.marca ?? ""} ${p.categoria ?? ""}`.toLowerCase().includes(busca.toLowerCase()),
  );

  async function excluir(id: string) {
    try {
      await excluirRegistro("products", id);
      toast.success("Produto excluído.");
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  }

  return (
    <>
      <PageHeader
        titulo="Produtos"
        descricao="Os dados aqui são a base de tudo que a IA vai escrever."
        acoes={
          <Button asChild className="gap-2">
            <Link to="/produtos/novo">
              <Plus className="size-4" /> Novo produto
            </Link>
          </Button>
        }
      />

      <div className="relative mb-5 w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, marca ou categoria"
          className="h-11 pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <EmptyState
          icon={Package}
          titulo={data?.length ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
          descricao="Cadastre um produto colando o link da página de vendas ou preenchendo os campos manualmente."
          acao={
            <Button asChild>
              <Link to="/produtos/novo">Cadastrar produto</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {lista.map((p) => {
            const imagens = Array.isArray(p.imagens) ? (p.imagens as string[]) : [];
            return (
              <div key={p.id} className="group rounded-2xl border border-border bg-card p-4">
                <div className="flex gap-3">
                  {imagens[0] ? (
                    <img
                      src={imagens[0]}
                      alt={`Imagem de ${p.nome}`}
                      loading="lazy"
                      className="size-16 shrink-0 rounded-lg border border-border object-cover [aspect-ratio:1]"
                    />
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Package className="size-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{p.nome}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {[p.marca, p.categoria].filter(Boolean).join(" · ") || "Sem categoria"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-accent">
                      {p.preco_promocional || p.preco || "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {p.status_extracao === "extraido" ? "extraído" : p.status_extracao}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatarData(p.updated_at)}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button asChild variant="secondary" size="sm" className="h-11 flex-1">
                    <Link to="/produtos/$id" params={{ id: p.id }}>
                      Editar
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Excluir"
                    className="size-11"
                    onClick={() => excluir(p.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
