/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stepper } from "@/components/fluxo/Stepper";
import { PassoPersonagem } from "@/components/fluxo/PassoPersonagem";
import { PassoProduto, type ProdutoFluxo } from "@/components/fluxo/PassoProduto";
import { PassoFoto } from "@/components/fluxo/PassoFoto";
import { PassoCta } from "@/components/fluxo/PassoCta";
import { PassoRoteiros } from "@/components/fluxo/PassoRoteiros";
import { DURACOES_FLUXO } from "@/lib/ctas";
import { gerarTresRoteiros, listarResultados } from "@/lib/fluxo.functions";
import { atualizar, criar } from "@/lib/queries";

const DESCRICAO =
  "Crie vídeos do TikTok Shop com personagens de IA em cinco passos: personagem, produto, foto, chamada e roteiros.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Criar vídeo | TikTok Factory" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Criar vídeo | TikTok Factory" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CriarVideo,
});

function CriarVideo() {
  const [etapa, setEtapa] = useState(1);
  const [maximo, setMaximo] = useState(1);
  const [personagem, setPersonagem] = useState<string | null>(null);
  const [produto, setProduto] = useState<ProdutoFluxo | null>(null);
  const [projetoId, setProjetoId] = useState<string | null>(null);
  const [duracao, setDuracao] = useState(30);
  const [nome, setNome] = useState("");
  const [promptFoto, setPromptFoto] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [cta, setCta] = useState({ valor: "", tipo: "auto" });
  const [gerando, setGerando] = useState(false);

  const resultados = useQuery({
    queryKey: ["fluxo-resultados", projetoId],
    enabled: Boolean(projetoId) && etapa === 5,
    queryFn: () => listarResultados({ data: { projectId: projetoId! } }),
  });

  function avancar(n: number) {
    setEtapa(n);
    setMaximo((m) => Math.max(m, n));
  }

  async function salvarProjeto(valores: Record<string, unknown>) {
    if (projetoId) return atualizar("projects", projetoId, valores);
    const criado = await criar("projects", {
      nome: nome.trim() || `Vídeo ${new Date().toLocaleDateString("pt-BR")}`,
      duracao,
      character_id: personagem,
      status: "em_andamento",
      ...valores,
    });
    setProjetoId(criado.id);
    return criado;
  }

  async function confirmarProduto(p: ProdutoFluxo) {
    try {
      await salvarProjeto({
        product_id: p.id,
        character_id: personagem,
        duracao,
        etapa: 3,
        imagem_produto_referencia: p.imagem_principal ?? null,
        nome: nome.trim() || p.nome || "Novo vídeo",
      });
      avancar(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar o projeto.");
    }
  }

  async function confirmarFoto() {
    if (!projetoId) return;
    try {
      await atualizar("projects", projetoId, {
        reference_image_url: fotoUrl,
        image_confirmed: true,
        image_prompt_used: promptFoto,
        etapa: 4,
      });
      avancar(4);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao confirmar a foto.");
    }
  }

  async function criarRoteiros() {
    if (!projetoId) return;
    setGerando(true);
    try {
      await atualizar("projects", projetoId, { cta: cta.valor || null, cta_tipo: cta.tipo });
      await gerarTresRoteiros({ data: { projectId: projetoId } });
      avancar(5);
      await resultados.refetch();
      toast.success("Três roteiros prontos.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar os roteiros.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <>
      <PageHeader titulo="Criar vídeo" descricao={DESCRICAO} />
      <Stepper atual={etapa} maximo={maximo} onIr={setEtapa} />

      {etapa === 1 ? (
        <div className="space-y-6">
          <section className="surface grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Nome do vídeo
              </label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-11" placeholder="Opcional" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Duração alvo
              </label>
              <Select value={String(duracao)} onValueChange={(v) => setDuracao(Number(v))}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURACOES_FLUXO.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d} segundos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
          <PassoPersonagem
            selecionada={personagem}
            onSelecionar={(id) => {
              setPersonagem(id);
              avancar(2);
            }}
          />
        </div>
      ) : null}

      {etapa === 2 ? (
        <PassoProduto produto={produto} onProdutoSalvo={setProduto} onContinuar={confirmarProduto} />
      ) : null}

      {etapa === 3 && projetoId ? (
        <PassoFoto
          projectId={projetoId}
          prompt={promptFoto}
          fotoUrl={fotoUrl}
          onPrompt={setPromptFoto}
          onFoto={setFotoUrl}
          onConfirmar={confirmarFoto}
        />
      ) : null}

      {etapa === 4 ? (
        <PassoCta
          valor={cta.valor}
          tipo={cta.tipo}
          gerando={gerando}
          onMudar={(valor, tipo) => setCta({ valor, tipo })}
          onContinuar={criarRoteiros}
        />
      ) : null}

      {etapa === 5 && projetoId ? (
        resultados.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando roteiros...
          </div>
        ) : (
          <PassoRoteiros
            projectId={projetoId}
            resultados={(resultados.data as any[]) ?? []}
            gerandoTudo={gerando}
            onAtualizar={() => resultados.refetch()}
            onRegerarTudo={criarRoteiros}
          />
        )
      ) : null}

      {etapa === 5 && !projetoId ? (
        <Button onClick={() => setEtapa(1)}>Começar um novo vídeo</Button>
      ) : null}
    </>
  );
}

function DashboardAntigo() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");

  const projetos = useQuery({ queryKey: ["projects"], queryFn: () => listar("projects") });
  const produtos = useQuery({ queryKey: ["products"], queryFn: () => listar("products") });
  const personagens = useQuery({ queryKey: ["characters"], queryFn: () => listar("characters") });
  const cenarios = useQuery({ queryKey: ["scenarios"], queryFn: () => listar("scenarios") });
  const roteiros = useQuery({
    queryKey: ["scripts-count"],
    queryFn: () => contar("scripts"),
  });

  const lista = useMemo(() => {
    const todos = projetos.data ?? [];
    return todos.filter((p) => {
      const okBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
      const okStatus = status === "todos" || p.status === status;
      return okBusca && okStatus;
    });
  }, [projetos.data, busca, status]);

  const emAndamento = (projetos.data ?? []).filter((p) => p.status !== "finalizado" && p.status !== "arquivado").length;
  const finalizados = (projetos.data ?? []).filter((p) => p.status === "finalizado").length;

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        descricao="Sua central de produção de vídeos para TikTok Shop."
        acoes={
          <Button asChild className="gap-2">
            <Link to="/projetos/novo">
              <Plus className="size-4" /> Criar novo vídeo
            </Link>
          </Button>
        }
      />

      {/* Bento fluido: 2 col no mobile, cresce por ponto de quebra do conteúdo */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metrica indice={0} titulo="Projetos" valor={projetos.data?.length} icon={FolderKanban} to="/projetos" />
        <Metrica indice={1} titulo="Produtos" valor={produtos.data?.length} icon={Package} to="/produtos" />
        <Metrica indice={2} titulo="Personagens" valor={personagens.data?.length} icon={Users} to="/personagens" />
        <Metrica indice={3} titulo="Cenários" valor={cenarios.data?.length} icon={Sparkles} to="/cenarios" />
        <Metrica indice={4} titulo="Roteiros gerados" valor={roteiros.data} icon={ScrollText} />
        <Metrica
          indice={5}
          titulo="Em andamento"
          valor={emAndamento}
          sub={`${finalizados} finalizados`}
          icon={FolderKanban}
        />
      </div>

      <section className="mt-[clamp(2.5rem,6vw,4rem)]">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Projetos recentes</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar projeto"
                className="h-11 w-full pl-9 sm:w-56"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-11 w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {projetos.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            titulo={projetos.data?.length ? "Nenhum projeto com esses filtros" : "Nenhum projeto ainda"}
            descricao={
              projetos.data?.length
                ? "Ajuste a busca ou o filtro de status para ver seus projetos."
                : "Crie seu primeiro projeto para gerar estratégia, roteiro e prompts de imagem e vídeo."
            }
            acao={
              <Button asChild>
                <Link to="/projetos/novo">Criar novo vídeo</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.slice(0, 9).map((p, i) => (
              <Link
                key={p.id}
                to="/projetos/$id"
                params={{ id: p.id }}
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                className="surface stagger interactive group p-5 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold transition-colors duration-300 group-hover:text-primary">{p.nome}</h3>
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {String(p.status).replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {p.duracao}s · {p.formato} · {p.objetivo || "sem objetivo definido"}
                </p>
                <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70">
                  Atualizado em {formatarData(p.updated_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {personagens.data?.length === 0 ? (
        <div className="glass mt-10 rounded-2xl border border-border p-6 text-sm leading-relaxed text-muted-foreground">
          Nenhuma personagem cadastrada. As personagens serão adicionadas na próxima etapa de configuração.
        </div>
      ) : null}
    </>
  );
}

function Metrica({
  titulo,
  valor,
  sub,
  icon: Icon,
  to,
  indice = 0,
}: {
  titulo: string;
  valor?: number;
  sub?: string;
  icon: typeof FolderKanban;
  to?: "/projetos" | "/produtos" | "/personagens" | "/cenarios";
  indice?: number;
}) {
  const conteudo = (
    <div className="surface interactive h-full p-4 sm:p-5 hover:border-primary/35 hover:shadow-lift">
      <div className="flex items-center justify-between">
        <span className="min-w-0 truncate text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {titulo}
        </span>
        <Icon className="size-4 shrink-0 text-accent transition-transform duration-500 group-hover:scale-110" />
      </div>
      <p className="mt-3 font-display text-[clamp(1.5rem,1.1rem+1.6vw,2rem)] font-bold tracking-[-0.03em] tabular-nums sm:mt-4">
        {valor ?? "—"}
      </p>
      {sub ? <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
  const estilo = { animationDelay: `${indice * 60}ms` };
  return to ? (
    <Link to={to} style={estilo} className="stagger group block interactive hover:-translate-y-1">
      {conteudo}
    </Link>
  ) : (
    <div style={estilo} className="stagger group">
      {conteudo}
    </div>
  );
}