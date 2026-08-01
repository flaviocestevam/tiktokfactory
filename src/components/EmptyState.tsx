import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  titulo,
  descricao,
  acao,
}: {
  icon: LucideIcon;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}) {
  return (
    <div className="stagger flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-[clamp(1rem,5vw,2rem)] py-[clamp(2.5rem,8vw,4rem)] text-center backdrop-blur-sm">
      <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-card text-accent shadow-soft ring-1 ring-border">
        <Icon className="size-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{titulo}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{descricao}</p>
      {acao ? <div className="mt-6">{acao}</div> : null}
    </div>
  );
}