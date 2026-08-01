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
}: {
  valor: string;
  tipo: string;
  onMudar: (valor: string, tipo: string) => void;
  onContinuar: () => void;
  gerando?: boolean;
}) {
  const [personalizado, setPersonalizado] = useState(tipo === "personalizado" ? valor : "");

  return (
    <section className="surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Chamada final do vídeo</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Escolha como a personagem vai encerrar o vídeo. A IA aplica a chamada nos três roteiros.
      </p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
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

      <div className="mt-5 space-y-2">
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
        className="mt-6 h-12 w-full text-base sm:w-auto"
        disabled={gerando}
        onClick={onContinuar}
      >
        {gerando ? "GERANDO ROTEIROS..." : "GERAR OS 3 ROTEIROS"}
      </Button>
    </section>
  );
}
