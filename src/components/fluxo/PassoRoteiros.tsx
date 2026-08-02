/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Check, Clock, Film, Loader2, Pencil, RefreshCw, Save, X } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { editarRoteiroTexto, regerarRoteiroVariante } from "@/lib/fluxo.functions";

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
  onAprovar,
  gerandoTudo,
  aprovando,
}: {
  projectId: string;
  resultados: any[];
  onAtualizar: () => void;
  onRegerarTudo: () => void;
  onAprovar: (scriptId: string) => void;
  gerandoTudo?: boolean;
  aprovando?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Seus 3 roteiros</h2>
          <p className="text-sm text-muted-foreground">
            Compare, ajuste e aprove um roteiro para preparar os clipes.
          </p>
        </div>
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
          <CardRoteiro
            key={r.script.id}
            projectId={projectId}
            item={r}
            onAtualizar={onAtualizar}
            onAprovar={onAprovar}
            aprovando={aprovando}
          />
        ))}
      </div>
    </div>
  );
}

function CardRoteiro({
  projectId,
  item,
  onAtualizar,
  onAprovar,
  aprovando,
}: {
  projectId: string;
  item: any;
  onAtualizar: () => void;
  onAprovar: (scriptId: string) => void;
  aprovando?: boolean;
}) {
  const [carregando, setCarregando] = useState(false);
  const [instrucao, setInstrucao] = useState("");
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [rascunho, setRascunho] = useState({ roteiro_completo: "", dialogo: "" });
  const s = item.script;
  const medida = item.medida ?? {};

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

  function abrirEdicao() {
    setRascunho({
      roteiro_completo: String(s.roteiro_completo ?? ""),
      dialogo: String(s.dialogo ?? ""),
    });
    setEditando(true);
  }

  async function salvarEdicao() {
    setSalvando(true);
    try {
      await editarRoteiroTexto({ data: { projectId, scriptId: s.id, campos: rascunho } });
      setEditando(false);
      onAtualizar();
      toast.success("Roteiro salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar o roteiro.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <article className="surface flex flex-col gap-4 p-4 sm:p-5">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 break-words font-semibold">{s.angulo_nome || s.rotulo}</h3>
          <Badge variant={s.aprovado ? "default" : "secondary"} className="shrink-0">
            {s.aprovado ? "APROVADO" : `#${s.variante ?? s.versao}`}
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
            Divisão prevista: {medida.num_clipes ?? s.num_clipes ?? 0} clipes
          </p>
        </div>
      </header>

      {editando ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Roteiro
            </label>
            <Textarea
              rows={10}
              className="text-xs"
              value={rascunho.roteiro_completo}
              onChange={(e) => setRascunho((r) => ({ ...r, roteiro_completo: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Fala exata
            </label>
            <Textarea
              rows={6}
              className="text-xs"
              value={rascunho.dialogo}
              onChange={(e) => setRascunho((r) => ({ ...r, dialogo: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={salvando} onClick={salvarEdicao}>
              {salvando ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              SALVAR EDIÇÃO
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={salvando}
              onClick={() => setEditando(false)}
            >
              <X className="size-3.5" /> CANCELAR
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Bloco titulo="Roteiro" texto={s.roteiro_completo} />
          <Bloco titulo="Fala exata" texto={s.dialogo} />
        </>
      )}

      <div className="mt-auto space-y-3">
        <Button
          className="h-12 w-full gap-2"
          variant={s.aprovado ? "secondary" : "default"}
          disabled={aprovando || carregando}
          onClick={() => onAprovar(s.id)}
        >
          <Check className="size-4" />
          {s.aprovado ? "ROTEIRO APROVADO" : "APROVAR ESTE ROTEIRO"}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={carregando} onClick={abrirEdicao}>
            <Pencil className="size-3.5" /> EDITAR TEXTO
          </Button>
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
