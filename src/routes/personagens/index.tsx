import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listar } from "@/lib/queries";

export const Route = createFileRoute("/personagens/")({
  head: () => ({
    meta: [
      { title: "Personagens | TikTok Factory" },
      { name: "description", content: "Biblioteca de personagens de IA usadas nos vídeos." },
      { property: "og:title", content: "Personagens | TikTok Factory" },
      { property: "og:description", content: "Biblioteca de personagens de IA usadas nos vídeos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Personagens,
});

function Personagens() {
  const { data, isLoading } = useQuery({ queryKey: ["characters"], queryFn: () => listar("characters") });
  const [aberta, setAberta] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        titulo="Personagens"
        descricao="Cinco influenciadoras virtuais com identidade canônica fixa: nome, idade, cidade, nicho, personalidade e aparência não mudam entre campanhas."
      />
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Users}
          titulo="Nenhuma personagem cadastrada"
          descricao="Cadastre as influenciadoras para liberar a criação de roteiros e prompts."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data?.map((c) => {
            const expandida = aberta === c.id;
            return (
              <article key={c.id} className="surface flex flex-col gap-3 p-5">
                <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold">{c.nome_exibicao || c.nome}</h2>
                    <p className="text-xs text-muted-foreground">
                      {[c.nicho, c.idade ? `${c.idade} anos` : null, c.cidade_natal].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    v{c.identity_version}
                  </Badge>
                </header>

                <p className="text-sm leading-relaxed text-muted-foreground">{c.biografia}</p>

                {c.promessa_central ? (
                  <p className="rounded-xl border border-border bg-secondary/40 p-3 text-xs italic leading-relaxed">
                    “{c.promessa_central}”
                  </p>
                ) : null}

                {expandida ? (
                  <div className="space-y-3">
                    <Campo titulo="Arquétipo" texto={c.arquetipo} />
                    <Campo titulo="Personalidade" texto={c.personalidade} />
                    <Campo titulo="Tom de voz" texto={c.tipo_comunicacao} />
                    <Campo titulo="Público principal" texto={c.publico_principal} />
                    <Campo titulo="Dores do público" texto={c.dores_publico} />
                    <Campo titulo="Desejos do público" texto={c.desejos_publico} />
                    <Campo titulo="Categorias prioritárias" texto={c.categorias_prioritarias} />
                    <Campo titulo="Pilares de conteúdo" texto={c.pilares_conteudo} />
                    <Campo titulo="Vocabulário recomendado" texto={c.vocabulario} />
                    <Campo titulo="Gatilhos de persuasão" texto={c.gatilhos_persuasao} />
                    <Campo titulo="Formatos de roteiro" texto={c.formatos_roteiro} />
                    <Campo titulo="Interpretação em vídeo" texto={c.estilo_interpretacao} />
                    <Campo titulo="CTAs recomendados" texto={c.tipos_cta} />
                    <Campo titulo="Proibições" texto={c.palavras_proibidas} />
                    <div className="rounded-xl border border-primary/30 bg-primary/8 p-3">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-primary">
                        <Lock className="size-3" /> Identidade canônica protegida
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {c.identidade_visual_canonica}
                      </p>
                    </div>
                  </div>
                ) : null}

                <Button
                  variant="outline"
                  className="mt-auto w-full"
                  onClick={() => setAberta(expandida ? null : c.id)}
                >
                  {expandida ? "OCULTAR FICHA COMPLETA" : "VER FICHA COMPLETA"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Campo({ titulo, texto }: { titulo: string; texto?: string | null }) {
  if (!texto) return null;
  return (
    <div className="space-y-1">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{titulo}</h3>
      <p className="text-xs leading-relaxed">{texto}</p>
    </div>
  );
}