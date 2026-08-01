import { ETAPAS } from "@/lib/ctas";
import { cn } from "@/lib/utils";

export function Stepper({
  atual,
  maximo,
  onIr,
}: {
  atual: number;
  maximo: number;
  onIr: (n: number) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 mb-8 flex gap-2 overflow-x-auto px-1">
      {ETAPAS.map((e) => {
        const ativo = e.numero === atual;
        const liberado = e.numero <= maximo;
        return (
          <button
            key={e.numero}
            type="button"
            disabled={!liberado}
            onClick={() => onIr(e.numero)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium interactive",
              ativo
                ? "border-primary/50 bg-primary/12 text-primary"
                : liberado
                  ? "border-border bg-card text-muted-foreground hover:text-foreground"
                  : "border-border/60 bg-card/50 text-muted-foreground/50",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                ativo ? "bg-primary text-primary-foreground" : "bg-secondary",
              )}
            >
              {e.numero}
            </span>
            {e.titulo}
          </button>
        );
      })}
    </div>
  );
}