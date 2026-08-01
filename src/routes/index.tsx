/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/fluxo/Stepper";
import { PassoPersonagem } from "@/components/fluxo/PassoPersonagem";
import { PassoProduto, type ProdutoFluxo } from "@/components/fluxo/PassoProduto";
import { PassoFoto } from "@/components/fluxo/PassoFoto";
import { PassoCta } from "@/components/fluxo/PassoCta";
import { PassoRoteiros } from "@/components/fluxo/PassoRoteiros";
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
  const [personagemNome, setPersonagemNome] = useState("");
  const [produto, setProduto] = useState<ProdutoFluxo | null>(null);
  const [projetoId, setProjetoId] = useState<string | null>(null);
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

  function nomeAutomatico(produtoNome?: string | null) {
    const data = new Date().toLocaleDateString("pt-BR");
    return [personagemNome || "Personagem", produtoNome || produto?.nome || "Produto", data].join(" — ");
  }

  async function salvarProjeto(valores: Record<string, unknown>) {
    if (projetoId) return atualizar("projects", projetoId, valores);
    const criado = await criar("projects", {
      nome: nomeAutomatico(),
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
        etapa: 3,
        imagem_produto_referencia: p.imagem_principal ?? null,
        nome: nomeAutomatico(p.nome),
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
        <PassoPersonagem
          selecionada={personagem}
          onSelecionar={(id, nomePersonagem) => {
            setPersonagem(id);
            setPersonagemNome(nomePersonagem);
            avancar(2);
          }}
        />
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
