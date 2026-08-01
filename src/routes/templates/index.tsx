import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { CopyButton } from "@/components/CopyButton";
import { AreaField, TextField } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VARIAVEIS } from "@/lib/variables";
import { criar, excluir as excluirRegistro, listar } from "@/lib/queries";

export const Route = createFileRoute("/templates/")({
  head: () => ({
    meta: [
      { title: "Templates | StudioIA" },
      { name: "description", content: "Modelos reutilizáveis de ganchos, roteiros e prompts." },
      { property: "og:title", content: "Templates | StudioIA" },
      { property: "og:description", content: "Modelos reutilizáveis de ganchos, roteiros e prompts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Templates,
});

function Templates() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "roteiro", categoria: "", conteudo: "" });
  const { data, isLoading } = useQuery({ queryKey: ["templates"], queryFn: () => listar("templates") });

  async function salvar() {
    if (!form.nome.trim()) return toast.error("Dê um nome ao template.");
    try {
      await criar("templates", { ...form });
      qc.invalidateQueries({ queryKey: ["templates"] });
      setAberto(false);
      setForm({ nome: "", tipo: "roteiro", categoria: "", conteudo: "" });
      toast.success("Template salvo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  }

  async function excluir(id: string) {
    try {
      await excluirRegistro("templates", id);
      qc.invalidateQueries({ queryKey: ["templates"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao excluir.");
    }
  }

  return (
    <>
      <PageHeader
        titulo="Templates"
        descricao="Modelos com variáveis para reaproveitar entre produtos e projetos."
        acoes={
          <Button className="gap-2" onClick={() => setAberto(true)}>
            <Plus className="size-4" /> Novo template
          </Button>
        }
      />

      <div className="mb-6 rounded-2xl border border-border bg-card/60 p-4">
        <h2 className="text-sm font-semibold">Variáveis disponíveis</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {VARIAVEIS.map((v) => (
            <Badge key={v} variant="outline" className="font-mono text-[11px]">
              {v}
            </Badge>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon={FileText}
          titulo="Nenhum template salvo"
          descricao="Salve estruturas de gancho, roteiro ou prompt para reutilizar depois."
          acao={<Button onClick={() => setAberto(true)}>Criar template</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {data?.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold">{t.nome}</h3>
                  <p className="text-xs text-muted-foreground">
                    {[t.tipo, t.categoria].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <CopyButton value={t.conteudo} size="icon" />
                  <button aria-label="Excluir template" className="touch-target" onClick={() => excluir(t.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </button>
                </div>
              </div>
              <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                {t.conteudo}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo template</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <TextField label="Nome" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <TextField label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} />
            <TextField
              label="Categoria"
              value={form.categoria}
              onChange={(v) => setForm({ ...form, categoria: v })}
            />
            <AreaField
              label="Conteúdo"
              rows={8}
              hint="Use variáveis entre chaves duplas para preencher automaticamente."
              value={form.conteudo}
              onChange={(v) => setForm({ ...form, conteudo: v })}
            />
          </div>
          <DialogFooter>
            <Button onClick={salvar}>Salvar template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}