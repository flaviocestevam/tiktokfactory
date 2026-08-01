import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CTAS } from "@/lib/config";
import { cn } from "@/lib/utils";

export function PassoCta({
  valor,
  tipo,
  onMudar,
  onContinuar,
  gerando,
  compacto,
}: {
  valor: string;
  tipo: string;
  onMudar: (valor: string, tipo: string) => void;
  onContinuar: () => void;
  gerando?: boolean;
  compacto?: boolean;
}) {
  const [personalizado, setPersonalizado] = useState(tipo === "personalizado" ? valor : "");

  return (
    <section className={cn("surface p-4 sm:p-6", compacto && "p-4 sm:p-4")}>
      <h2 className={cn("font-semibold", compacto ? "text-base" : "text-lg")}>
        Chamada final do vídeo
      </h2>
      {compacto ? null : (
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha como a personagem vai encerrar o vídeo. A IA aplica a chamada nos três roteiros.
        </p>
      )}

      <div className={cn("grid gap-2 sm:grid-cols-2", compacto ? "mt-3" : "mt-5")}>
        <button
          type="button"
          onClick={() => onMudar("", "auto")}
          className={cn(
            "min-h-11 rounded-xl border px-4 py-3 text-left text-sm font-medium interactive",
            tipo === "auto" ? "border-primary bg-primary/12 text-primary" : "border-border bg-card",
          )}
        >
          DEIXAR A IA ESCOLHER
        </button>
        {CTAS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onMudar(c, "predefinido")}
            className={cn(
              "min-h-11 rounded-xl border px-4 py-3 text-left text-sm font-medium interactive",
              tipo === "predefinido" && valor === c
                ? "border-primary bg-primary/12 text-primary"
                : "border-border bg-card",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={cn("space-y-2", compacto ? "mt-3" : "mt-5")}>
        <label className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Chamada personalizada
        </label>
        <Input
          value={personalizado}
          className="h-11"
          placeholder="Escreva a sua própria chamada final"
          onChange={(e) => {
            setPersonalizado(e.target.value);
            onMudar(e.target.value, e.target.value.trim() ? "personalizado" : "auto");
          }}
        />
      </div>

      <Button
        className={cn("w-full sm:w-auto", compacto ? "mt-4 h-11" : "mt-6 h-12 text-base")}
        disabled={gerando}
        onClick={onContinuar}
      >
        {gerando
          ? "GERANDO ROTEIROS..."
          : compacto
            ? "GERAR NOVOS ROTEIROS COM ESTA CHAMADA"
            : "GERAR OS 3 ROTEIROS"}
      </Button>
    </section>
  );
}
