import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, ImagePlus, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listar } from "@/lib/queries";
import { recomendarPersonagem } from "@/lib/recomendacao";
import { cn } from "@/lib/utils";

export function PassoPersonagem({
  produto,
  selecionada,
  onSelecionar,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  produto: Record<string, any> | null;
  selecionada: string | null;
  onSelecionar: (id: string, nome: string, motivo?: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: () => listar("characters"),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-64 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        icon={Users}
        titulo="Nenhuma personagem cadastrada"
        descricao="Cadastre suas influenciadoras (Isabela, Júlia, Camila, Marina e Manu) para começar a criar vídeos."
        acao={
          <Button asChild>
            <Link to="/personagens">Cadastrar personagens</Link>
          </Button>
        }
      />
    );
  }

  const { personagem: recomendada, motivo } = recomendarPersonagem(produto, data);
  const nomeRecomendada = recomendada?.nome_exibicao || recomendada?.nome || "";

  return (
    <div className="space-y-5">
      {recomendada ? (
        <section className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm">
            <span className="font-semibold">Recomendamos {String(nomeRecomendada)}</span>{" "}
            <span className="text-muted-foreground">porque {motivo}</span>
          </p>
          <Button
            className="min-h-11 shrink-0"
            variant={selecionada === recomendada.id ? "secondary" : "default"}
            onClick={() =>
              onSelecionar(
                String(recomendada.id),
                String(nomeRecomendada),
                `Recomendada porque ${motivo}`,
              )
            }
          >
            {selecionada === recomendada.id ? "PERSONAGEM SELECIONADA" : "USAR A RECOMENDADA"}
          </Button>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p) => {
          const ativa = p.id === selecionada;
          return (
            <div
              key={p.id}
              className={cn(
                "surface flex flex-col overflow-hidden p-0 interactive",
                ativa
                  ? "border-primary shadow-lift ring-1 ring-primary/40"
                  : "hover:border-primary/40",
              )}
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-secondary/60">
                {p.foto_canonica_principal ? (
                  <img
                    src={p.foto_canonica_principal}
                    alt={`Foto de ${p.nome_exibicao || p.nome}`}
                    loading="lazy"
                    className="size-full object-contain"
                  />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
                    <ImagePlus className="size-7" />
                    <p className="text-xs">Foto do perfil ainda não cadastrada</p>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words font-semibold">{p.nome_exibicao || p.nome}</h3>
                  {ativa ? <Check className="size-4 shrink-0 text-primary" /> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {[p.nicho, p.idade ? `${p.idade} anos` : null].filter(Boolean).join(" · ") ||
                    "Nicho não definido"}
                </p>
                <p className="line-clamp-3 text-xs text-muted-foreground">
                  {p.biografia || "Biografia ainda não cadastrada."}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground/80">
                  {p.tipo_comunicacao || p.personalidade || ""}
                </p>
                {!p.foto_canonica_principal ? (
                  <div className="rounded-xl border border-border bg-secondary/40 p-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Foto do perfil ainda não cadastrada.
                    </p>
                    <Button asChild size="sm" variant="outline" className="mt-2 min-h-11 w-full">
                      <Link to="/personagens/$id" params={{ id: p.id }}>
                        CADASTRAR FOTO AGORA
                      </Link>
                    </Button>
                  </div>
                ) : null}
                <Button
                  className="mt-auto min-h-11 w-full"
                  variant={ativa ? "default" : "outline"}
                  onClick={() =>
                    onSelecionar(
                      p.id,
                      p.nome_exibicao || p.nome || "",
                      p.id === recomendada?.id ? `Recomendada porque ${motivo}` : "Escolha manual",
                    )
                  }
                >
                  {ativa ? "PERSONAGEM SELECIONADA" : "USAR ESTA PERSONAGEM"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
