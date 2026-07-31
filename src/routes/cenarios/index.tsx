import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { AreaField, Field, TextField } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AMBIENTES, ENQUADRAMENTOS, ESTILOS_CENARIO, HORARIOS, ILUMINACOES } from "@/lib/variables";
import { criar, excluir as excluirRegistro, listar } from "@/lib/queries";

export const Route = createFileRoute("/cenarios/")({
  head: () => ({
    meta: [
      { title: "Cenários | StudioIA" },
      { name: "description", content: "Cadastre ambientes, luz e enquadramento para as gravações." },
      { property: "og:title", content: "Cenários | StudioIA" },
      { property: "og:description", content: "Cadastre ambientes, luz e enquadramento para as gravações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cenarios,
});

const VAZIO = {
  nome: "",
  descricao: "",
  ambiente: "Interno",
  horario: "Manhã",
  iluminacao: "Natural",
  enquadramento: "Plano médio",
  estilo: "Simples",
  objetos: "",
  regras: "",
  pessoas_ao_fundo: false,
};

function Cenarios() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["scenarios"], queryFn: () => listar("scenarios") });

  async function salvar() {
    if (!form.nome.trim()) return toast.error("Dê um nome ao cenário.");
    setSalvando(true);
    try {
      await criar("scenarios", { ...form });
      qc.invalidateQueries({ queryKey: ["scenarios"] });
      setAberto(false);
      setForm(VAZIO);
      toast.success("Cenário criado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(id: string) {
    try {
      await excluirRegistro("scenarios", id);
      qc.invalidateQueries({ queryKey: ["scenarios"] });
      toast.success("Cenário excluído.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  }

  return (
    <>
      <PageHeader
        titulo="Cenários"
        descricao="Ambientes reutilizáveis para manter consistência entre os vídeos."
        acoes={
          <Button className="gap-2" onClick={() => setAberto(true)}>
            <Plus className="size-4" /> Novo cenário
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Sparkles}
          titulo="Nenhum cenário cadastrado"
          descricao="Crie cenários com ambiente, iluminação e enquadramento para reutilizar nos projetos."
          acao={<Button onClick={() => setAberto(true)}>Criar cenário</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{c.nome}</h3>
                <button aria-label="Excluir cenário" onClick={() => excluir(c.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {[c.ambiente, c.horario, c.iluminacao, c.enquadramento].filter(Boolean).join(" · ")}
              </p>
              {c.descricao ? <p className="mt-2 line-clamp-3 text-sm">{c.descricao}</p> : null}
            </div>
          ))}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo cenário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <TextField label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <AreaField
              label="Descrição"
              value={form.descricao}
              onChange={(v) => setForm({ ...form, descricao: v })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Selecao
                label="Ambiente"
                valor={form.ambiente}
                opcoes={AMBIENTES}
                onChange={(v) => setForm({ ...form, ambiente: v })}
              />
              <Selecao
                label="Horário"
                valor={form.horario}
                opcoes={HORARIOS}
                onChange={(v) => setForm({ ...form, horario: v })}
              />
              <Selecao
                label="Iluminação"
                valor={form.iluminacao}
                opcoes={ILUMINACOES}
                onChange={(v) => setForm({ ...form, iluminacao: v })}
              />
              <Selecao
                label="Enquadramento"
                valor={form.enquadramento}
                opcoes={ENQUADRAMENTOS}
                onChange={(v) => setForm({ ...form, enquadramento: v })}
              />
              <Selecao
                label="Estilo"
                valor={form.estilo}
                opcoes={ESTILOS_CENARIO}
                onChange={(v) => setForm({ ...form, estilo: v })}
              />
            </div>
            <TextField
              label="Objetos no ambiente"
              value={form.objetos}
              onChange={(v) => setForm({ ...form, objetos: v })}
            />
            <AreaField
              label="Regras do cenário"
              value={form.regras}
              onChange={(v) => setForm({ ...form, regras: v })}
            />
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span className="text-sm">Pessoas ao fundo</span>
              <Switch
                checked={form.pessoas_ao_fundo}
                onCheckedChange={(v) => setForm({ ...form, pessoas_ao_fundo: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={salvar} disabled={salvando}>
              Salvar cenário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Selecao({
  label,
  valor,
  opcoes,
  onChange,
}: {
  label: string;
  valor: string;
  opcoes: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <Select value={valor} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opcoes.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}