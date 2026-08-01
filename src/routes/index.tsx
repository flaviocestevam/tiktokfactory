/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/fluxo/Stepper";
import { PassoProduto, type ProdutoFluxo } from "@/components/fluxo/PassoProduto";
import { PassoPersonagem } from "@/components/fluxo/PassoPersonagem";
import { PassoFoto } from "@/components/fluxo/PassoFoto";
import { PassoCta } from "@/components/fluxo/PassoCta";
import { PassoRoteiros } from "@/components/fluxo/PassoRoteiros";
import { PassoClipes } from "@/components/fluxo/PassoClipes";
import {
  aprovarRoteiroVariante,
  gerarTresRoteiros,
  listarResultados,
} from "@/lib/fluxo.functions";
import { atualizar, criar, obter } from "@/lib/queries";
import { CTA_AUTOMATICO } from "@/lib/config";

const DESCRICAO =
  "Crie vídeos do TikTok Shop em cinco etapas: produto, personagem, foto, roteiros e clipes prontos para o Google Flow.";

const CHAVE_PRODUCAO = "tiktokfactory:producao";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Criar conteúdo | TikTok Factory" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Criar conteúdo | TikTok Factory" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CriarConteudo,
});

function CriarConteudo() {
  const [etapa, setEtapa] = useState(1);
  const [maximo, setMaximo] = useState(1);
  const [produto, setProduto] = useState<ProdutoFluxo | null>(null);
  const [personagem, setPersonagem] = useState<string | null>(null);
  const [personagemNome, setPersonagemNome] = useState("");
  const [projetoId, setProjetoId] = useState<string | null>(null);
  const [promptFoto, setPromptFoto] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [cta, setCta] = useState({ valor: "", tipo: CTA_AUTOMATICO });
  const [gerando, setGerando] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [restaurando, setRestaurando] = useState(true);

  const resultados = useQuery({
    queryKey: ["fluxo-resultados", projetoId],
    enabled: Boolean(projetoId),
    queryFn: () => listarResultados({ data: { projectId: projetoId! } }),
  });

  // Retoma automaticamente a última produção em andamento.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const id = localStorage.getItem(CHAVE_PRODUCAO);
        if (!id) return;
        const projeto: any = await obter("projects", id);
        if (!ativo || !projeto) {
          localStorage.removeItem(CHAVE_PRODUCAO);
          return;
        }
        setProjetoId(projeto.id);
        setPersonagem(projeto.character_id ?? null);
        setFotoUrl(projeto.reference_image_url ?? "");
        setPromptFoto(projeto.image_prompt_used ?? "");
        setCta({ valor: projeto.cta ?? "", tipo: projeto.cta_tipo ?? CTA_AUTOMATICO });
        if (projeto.product_id) setProduto((await obter("products", projeto.product_id)) as any);
        const passo = Math.min(5, Math.max(1, projeto.etapa ?? 1));
        setEtapa(passo);
        setMaximo(passo);
      } catch {
        /* produção não pôde ser retomada */
      } finally {
        if (ativo) setRestaurando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  function avancar(n: number) {
    setEtapa(n);
    setMaximo((m) => Math.max(m, n));
  }

  function nomeAutomatico(produtoNome?: string | null) {
    const data = new Date().toLocaleDateString("pt-BR");
    return [produtoNome || produto?.nome || "Produto", personagemNome || "Personagem", data].join(
      " — ",
    );
  }

  async function salvarProducao(valores: Record<string, unknown>) {
    if (projetoId) return atualizar("projects", projetoId, valores);
    const criado = await criar("projects", {
      nome: nomeAutomatico(),
      status: "produto_analisado",
      ...valores,
    });
    setProjetoId(criado.id);
    localStorage.setItem(CHAVE_PRODUCAO, criado.id);
    return criado;
  }

  // Etapa 1 → 2: produto confirmado cria a produção.
  async function confirmarProduto(p: ProdutoFluxo) {
    try {
      setProduto(p);
      await salvarProducao({
        product_id: p.id,
        etapa: 2,
        status: "produto_analisado",
        imagem_produto_referencia: p.imagem_principal ?? null,
        nome: nomeAutomatico(p.nome),
      });
      avancar(2);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar a produção.");
    }
  }

  // Etapa 2 → 3: personagem escolhida (recomendada ou manual).
  async function confirmarPersonagem(id: string, nome: string, motivo?: string) {
    setPersonagem(id);
    setPersonagemNome(nome);
    try {
      await salvarProducao({
        character_id: id,
        personagem_motivo: motivo ?? null,
        etapa: 3,
        status: "aguardando_foto",
        nome: nomeAutomatico(),
      });
      avancar(3);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar a personagem.");
    }
  }

  // Etapa 3 → 4: foto confirmada, única fonte visual do vídeo.
  async function confirmarFoto() {
    if (!projetoId) {
      toast.error("Produção não encontrada. Refaça a etapa do produto.");
      setEtapa(1);
      return;
    }
    try {
      await atualizar("projects", projetoId, {
        reference_image_url: fotoUrl,
        image_confirmed: true,
        image_prompt_used: promptFoto,
        reference_image_uploaded_at: new Date().toISOString(),
        etapa: 4,
        status: "foto_confirmada",
      });
      avancar(4);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao confirmar a foto.");
    }
  }

  // Etapa 4: gera os três roteiros.
  async function criarRoteiros() {
    if (!projetoId) {
      toast.error("Produção não encontrada. Refaça a etapa do produto.");
      setEtapa(1);
      return;
    }
    setGerando(true);
    try {
      await atualizar("projects", projetoId, { cta: cta.valor || null, cta_tipo: cta.tipo });
      await gerarTresRoteiros({ data: { projectId: projetoId } });
      await resultados.refetch();
      toast.success("Três roteiros prontos.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar os roteiros.");
      await resultados.refetch();
    } finally {
      setGerando(false);
    }
  }

  // Etapa 4 → 5: aprovação do roteiro escolhido.
  async function aprovarRoteiro(scriptId: string) {
    if (!projetoId) return;
    setAprovando(true);
    try {
      await aprovarRoteiroVariante({ data: { projectId: projetoId, scriptId } });
      await resultados.refetch();
      avancar(5);
      toast.success("Roteiro aprovado. Agora prepare os clipes.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao aprovar o roteiro.");
    } finally {
      setAprovando(false);
    }
  }

  function novaProducao() {
    localStorage.removeItem(CHAVE_PRODUCAO);
    setProjetoId(null);
    setProduto(null);
    setPersonagem(null);
    setPersonagemNome("");
    setPromptFoto("");
    setFotoUrl("");
    setCta({ valor: "", tipo: CTA_AUTOMATICO });
    setEtapa(1);
    setMaximo(1);
  }

  const lista = (resultados.data as any[]) ?? [];
  const aprovado = lista.find((r) => r.script?.aprovado) ?? null;

  if (restaurando) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Retomando sua produção...
      </div>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Criar conteúdo"
        descricao={DESCRICAO}
        acoes={
          projetoId ? (
            <Button variant="outline" onClick={novaProducao}>
              NOVA PRODUÇÃO
            </Button>
          ) : undefined
        }
      />
      <Stepper atual={etapa} maximo={maximo} onIr={setEtapa} />

      {etapa === 1 ? (
        <PassoProduto
          produto={produto}
          onProdutoSalvo={setProduto}
          onContinuar={confirmarProduto}
        />
      ) : null}

      {etapa === 2 ? (
        <PassoPersonagem
          produto={produto}
          selecionada={personagem}
          onSelecionar={confirmarPersonagem}
        />
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

      {etapa === 4 && projetoId ? (
        <div className="space-y-6">
          <PassoCta
            valor={cta.valor}
            tipo={cta.tipo}
            gerando={gerando}
            compacto={lista.length > 0}
            onMudar={(valor, tipo) => setCta({ valor, tipo })}
            onContinuar={criarRoteiros}
          />
          {resultados.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando roteiros...
            </div>
          ) : lista.length ? (
            <PassoRoteiros
              projectId={projetoId}
              resultados={lista}
              gerandoTudo={gerando}
              aprovando={aprovando}
              onAtualizar={() => resultados.refetch()}
              onRegerarTudo={criarRoteiros}
              onAprovar={aprovarRoteiro}
            />
          ) : null}
        </div>
      ) : null}

      {etapa === 5 && projetoId ? (
        <PassoClipes
          projectId={projetoId}
          item={aprovado}
          onAtualizar={() => resultados.refetch()}
        />
      ) : null}

      {etapa > 1 && !projetoId ? (
        <Button onClick={() => setEtapa(1)}>Começar uma nova produção</Button>
      ) : null}
    </>
  );
}
