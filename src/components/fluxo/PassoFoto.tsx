/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analisarFotoProjeto } from "@/lib/fluxo.functions";
import { validarImagem } from "@/lib/fotos";
import {
  atualizar,
  enviarArquivoDetalhado,
  obter,
  removerArquivo,
} from "@/lib/queries";

type EstadoAnalise = "ocioso" | "analisando" | "ok" | "falhou";

export function PassoFoto({
  projectId,
  fotoUrl,
  onFoto,
  onConfirmar,
}: {
  projectId: string;
  fotoUrl: string;
  onFoto: (url: string) => void;
  onConfirmar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [caminho, setCaminho] = useState("");
  const [analise, setAnalise] = useState<EstadoAnalise>("ocioso");
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const projeto: any = await obter("projects", projectId);
        if (!ativo || !projeto) return;
        setCaminho(String(projeto.reference_image_path ?? ""));
        if (projeto.image_analysis_status === "ok") setAnalise("ok");
        else if (projeto.image_analysis_status === "falhou") setAnalise("falhou");
        else if (projeto.image_analysis_status === "analisando") setAnalise("analisando");
        else setAnalise("ocioso");
      } catch {
        if (ativo) setAnalise("ocioso");
      }
    })();
    return () => {
      ativo = false;
    };
  }, [projectId]);

  async function analisarFotoAtual() {
    setAnalise("analisando");
    await atualizar("projects", projectId, {
      image_confirmed: false,
      image_analysis_status: "analisando",
      project_image_analysis: null,
      image_analysis_at: null,
    });
    const res: any = await analisarFotoProjeto({ data: { projectId } });
    if (!res?.ok) {
      setAnalise("falhou");
      throw new Error(res?.mensagem || "A leitura automática da foto falhou.");
    }
    setAnalise("ok");
    return res;
  }

  async function subir(file?: File | null) {
    if (!file) return;
    const erro = validarImagem(file);
    if (erro) return toast.error(erro);

    setEnviando(true);
    const caminhoAnterior = caminho;
    try {
      const arquivo = await enviarArquivoDetalhado("produtos", file);
      setCaminho(arquivo.caminho);
      onFoto(arquivo.url);
      await atualizar("projects", projectId, {
        reference_image_url: arquivo.url,
        reference_image_path: arquivo.caminho,
        reference_image_uploaded_at: new Date().toISOString(),
        image_confirmed: false,
        image_analysis_status: "analisando",
        project_image_analysis: null,
        image_analysis_at: null,
      });

      try {
        await analisarFotoAtual();
        toast.success("Foto enviada e analisada.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "A leitura automática da foto falhou.");
      }

      if (caminhoAnterior && caminhoAnterior !== arquivo.caminho) {
        await removerArquivo("produtos", caminhoAnterior).catch(() => null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar a foto.");
    } finally {
      setEnviando(false);
    }
  }

  async function excluirFoto() {
    setRemovendo(true);
    try {
      if (caminho) await removerArquivo("produtos", caminho).catch(() => null);
      await atualizar("projects", projectId, {
        reference_image_url: null,
        reference_image_path: null,
        reference_image_uploaded_at: null,
        image_confirmed: false,
        image_analysis_status: null,
        image_analysis_at: null,
        project_image_analysis: null,
      });
      setCaminho("");
      setAnalise("ocioso");
      onFoto("");
      if (entrada.current) entrada.current.value = "";
      toast.success("Foto removida.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover a foto.");
    } finally {
      setRemovendo(false);
    }
  }

  async function reanalisar() {
    try {
      await analisarFotoAtual();
      toast.success("Foto analisada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "A leitura automática da foto falhou.");
    }
  }

  return (
    <section className="surface p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Envie a foto pronta da produção</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A foto já deve mostrar a personagem, o produto e o ambiente final. Ela será o primeiro frame e
        a única referência visual dos clipes.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-start">
        <div className="aspect-[9/16] w-full overflow-hidden rounded-xl border border-border bg-secondary/40">
          {fotoUrl ? (
            <a href={fotoUrl} target="_blank" rel="noreferrer">
              <img
                src={fotoUrl}
                alt="Foto inicial da produção"
                className="size-full object-cover"
              />
            </a>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <ImageUp className="size-8" />
              <span className="text-xs">Prévia vertical 9:16</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            disabled={enviando || removendo}
            onChange={(e) => {
              void subir(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {analise === "analisando" ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Analisando pose, enquadramento e estado do
              produto...
            </p>
          ) : null}
          {analise === "ok" && fotoUrl ? (
            <p className="text-sm text-muted-foreground">
              Foto validada. O estado visual inicial será preservado nos roteiros e clipes.
            </p>
          ) : null}
          {analise === "falhou" ? (
            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="text-sm text-destructive">
                A foto foi salva, mas a análise visual falhou. A produção está bloqueada até a leitura
                funcionar.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                disabled={enviando || removendo}
                onClick={() => void reanalisar()}
              >
                <RefreshCw className="size-4" /> TENTAR ANALISAR NOVAMENTE
              </Button>
            </div>
          ) : null}
          {analise === "ocioso" && fotoUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={enviando || removendo}
              onClick={() => void reanalisar()}
            >
              <RefreshCw className="size-4" /> ANALISAR FOTO
            </Button>
          ) : null}

          {fotoUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled={enviando || removendo}
              onClick={() => void excluirFoto()}
            >
              {removendo ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Excluir foto
            </Button>
          ) : null}

          <Button
            className="h-12 w-full gap-2 text-base"
            disabled={!fotoUrl || analise !== "ok" || enviando || removendo}
            onClick={onConfirmar}
          >
            CONFIRMAR FOTO E CONTINUAR
          </Button>
        </div>
      </div>
    </section>
  );
}
