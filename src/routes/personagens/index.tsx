import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Users } from "lucide-react";
import { toast } from "sonner";
import { removerFoto } from "@/lib/fotos";
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
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: () => listar("characters"),
  });
  const [aberta, setAberta] = useState<string | null>(null);

  const remover = useMutation({
    mutationFn: (characterId: string) => removerFoto(characterId, "canonica"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["character"] });
      toast.success("Foto removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        titulo="Personagens"
        descricao="Cinco influenciadoras virtuais com identidade fixa: nome, idade, cidade, nicho e personalidade não mudam entre campanhas. A foto do perfil serve apenas para identificar cada personagem."
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
                <div className="overflow-hidden rounded-2xl border border-border bg-secondary/40">
                  {c.foto_canonica_principal ? (
                    <img
                      src={c.foto_canonica_principal}
                      alt={`Foto do perfil de ${c.nome_exibicao || c.nome}`}
                      loading="lazy"
                      className="aspect-[3/4] w-full object-contain"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 p-6 text-center">
                      <ImagePlus className="size-7 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Foto do perfil ainda não cadastrada
                      </p>
                    </div>
                  )}
                </div>

                {c.foto_canonica_principal ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild size="sm" variant="outline" className="min-h-11">
                      <Link to="/personagens/$id" params={{ id: c.id }}>
                        EDITAR
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-11 text-destructive"
                      disabled={remover.isPending}
                      onClick={() => remover.mutate(c.id)}
                    >
                      REMOVER
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="min-h-11 w-full">
                    <Link to="/personagens/$id" params={{ id: c.id }}>
                      <ImagePlus className="size-4" /> CADASTRAR FOTO
                    </Link>
                  </Button>
                )}

                <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-semibold">
                      {c.nome_exibicao || c.nome}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {[c.nicho, c.idade ? `${c.idade} anos` : null, c.cidade_natal]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="secondary">v{c.identity_version}</Badge>
                  </div>
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
                  </div>
                ) : null}

                <div className="mt-auto space-y-2">
                  <Button
                    variant="outline"
                    className="min-h-11 w-full"
                    onClick={() => setAberta(expandida ? null : c.id)}
                  >
                    {expandida ? "OCULTAR FICHA COMPLETA" : "VER FICHA COMPLETA"}
                  </Button>
                </div>
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
      <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {titulo}
      </h3>
      <p className="text-xs leading-relaxed">{texto}</p>
    </div>
  );
}
