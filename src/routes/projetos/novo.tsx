import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { AreaField, Field, TextField } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AVISO_SEM_PERSONAGEM,
  DURACOES,
  ESTILOS_VIDEO,
  NIVEIS,
  OBJETIVOS,
  TONS_LINGUAGEM,
} from "@/lib/variables";
import { criar, listar } from "@/lib/queries";

export const Route = createFileRoute("/projetos/novo")({
  head: () => ({
    meta: [
      { title: "Criar novo vídeo | TikTok Factory" },
      { name: "description", content: "Monte um projeto escolhendo produto, cenário, duração e objetivo." },
      { property: "og:title", content: "Criar novo vídeo | TikTok Factory" },
      { property: "og:description", content: "Monte um projeto escolhendo produto, cenário, duração e objetivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NovoProjeto,
});

function NovoProjeto() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const produtos = useQuery({ queryKey: ["products"], queryFn: () => listar("products") });
  const cenarios = useQuery({ queryKey: ["scenarios"], queryFn: () => listar("scenarios") });
  const personagens = useQuery({ queryKey: ["characters"], queryFn: () => listar("characters") });

  const [form, setForm] = useState({
    nome: "",
    product_id: "",
    character_id: "",
    scenario_id: "",
    cenario_texto: "",
    duracao: 30,
    formato: "9:16",
    plataforma: "TikTok Shop",
    objetivo: OBJETIVOS[1] as string,
    estilo: ESTILOS_VIDEO[0] as string,
    tom_linguagem: TONS_LINGUAGEM[0] as string,
    nivel_energia: "Médio",
    velocidade_fala: "Médio",
    observacoes: "",
  });

  async function salvar() {
    if (!form.nome.trim()) return toast.error("Dê um nome ao projeto.");
    if (!form.product_id) return toast.error("Selecione um produto.");
    setSalvando(true);
    try {
      const data = await criar("projects", {
          nome: form.nome.trim(),
          product_id: form.product_id,
          character_id: form.character_id || null,
          scenario_id: form.scenario_id || null,
          cenario_texto: form.cenario_texto || null,
          duracao: form.duracao,
          formato: form.formato,
          plataforma: form.plataforma,
          objetivo: form.objetivo,
          estilo: form.estilo,
          tom_linguagem: form.tom_linguagem,
          nivel_energia: form.nivel_energia,
          velocidade_fala: form.velocidade_fala,
          observacoes: form.observacoes || null,
          status: "em_andamento",
      });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto criado.");
      navigate({ to: "/projetos/$id", params: { id: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar projeto.");
    } finally {
      setSalvando(false);
    }
  }

  const semProduto = (produtos.data?.length ?? 0) === 0;

  return (
    <>
      <PageHeader titulo="Criar novo vídeo" descricao="Defina a base do projeto antes de gerar o conteúdo." />

      {(personagens.data?.length ?? 0) === 0 ? (
        <Alert className="mb-6">
          <AlertDescription>{AVISO_SEM_PERSONAGEM}</AlertDescription>
        </Alert>
      ) : null}

      {semProduto ? (
        <Alert className="mb-6">
          <AlertDescription>
            Você ainda não tem produtos.{" "}
            <Link to="/produtos/novo" className="font-medium text-primary underline">
              Cadastre um produto
            </Link>{" "}
            para começar.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-semibold">Base do projeto</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Nome do projeto" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
            <Field label="Produto">
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {produtos.data?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Personagem">
              <Select
                value={form.character_id || "nenhuma"}
                onValueChange={(v) => setForm({ ...form, character_id: v === "nenhuma" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">A definir depois</SelectItem>
                  {personagens.data?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome_exibicao || c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Cenário">
              <Select
                value={form.scenario_id || "nenhum"}
                onValueChange={(v) => setForm({ ...form, scenario_id: v === "nenhum" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Descrever manualmente</SelectItem>
                  {cenarios.data?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          {!form.scenario_id ? (
            <div className="mt-4">
              <AreaField
                label="Descrição do cenário"
                rows={3}
                value={form.cenario_texto}
                onChange={(v) => setForm({ ...form, cenario_texto: v })}
              />
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <h2 className="mb-4 text-base font-semibold">Configuração do vídeo</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Duração">
              <Select
                value={String(form.duracao)}
                onValueChange={(v) => setForm({ ...form, duracao: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURACOES.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} segundos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Opcao
              label="Objetivo"
              valor={form.objetivo}
              opcoes={OBJETIVOS}
              onChange={(v) => setForm({ ...form, objetivo: v })}
            />
            <Opcao
              label="Estilo do vídeo"
              valor={form.estilo}
              opcoes={ESTILOS_VIDEO}
              onChange={(v) => setForm({ ...form, estilo: v })}
            />
            <Opcao
              label="Tom de linguagem"
              valor={form.tom_linguagem}
              opcoes={TONS_LINGUAGEM}
              onChange={(v) => setForm({ ...form, tom_linguagem: v })}
            />
            <Opcao
              label="Nível de energia"
              valor={form.nivel_energia}
              opcoes={NIVEIS}
              onChange={(v) => setForm({ ...form, nivel_energia: v })}
            />
            <Opcao
              label="Velocidade de fala"
              valor={form.velocidade_fala}
              opcoes={NIVEIS}
              onChange={(v) => setForm({ ...form, velocidade_fala: v })}
            />
            <Opcao
              label="Formato"
              valor={form.formato}
              opcoes={["9:16", "1:1", "16:9"]}
              onChange={(v) => setForm({ ...form, formato: v })}
            />
          </div>
          <div className="mt-4">
            <AreaField
              label="Observações para a IA"
              rows={3}
              value={form.observacoes}
              onChange={(v) => setForm({ ...form, observacoes: v })}
            />
          </div>
        </section>

        <div className="flex justify-stretch sm:justify-end">
          <Button onClick={salvar} disabled={salvando || semProduto} className="h-11 w-full gap-2 sm:w-auto">
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
            Criar projeto
          </Button>
        </div>
      </div>
    </>
  );
}

function Opcao({
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