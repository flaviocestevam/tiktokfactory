/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Film, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/CopyButton";
import { CardClipe } from "@/components/fluxo/CardClipe";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  editarClipeTexto,
  gerarClipesDoRoteiro,
  regerarClipeFlow,
  reorganizarClipes,
} from "@/lib/fluxo.functions";
import { FLOW_CLIP_DURATIONS } from "@/lib/config";

export function PassoClipes({
  projectId,
  item,
  onAtualizar,
}: {
  projectId: string;
  item: any | null;
  onAtualizar: () => void;
}) {
  const [carregando, setCarregando] = useState(false);

  if (!item) {
    return (
      <section className="surface p-6 text-sm text-muted-foreground">
        Aprove um roteiro na etapa anterior para preparar os clipes do Google Flow.
      </section>
    );
  }

  const s = item.script;
  const clipes: any[] = Array.isArray(item.clipes) ? item.clipes : [];
  const total = clipes.reduce((t, c) => t + (c.duracao ?? 0), 0);
  const todosPrompts = clipes
    .map((c) => `CLIPE ${c.ordem} — ${c.duracao}s\n${c.prompt_flow ?? ""}`)
    .join("\n\n———\n\n");

  async function executar(fn: () => Promise<unknown>, ok: string, erro: string) {
    setCarregando(true);
    try {
      await fn();
      onAtualizar();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : erro);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Clipes do roteiro aprovado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {s.angulo_nome || s.rotulo} · o vídeo é dividido em clipes de{" "}
              {FLOW_CLIP_DURATIONS.join(", ")} segundos para o Google Flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {clipes.length ? <CopyButton value={todosPrompts} label="Copiar todos" /> : null}
            <Button
              className="gap-2"
              disabled={carregando}
              onClick={() =>
                executar(
                  () => gerarClipesDoRoteiro({ data: { projectId, scriptId: s.id } }),
                  "Clipes prontos.",
                  "Falha ao preparar os clipes.",
                )
              }
            >
              {carregando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              {clipes.length ? "GERAR CLIPES NOVAMENTE" : "PREPARAR CLIPES"}
            </Button>
          </div>
        </div>

        {clipes.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="gap-1">
              <Film className="size-3.5" /> {clipes.length} clipes
            </Badge>
            <span>Vídeo completo: {total}s</span>
            <span>Montagem: {clipes.map((c) => `${c.duracao}s`).join(" + ")}</span>
            <Button
              size="sm"
              variant="secondary"
              disabled={carregando}
              onClick={() =>
                executar(
                  () =>
                    reorganizarClipes({
                      data: { projectId, scriptId: s.id, modo: "redistribuir" },
                    }),
                  "Clipes redistribuídos.",
                  "Falha ao redistribuir.",
                )
              }
            >
              REDISTRIBUIR
            </Button>
          </div>
        ) : null}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {clipes.map((c) => (
          <CardClipe
            key={c.id}
            clipe={c}
            total={clipes.length}
            carregando={carregando}
            onRegerar={(texto) =>
              executar(
                () => regerarClipeFlow({ data: { projectId, clipId: c.id, instrucao: texto } }),
                "Clipe atualizado.",
                "Falha ao regerar o clipe.",
              )
            }
            onUnir={() =>
              executar(
                () =>
                  reorganizarClipes({
                    data: { projectId, scriptId: s.id, modo: "unir", ordem: c.ordem },
                  }),
                "Clipes unidos.",
                "Falha ao unir.",
              )
            }
            onSeparar={() =>
              executar(
                () =>
                  reorganizarClipes({
                    data: { projectId, scriptId: s.id, modo: "separar", ordem: c.ordem },
                  }),
                "Clipe separado.",
                "Falha ao separar.",
              )
            }
            onSalvar={async (campos) => {
              try {
                await editarClipeTexto({ data: { projectId, clipId: c.id, campos } });
                onAtualizar();
                toast.success("Clipe salvo.");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Falha ao salvar o clipe.");
                throw e;
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
