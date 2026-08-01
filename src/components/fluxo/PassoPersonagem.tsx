import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Check, ImagePlus, Users } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listar } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function PassoPersonagem({
  selecionada,
  onSelecionar,
}: {
  selecionada: string | null;
  onSelecionar: (id: string, nome: string) => void;
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

  return (
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
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
                  <p className="flex items-start gap-1.5 text-xs leading-relaxed">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                    Foto do perfil ainda não cadastrada. Ela serve apenas para identificar a
                    personagem e não é necessária para continuar.
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
                onClick={() => onSelecionar(p.id, p.nome_exibicao || p.nome || "")}
              >
                {ativa ? "PERSONAGEM SELECIONADA" : "USAR ESTA PERSONAGEM"}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
