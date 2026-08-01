/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Clock, Film, Loader2, RefreshCw, Scissors } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { regerarClipeFlow, regerarRoteiroVariante, reorganizarClipes } from "@/lib/fluxo.functions";

const AVISO_CONTINUIDADE =
  "Depois de gerar o clipe anterior no Google Flow, salve o último frame e use-o como primeiro frame do próximo clipe.";

const AJUSTES = [
  { label: "MAIS CURTO", instrucao: "Reduza a fala para caber com folga na duração alvo." },
  {
    label: "MAIS PERSUASIVO",
    instrucao: "Aumente a persuasão sem inventar informações que não estejam no produto.",
  },
  { label: "OUTRO GANCHO", instrucao: "Troque completamente o gancho falado e o gancho visual." },
];

export function PassoRoteiros({
  projectId,
  resultados,
  onAtualizar,
  onRegerarTudo,
  gerandoTudo,
}: {
  projectId: string;
  resultados: any[];
  onAtualizar: () => void;
  onRegerarTudo: () => void;
  gerandoTudo?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Seus 3 roteiros</h2>
        <Button variant="outline" className="gap-2" disabled={gerandoTudo} onClick={onRegerarTudo}>
          {gerandoTudo ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          GERAR NOVAS OPÇÕES
        </Button>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {resultados.map((r) => (
          <CardRoteiro key={r.script.id} projectId={projectId} item={r} onAtualizar={onAtualizar} />
        ))}
      </div>
    </div>
  );
}

function CardRoteiro({
  projectId,
  item,
  onAtualizar,
}: {
  projectId: string;
  item: any;
  onAtualizar: () => void;
}) {
  const [carregando, setCarregando] = useState(false);
  const [instrucao, setInstrucao] = useState("");
  const s = item.script;
  const medida = item.medida ?? {};
  const clipes: any[] = Array.isArray(item.clipes) ? item.clipes : [];

  async function acaoClipes(modo: "redistribuir" | "unir" | "separar", ordem?: number) {
    setCarregando(true);
    try {
      await reorganizarClipes({ data: { projectId, scriptId: s.id, modo, ordem } });
      onAtualizar();
      toast.success("Clipes atualizados.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao reorganizar os clipes.");
    } finally {
      setCarregando(false);
    }
  }

  async function acaoClipe(clipId: string, texto?: string) {
    setCarregando(true);
    try {
      await regerarClipeFlow({ data: { projectId, clipId, instrucao: texto } });
      onAtualizar();
      toast.success("Clipe atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao regerar o clipe.");
    } finally {
      setCarregando(false);
    }
  }

  const todosPrompts = clipes
    .map((c) => `CLIPE ${c.ordem} — ${c.duracao}s\n${c.prompt_flow ?? ""}`)
    .join("\n\n———\n\n");

  async function regerar(texto?: string) {
    setCarregando(true);
    try {
      await regerarRoteiroVariante({
        data: { projectId, scriptId: s.id, instrucao: texto || instrucao || undefined },
      });
      setInstrucao("");
      onAtualizar();
      toast.success("Roteiro atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao regerar o roteiro.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <article className="surface flex flex-col gap-4 p-4 sm:p-5">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 break-words font-semibold">{s.angulo_nome || s.rotulo}</h3>
          <Badge variant="secondary" className="shrink-0">
            #{s.variante ?? s.versao}
          </Badge>
        </div>
        <div className="grid gap-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Fala: {Number(medida.duracao_fala ?? s.duracao_fala ?? 0).toFixed(1)}s · com ações:{" "}
            {Number(medida.duracao_total ?? s.duracao_total ?? 0).toFixed(1)}s ·{" "}
            {medida.palavras ?? s.palavras ?? 0} palavras
          </p>
          <p className="flex items-center gap-1.5">
            <Film className="size-3.5" />
            {clipes.length} clipes · vídeo completo:{" "}
            {medida.duracao_clipes ?? clipes.reduce((t, c) => t + (c.duracao ?? 0), 0)}s
          </p>
          {clipes.length ? (
            <p className="text-[11px] text-muted-foreground/80">
              Plano de montagem: {clipes.map((c) => `${c.duracao}s`).join(" + ")}
            </p>
          ) : null}
        </div>
      </header>

      <Bloco titulo="Roteiro" texto={s.roteiro_completo} />
      <Bloco titulo="Fala exata" texto={s.dialogo} />

      {clipes.length ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Clipes para o Google Flow
            </h4>
            <CopyButton value={todosPrompts} label="Copiar todos os prompts" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={carregando}
              onClick={() => acaoClipes("redistribuir")}
            >
              REDISTRIBUIR ROTEIRO
            </Button>
          </div>
          {clipes.map((c) => (
            <CardClipe
              key={c.id}
              clipe={c}
              total={clipes.length}
              carregando={carregando}
              onRegerar={(texto) => acaoClipe(c.id, texto)}
              onUnir={() => acaoClipes("unir", c.ordem)}
              onSeparar={() => acaoClipes("separar", c.ordem)}
            />
          ))}
        </section>
      ) : null}

      <div className="mt-auto space-y-3">
        <div className="flex flex-wrap gap-2">
          {AJUSTES.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant="secondary"
              disabled={carregando}
              onClick={() => regerar(a.instrucao)}
            >
              {a.label}
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={instrucao}
            onChange={(e) => setInstrucao(e.target.value)}
            placeholder="Peça um ajuste específico"
            className="h-11"
          />
          <Button className="h-11 gap-2" disabled={carregando} onClick={() => regerar()}>
            {carregando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            AJUSTAR
          </Button>
        </div>
      </div>
    </article>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto?: string | null }) {
  if (!texto) return null;
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {titulo}
        </h4>
        <CopyButton value={texto} size="icon" />
      </div>
      <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-secondary/40 p-3 text-xs leading-relaxed">
        {texto}
      </pre>
    </section>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <p className="text-xs leading-relaxed">
      <span className="text-muted-foreground">{rotulo}: </span>
      <span className="break-words">{valor}</span>
    </p>
  );
}

function CardClipe({
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
