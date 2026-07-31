import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listar } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/personagens/")({
  head: () => ({
    meta: [
      { title: "Personagens | StudioIA" },
      { name: "description", content: "Biblioteca de personagens de IA usadas nos vídeos." },
      { property: "og:title", content: "Personagens | StudioIA" },
      { property: "og:description", content: "Biblioteca de personagens de IA usadas nos vídeos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Personagens,
});

function Personagens() {
  const { data, isLoading } = useQuery({ queryKey: ["characters"], queryFn: () => listar("characters") });

  return (
    <>
      <PageHeader
        titulo="Personagens"
        descricao="A biblioteca começa vazia. As personagens serão cadastradas em uma etapa posterior."
      />
      {isLoading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          titulo="Nenhuma personagem cadastrada"
          descricao="Os projetos criados agora usam o marcador {{PERSONAGEM_A_SER_DEFINIDA}} e poderão ser atualizados quando as personagens forem adicionadas."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{c.nome_exibicao || c.nome}</h3>
                <Badge variant="secondary" className="capitalize">
                  {c.status}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                {c.biografia || c.personalidade || "Sem biografia cadastrada."}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}