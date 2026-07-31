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

export const Route = createFileRoute("/projetos/")({
  head: () => ({
    meta: [
      { title: "Projetos | StudioIA" },
      { name: "description", content: "Todos os seus vídeos em produção, com estratégia, roteiro e prompts." },
      { property: "og:title", content: "Projetos | StudioIA" },
      { property: "og:description", content: "Todos os seus vídeos em produção, com estratégia, roteiro e prompts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Projetos,
});

function Projetos() {
  const [busca, setBusca] = useState("");
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => listar("projects") });

  const lista = (data ?? []).filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  async function excluir(id: string) {
    try {
      await excluirRegistro("projects", id);
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto excluído.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  }

  return (
    <>
      <PageHeader
        titulo="Projetos"
        descricao="Cada projeto reúne produto, personagem, cenário, estratégia, roteiro e prompts."
        acoes={
          <Button asChild className="gap-2">
            <Link to="/projetos/novo">
              <Plus className="size-4" /> Criar novo vídeo
            </Link>
          </Button>
        }
      />

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar projeto"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : lista.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          titulo="Nenhum projeto por aqui"
          descricao="Crie um projeto para gerar a estratégia, o roteiro e os prompts de imagem e vídeo."
          acao={
            <Button asChild>
              <Link to="/projetos/novo">Criar novo vídeo</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((p, i) => (
            <div
              key={p.id}
              style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              className="surface stagger interactive p-5 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-2">
                <Link to="/projetos/$id" params={{ id: p.id }} className="font-semibold hover:text-primary">
                  {p.nome}
                </Link>
                <button aria-label="Excluir projeto" onClick={() => excluir(p.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="secondary" className="capitalize">
                  {String(p.status).replace("_", " ")}
                </Badge>
                <Badge variant="outline">{p.duracao}s</Badge>
                <Badge variant="outline">{p.formato}</Badge>
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