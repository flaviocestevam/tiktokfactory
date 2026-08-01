/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { excluir as excluirRegistro, formatarData, listar } from "@/lib/queries";
import { ROTULO_STATUS } from "@/lib/config";

const DESCRICAO =
  "Todas as produções criadas na TikTok Factory, com produto, personagem, foto, roteiro aprovado e clipes.";

export const Route = createFileRoute("/producoes/")({
  head: () => ({
    meta: [
      { title: "Produções | TikTok Factory" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Produções | TikTok Factory" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Producoes,
});

function Producoes() {
  const [busca, setBusca] = useState("");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listar("projects", undefined, { coluna: "updated_at", asc: false }),
  });

  const lista = (data ?? []).filter((p: any) =>
    String(p.nome ?? "")
      .toLowerCase()
      .includes(busca.toLowerCase()),
  );

  async function excluir(id: string) {
    try {
      await excluirRegistro("projects", id);
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Produção excluída.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  }

  return (
    <>
      <PageHeader
        titulo="Produções"
        descricao={DESCRICAO}
        acoes={
          <Button asChild className="gap-2">
            <Link to="/">
              <Plus className="size-4" /> Criar conteúdo
            </Link>
          </Button>
        }
      />

      <div className="relative mb-5 w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produção"
          className="h-11 pl-9"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : lista.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          titulo="Nenhuma produção ainda"
          descricao="Analise um produto do TikTok Shop para começar a primeira produção."
          acao={
            <Button asChild>
              <Link to="/">Criar conteúdo</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {lista.map((p: any, i: number) => (
            <div
              key={p.id}
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              className="surface stagger interactive p-5 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <Link
                  to="/producoes/$id"
                  params={{ id: p.id }}
                  className="min-w-0 break-words font-semibold hover:text-primary"
                >
                  {p.nome}
                </Link>
                <button
                  aria-label="Excluir produção"
                  className="touch-target -m-2 shrink-0"
                  onClick={() => excluir(p.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {ROTULO_STATUS[String(p.status)] ?? String(p.status)}
                </Badge>
                <Badge variant="outline">Etapa {p.etapa ?? 1}</Badge>
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70">
                Atualizado em {formatarData(p.updated_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
