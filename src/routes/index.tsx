import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FolderKanban, Package, Plus, ScrollText, Search, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contar, formatarData, listar } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | StudioIA" },
      { name: "description", content: "Acompanhe seus projetos, produtos, personagens e cenários." },
      { property: "og:title", content: "Dashboard | StudioIA" },
      { property: "og:description", content: "Acompanhe seus projetos, produtos, personagens e cenários." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");

  const projetos = useQuery({ queryKey: ["projects"], queryFn: () => listar("projects") });
  const produtos = useQuery({ queryKey: ["products"], queryFn: () => listar("products") });
  const personagens = useQuery({ queryKey: ["characters"], queryFn: () => listar("characters") });
  const cenarios = useQuery({ queryKey: ["scenarios"], queryFn: () => listar("scenarios") });
  const roteiros = useQuery({
    queryKey: ["scripts-count"],
    queryFn: () => contar("scripts"),
  });

  const lista = useMemo(() => {
    const todos = projetos.data ?? [];
    return todos.filter((p) => {
      const okBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
      const okStatus = status === "todos" || p.status === status;
      return okBusca && okStatus;
    });
  }, [projetos.data, busca, status]);

  const emAndamento = (projetos.data ?? []).filter((p) => p.status !== "finalizado" && p.status !== "arquivado").length;
  const finalizados = (projetos.data ?? []).filter((p) => p.status === "finalizado").length;

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        descricao="Sua central de produção de vídeos para TikTok Shop."
        acoes={
          <Button asChild className="gap-2">
            <Link to="/projetos/novo">
              <Plus className="size-4" /> Criar novo vídeo
            </Link>
          </Button>
        }
      />

      {/* Bento fluido: 2 col no mobile, cresce por ponto de quebra do conteúdo */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metrica indice={0} titulo="Projetos" valor={projetos.data?.length} icon={FolderKanban} to="/projetos" />
        <Metrica indice={1} titulo="Produtos" valor={produtos.data?.length} icon={Package} to="/produtos" />
        <Metrica indice={2} titulo="Personagens" valor={personagens.data?.length} icon={Users} to="/personagens" />
        <Metrica indice={3} titulo="Cenários" valor={cenarios.data?.length} icon={Sparkles} to="/cenarios" />
        <Metrica indice={4} titulo="Roteiros gerados" valor={roteiros.data} icon={ScrollText} />
        <Metrica
          indice={5}
          titulo="Em andamento"
          valor={emAndamento}
          sub={`${finalizados} finalizados`}
          icon={FolderKanban}
        />
      </div>

      <section className="mt-[clamp(2.5rem,6vw,4rem)]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Projetos recentes</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar projeto"
                className="h-11 w-full pl-9 sm:w-56"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11 w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {projetos.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            titulo={projetos.data?.length ? "Nenhum projeto com esses filtros" : "Nenhum projeto ainda"}
            descricao={
              projetos.data?.length
                ? "Ajuste a busca ou o filtro de status para ver seus projetos."
                : "Crie seu primeiro projeto para gerar estratégia, roteiro e prompts de imagem e vídeo."
            }
            acao={
              <Button asChild>
                <Link to="/projetos/novo">Criar novo vídeo</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.slice(0, 9).map((p, i) => (
              <Link
                key={p.id}
                to="/projetos/$id"
                params={{ id: p.id }}
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                className="surface stagger interactive group p-5 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold transition-colors duration-300 group-hover:text-primary">{p.nome}</h3>
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {String(p.status).replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {p.duracao}s · {p.formato} · {p.objetivo || "sem objetivo definido"}
                </p>
                <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70">
                  Atualizado em {formatarData(p.updated_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {personagens.data?.length === 0 ? (
        <div className="glass mt-10 rounded-2xl border border-border p-6 text-sm leading-relaxed text-muted-foreground">
          Nenhuma personagem cadastrada. As personagens serão adicionadas na próxima etapa de configuração.
        </div>
      ) : null}
    </>
  );
}

function Metrica({
  titulo,
  valor,
  sub,
  icon: Icon,
  to,
  indice = 0,
}: {
  titulo: string;
  valor?: number;
  sub?: string;
  icon: typeof FolderKanban;
  to?: "/projetos" | "/produtos" | "/personagens" | "/cenarios";
  indice?: number;
}) {
  const conteudo = (
    <div className="surface interactive h-full p-5 hover:border-primary/35 hover:shadow-lift">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{titulo}</span>
        <Icon className="size-4 text-accent transition-transform duration-500 group-hover:scale-110" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] tabular-nums">{valor ?? "—"}</p>
      {sub ? <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
  const estilo = { animationDelay: `${indice * 60}ms` };
  return to ? (
    <Link to={to} style={estilo} className="stagger group block interactive hover:-translate-y-1">
      {conteudo}
    </Link>
  ) : (
    <div style={estilo} className="stagger group">
      {conteudo}
    </div>
  );
}