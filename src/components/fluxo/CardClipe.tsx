/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, RefreshCw, Scissors } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const AVISO_CONTINUIDADE =
  "Depois de gerar o clipe anterior no Google Flow, salve o último frame e use-o como primeiro frame do próximo clipe.";

export function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <p className="text-xs leading-relaxed">
      <span className="text-muted-foreground">{rotulo}: </span>
      <span className="break-words">{valor}</span>
    </p>
  );
}

export function CardClipe({
  clipe,
  total,
  carregando,
  onRegerar,
  onUnir,
  onSeparar,
}: {
  clipe: any;
  total: number;
  carregando: boolean;
  onRegerar: (instrucao?: string) => void;
  onUnir: () => void;
  onSeparar: () => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-secondary/30 p-3">
      <header className="flex items-center justify-between gap-2">
        <h5 className="text-sm font-semibold">
          CLIPE {clipe.ordem} — {clipe.duracao} segundos
        </h5>
        <Badge variant="secondary" className="shrink-0">
          {Number(clipe.duracao_estimada ?? 0).toFixed(1)}s de conteúdo
        </Badge>
      </header>

      <div className="mt-2 space-y-1">
        <Linha rotulo="Fala" valor={clipe.fala} />
        <Linha rotulo="Ação" valor={clipe.acao} />
        <Linha rotulo="Gesto" valor={clipe.gesto} />
        <Linha rotulo="Expressão" valor={clipe.expressao} />
        <Linha rotulo="Produto" valor={clipe.posicao_produto} />
        <Linha rotulo="Câmera" valor={clipe.camera} />
        <Linha rotulo="Estado inicial" valor={clipe.estado_inicial} />
        <Linha rotulo="Estado final" valor={clipe.estado_final} />
        <Linha rotulo="Ligação com o próximo" valor={clipe.ligacao_proximo} />
      </div>

      {clipe.ordem > 1 ? (
        <p className="mt-2 rounded-lg bg-primary/10 p-2 text-[11px] text-primary">
          {AVISO_CONTINUIDADE}
        </p>
      ) : (
        <p className="mt-2 rounded-lg bg-secondary/60 p-2 text-[11px] text-muted-foreground">
          Use a foto enviada como primeiro frame deste clipe.
        </p>
      )}

      {clipe.prompt_flow ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Prompt para o Flow
            </span>
            <CopyButton value={clipe.prompt_flow} label="Copiar prompt" />
          </div>
          <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background/60 p-3 text-[11px] leading-relaxed">
            {clipe.prompt_flow}
          </pre>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={carregando} onClick={() => onRegerar()}>
          {carregando ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          REGENERAR CLIPE
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={carregando}
          onClick={() =>
            onRegerar(
              "Encurte a fala deste clipe mantendo o sentido, para caber com folga na duração.",
            )
          }
        >
          ENCURTAR FALA
        </Button>
        {clipe.ordem > 1 ? (
          <Button size="sm" variant="ghost" disabled={carregando} onClick={onUnir}>
            UNIR COM O ANTERIOR
          </Button>
        ) : null}
        {total >= 1 ? (
          <Button size="sm" variant="ghost" disabled={carregando} onClick={onSeparar}>
            <Scissors className="size-3.5" />
            SEPARAR EM MAIS CLIPES
          </Button>
        ) : null}
      </div>
    </article>
  );
}
