import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { CopyButton } from "@/components/CopyButton";
import { EmptyState } from "@/components/EmptyState";
import { AreaField } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  gerarAlternativas,
  gerarEstrategia,
  gerarPromptImagem,
  gerarPromptVideo,
  gerarRoteiro,
} from "@/lib/generation.functions";
import { AVISO_SEM_PERSONAGEM } from "@/lib/variables";
import { baixarTexto, listar, obter } from "@/lib/queries";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/projetos/$id")({
  head: () => ({
    meta: [
      { title: "Projeto | StudioIA" },
      { name: "description", content: "Estratégia, roteiro e prompts de imagem e vídeo do seu projeto." },
      { property: "og:title", content: "Projeto | StudioIA" },
      { property: "og:description", content: "Estratégia, roteiro e prompts de imagem e vídeo do seu projeto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Projeto,
});

function Projeto() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [instrucoes, setInstrucoes] = useState("");
  const [alternativas, setAlternativas] = useState<string[]>([]);

  const fnEstrategia = useServerFn(gerarEstrategia);
  const fnRoteiro = useServerFn(gerarRoteiro);
  const fnImagem = useServerFn(gerarPromptImagem);
  const fnVideo = useServerFn(gerarPromptVideo);
  const fnAlternativas = useServerFn(gerarAlternativas);

  const projeto = useQuery({
    queryKey: ["project", id],
    queryFn: () => obter("projects", id),
  });

  const estrategia = useQuery({
    queryKey: ["strategy", id],
    queryFn: async () => (await listar("strategies", { project_id: id }))[0] ?? null,
  });

  const roteiros = useQuery({
    queryKey: ["scripts", id],
    queryFn: () => listar("scripts", { project_id: id }, { coluna: "versao", asc: false }),
  });

  const promptsImagem = useQuery({
    queryKey: ["image_prompts", id],
    queryFn: () => listar("image_prompts", { project_id: id }, { coluna: "versao", asc: false }),
  });

  const promptsVideo = useQuery({
    queryKey: ["video_prompts", id],
    queryFn: () => listar("video_prompts", { project_id: id }, { coluna: "versao", asc: false }),
  });

  async function executar(chave: string, acao: () => Promise<unknown>, chaveCache: string) {
    setOcupado(chave);
    try {
      await acao();
      qc.invalidateQueries({ queryKey: [chaveCache, id] });
      toast.success("Conteúdo gerado.");
    } catch (e) {
      toast.error(traduzirErro(e));
    } finally {
      setOcupado(null);
    }
  }

  const roteiro = roteiros.data?.[0];
  const imagem = promptsImagem.data?.[0];
  const video = promptsVideo.data?.[0];

  if (projeto.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!projeto.data) return <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>;

  const p = projeto.data;

  return (
    <>
      <PageHeader
        titulo={p.nome}
        descricao={`${p.duracao}s · ${p.formato} · ${p.objetivo ?? "sem objetivo"} · ${p.estilo ?? ""}`}
        acoes={
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() =>
              baixarTexto(
                `${p.nome.replace(/\s+/g, "-").toLowerCase()}.txt`,
                montarExportacao(p.nome, estrategia.data, roteiro, imagem, video),
              )
            }
          >
            <Download className="size-4" /> Exportar tudo
          </Button>
        }
      />

      {!p.character_id ? (
        <Alert className="mb-6">
          <AlertDescription>{AVISO_SEM_PERSONAGEM}</AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="estrategia">
        {/* Mobile: scroll horizontal controlado; a partir de sm as abas cabem na linha */}
        <div className="-mx-1 mb-5 overflow-x-auto px-1 no-scrollbar">
          <TabsList className="inline-flex h-auto w-max min-w-full justify-start gap-1">
            <TabsTrigger value="estrategia" className="min-h-11 whitespace-nowrap">Estratégia</TabsTrigger>
            <TabsTrigger value="roteiro" className="min-h-11 whitespace-nowrap">Roteiro</TabsTrigger>
            <TabsTrigger value="imagem" className="min-h-11 whitespace-nowrap">Prompt de imagem</TabsTrigger>
            <TabsTrigger value="video" className="min-h-11 whitespace-nowrap">Prompt de vídeo</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="estrategia" className="space-y-4">
          <Acao
            label="Gerar estratégia"
            carregando={ocupado === "estrategia"}
            onClick={() => executar("estrategia", () => fnEstrategia({ data: { projectId: id } }), "strategy")}
          />
          {estrategia.data ? (
            <div className="space-y-4">
              <Bloco titulo="Público" texto={estrategia.data.publico} />
              <Bloco titulo="Problema principal" texto={estrategia.data.problema} />
              <ListaJson titulo="Benefícios" valor={estrategia.data.beneficios} />
              <ListaJson titulo="Objeções" valor={estrategia.data.objecoes} />
              <ListaJson titulo="Ângulos de venda" valor={estrategia.data.angulos} />
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              titulo="Estratégia ainda não gerada"
              descricao="A estratégia analisa o produto e propõe ângulos de venda antes do roteiro."
            />
          )}
        </TabsContent>

        <TabsContent value="roteiro" className="space-y-4">
          <AreaField
            label="Instruções extras para o roteiro"
            rows={2}
            value={instrucoes}
            onChange={setInstrucoes}
          />
          <div className="flex flex-wrap gap-2">
            <Acao
              label={roteiros.data?.length ? "Gerar nova versão" : "Gerar roteiro"}
              carregando={ocupado === "roteiro"}
              onClick={() =>
                executar("roteiro", () => fnRoteiro({ data: { projectId: id, instrucoes } }), "scripts")
              }
            />
            {roteiro ? (
              <Button
                variant="secondary"
                className="gap-2"
                disabled={ocupado === "alt"}
                onClick={async () => {
                  setOcupado("alt");
                  try {
                    const r = await fnAlternativas({ data: { projectId: id, tipo: "gancho" } });
                    setAlternativas(r.opcoes ?? []);
                  } catch (e) {
                    toast.error(traduzirErro(e));
                  } finally {
                    setOcupado(null);
                  }
                }}
              >
                {ocupado === "alt" ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                Alternativas de gancho
              </Button>
            ) : null}
          </div>

          {alternativas.length ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold">Alternativas de gancho</h3>
              <ul className="space-y-2">
                {alternativas.map((a) => (
                  <li key={a} className="flex items-start justify-between gap-3 text-sm">
                    <span>{a}</span>
                    <CopyButton value={a} size="icon" />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {roteiro ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Versão {roteiro.versao}</Badge>
                <span className="text-sm text-muted-foreground">{roteiro.rotulo}</span>
              </div>
              <Bloco titulo="Gancho" texto={roteiro.gancho} />
              <Bloco titulo="Roteiro completo" texto={roteiro.roteiro_completo} />
              <Bloco titulo="CTA" texto={roteiro.cta} />
              <Bloco titulo="Legenda" texto={roteiro.legenda} />
              <Bloco titulo="Hashtags" texto={roteiro.hashtags} />
              {roteiros.data && roteiros.data.length > 1 ? (
                <p className="text-xs text-muted-foreground">
                  {roteiros.data.length} versões salvas neste projeto.
                </p>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              titulo="Nenhum roteiro gerado"
              descricao="Gere o roteiro cena a cena com fala, ação, câmera e textos na tela."
            />
          )}
        </TabsContent>

        <TabsContent value="imagem" className="space-y-4">
          <Acao
            label="Gerar prompt de imagem"
            carregando={ocupado === "imagem"}
            onClick={() => executar("imagem", () => fnImagem({ data: { projectId: id } }), "image_prompts")}
          />
          {imagem ? (
            <div className="space-y-4">
              <Bloco titulo="Prompt" texto={imagem.prompt} />
              <Bloco titulo="Prompt negativo" texto={imagem.prompt_negativo} />
              <Bloco titulo="Enquadramento" texto={imagem.enquadramento} />
              <Bloco titulo="Pose" texto={imagem.pose} />
              <Bloco titulo="Iluminação" texto={imagem.iluminacao} />
              <Bloco titulo="Produto nas mãos" texto={imagem.maos_produto} />
              <Bloco titulo="Continuidade" texto={imagem.continuidade} />
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              titulo="Nenhum prompt de imagem"
              descricao="Gere o prompt da imagem inicial que servirá de primeiro frame do vídeo."
            />
          )}
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <Acao
            label="Gerar prompt de vídeo"
            carregando={ocupado === "video"}
            onClick={() => executar("video", () => fnVideo({ data: { projectId: id } }), "video_prompts")}
          />
          {video ? (
            <div className="space-y-4">
              <Bloco titulo="Prompt para o Google Flow" texto={video.prompt_flow} />
              <Bloco titulo="Descrição da cena" texto={video.descricao_cena} />
              <Bloco titulo="Ações" texto={video.acoes} />
              <Bloco titulo="Câmera" texto={video.camera} />
              <Bloco titulo="Diálogo" texto={video.dialogo} />
              <Bloco titulo="Produto" texto={video.produto} />
              <Bloco titulo="Restrições" texto={video.restricoes} />
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              titulo="Nenhum prompt de vídeo"
              descricao="Gere o prompt final pronto para colar no Google Flow."
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}

function Acao({
  label,
  carregando,
  onClick,
}: {
  label: string;
  carregando: boolean;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick} disabled={carregando} className="gap-2">
      {carregando ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      {carregando ? "Gerando..." : label}
    </Button>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto?: string | null }) {
  if (!texto) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h3 className="min-w-0 truncate text-sm font-semibold">{titulo}</h3>
        <CopyButton value={texto} />
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{texto}</p>
    </div>
  );
}

function ListaJson({ titulo, valor }: { titulo: string; valor: unknown }) {
  const itens = Array.isArray(valor) ? valor : [];
  if (!itens.length) return null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold">{titulo}</h3>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {itens.map((item, i) => (
          <li key={i} className="rounded-lg bg-secondary/50 px-3 py-2">
            {typeof item === "string" ? item : formatarItem(item as Record<string, unknown>)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatarItem(item: Record<string, unknown>) {
  return Object.entries(item)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${String(v)}`)
    .join(" · ");
}

function traduzirErro(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("429")) return "Muitas solicitações agora. Tente novamente em instantes.";
  if (msg.includes("402")) return "Seus créditos de IA acabaram. Adicione créditos para continuar.";
  return msg || "Não foi possível gerar o conteúdo.";
}

function montarExportacao(
  nome: string,
  estrategia: unknown,
  roteiro: Record<string, unknown> | undefined,
  imagem: Record<string, unknown> | undefined,
  video: Record<string, unknown> | undefined,
) {
  const partes = [
    `PROJETO: ${nome}`,
    `\n--- ESTRATÉGIA ---\n${JSON.stringify(estrategia ?? {}, null, 2)}`,
    `\n--- ROTEIRO ---\n${(roteiro?.roteiro_completo as string) ?? "—"}`,
    `\nGancho: ${(roteiro?.gancho as string) ?? "—"}`,
    `CTA: ${(roteiro?.cta as string) ?? "—"}`,
    `Legenda: ${(roteiro?.legenda as string) ?? "—"}`,
    `Hashtags: ${(roteiro?.hashtags as string) ?? "—"}`,
    `\n--- PROMPT DE IMAGEM ---\n${(imagem?.prompt as string) ?? "—"}`,
    `\n--- PROMPT DE VÍDEO (GOOGLE FLOW) ---\n${(video?.prompt_flow as string) ?? "—"}`,
  ];
  return partes.join("\n");
}