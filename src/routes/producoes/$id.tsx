/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CardClipe } from "@/components/fluxo/CardClipe";
import { listarResultados } from "@/lib/fluxo.functions";
import { obter } from "@/lib/queries";
import { ROTULO_STATUS } from "@/lib/config";

const DESCRICAO =
  "Produto, personagem, foto, roteiro aprovado e clipes prontos para o Google Flow.";

export const Route = createFileRoute("/producoes/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes da produção | TikTok Factory" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Detalhes da produção | TikTok Factory" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Producao,
});

function Producao() {
  const { id } = Route.useParams();

  const projeto = useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const p: any = await obter("projects", id);
      const [produto, personagem] = await Promise.all([
        p?.product_id ? obter("products", p.product_id) : null,
        p?.character_id ? obter("characters", p.character_id) : null,
      ]);
      return { p, produto: produto as any, personagem: personagem as any };
    },
  });

  const resultados = useQuery({
    queryKey: ["fluxo-resultados", id],
    queryFn: () => listarResultados({ data: { projectId: id } }),
  });

  if (projeto.isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (!projeto.data?.p)
    return <p className="text-sm text-muted-foreground">Produção não encontrada.</p>;

  const { p, produto, personagem } = projeto.data;
  const lista = (resultados.data as any[]) ?? [];
  const aprovado = lista.find((r) => r.script?.aprovado) ?? lista[0] ?? null;
  const clipes: any[] = aprovado?.clipes ?? [];
  const todosPrompts = clipes
    .map((c) => `CLIPE ${c.ordem} — ${c.duracao}s\n${c.prompt_flow ?? ""}`)
    .join("\n\n———\n\n");

  return (
    <>
      <PageHeader
        titulo={p.nome}
        descricao={DESCRICAO}
        acoes={
          <Button asChild variant="outline" className="gap-2">
            <Link to="/producoes">
              <ArrowLeft className="size-4" /> Voltar
            </Link>
          </Button>
        }
      />

      <section className="surface grid gap-4 p-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        {p.reference_image_url ? (
          <img
            src={p.reference_image_url}
            alt={`Foto da produção ${p.nome}`}
            loading="lazy"
            className="h-48 w-36 rounded-xl border border-border object-cover"
          />
        ) : null}
        <div className="min-w-0 space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{ROTULO_STATUS[String(p.status)] ?? String(p.status)}</Badge>
            <Badge variant="outline">Etapa {p.etapa ?? 1}</Badge>
            {p.cta ? <Badge variant="outline">CTA: {p.cta}</Badge> : null}
          </div>
          <p>
            <span className="text-muted-foreground">Produto: </span>
            {produto?.nome ?? "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Personagem: </span>
            {personagem?.nome_exibicao || personagem?.nome || "—"}
          </p>
          {p.personagem_motivo ? (
            <p className="text-muted-foreground">{p.personagem_motivo}</p>
          ) : null}
        </div>
      </section>

      {aprovado ? (
        <section className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {aprovado.script.angulo_nome || aprovado.script.rotulo}
            </h2>
            {clipes.length ? <CopyButton value={todosPrompts} label="Copiar todos" /> : null}
          </div>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed">
            {aprovado.script.roteiro_completo}
          </pre>
          <div className="grid gap-4 xl:grid-cols-2">
            {clipes.map((c) => (
              <CardClipe
                key={c.id}
                clipe={c}
                total={clipes.length}
                carregando
                onRegerar={() => undefined}
                onUnir={() => undefined}
                onSeparar={() => undefined}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Esta produção ainda não tem roteiros gerados.
        </p>
      )}
    </>
  );
}
