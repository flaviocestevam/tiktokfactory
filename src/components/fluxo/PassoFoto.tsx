/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import { ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { gerarPromptFoto } from "@/lib/fluxo.functions";
import { validarImagem } from "@/lib/fotos";
import { enviarArquivo } from "@/lib/queries";

const AJUSTES = [
  {
    id: "produto",
    label: "PRODUTO MAIS VISÍVEL",
    instrucao: "Deixe o produto maior, mais próximo da câmera e com o rótulo totalmente legível.",
  },
  {
    id: "natural",
    label: "MAIS NATURAL",
    instrucao: "Deixe a cena mais espontânea, com pose e expressão menos posadas.",
  },
  {
    id: "enquadramento",
    label: "AJUSTAR ENQUADRAMENTO",
    instrucao:
      "Ajuste apenas o enquadramento e a distância da câmera, sem alterar nada mais da cena.",
  },
];

export function PassoFoto({
  projectId,
  prompt,
  fotoUrl,
  onPrompt,
  onFoto,
  onConfirmar,
}: {
  projectId: string;
  prompt: string;
  fotoUrl: string;
  onPrompt: (prompt: string) => void;
  onFoto: (url: string) => void;
  onConfirmar: () => void;
}) {
  const [gerando, setGerando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const entrada = useRef<HTMLInputElement>(null);

  async function gerar(ajuste?: string) {
    setGerando(true);
    try {
      const res: any = await gerarPromptFoto({ data: { projectId, ajuste } });
      const texto = [
        res?.prompt,
        res?.prompt_negativo ? `\n\nNegative prompt: ${res.prompt_negativo}` : "",
      ]
        .filter(Boolean)
        .join("");
      onPrompt(texto);
      toast.success("Prompt da foto gerado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o prompt.");
    } finally {
      setGerando(false);
    }
  }

  async function subir(file?: File | null) {
    if (!file) return;
    const erro = validarImagem(file);
    if (erro) {
      toast.error(erro);
      return;
    }
    setEnviando(true);
    try {
      const url = await enviarArquivo("produtos", file);
      onFoto(url);
      toast.success("Foto enviada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar a foto.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Prompt da foto inicial</h2>
          <div className="flex flex-wrap gap-2">
            <CopyButton value={prompt} label="COPIAR PROMPT" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => gerar()}
              disabled={gerando}
              className="gap-2"
            >
              {gerando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              REGERAR
            </Button>
          </div>
        </div>

        {prompt ? (
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed">
            {prompt}
          </pre>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Gere o prompt da personagem segurando exatamente este produto.
            </p>
            <Button onClick={() => gerar()} disabled={gerando} className="mt-4 gap-2">
              {gerando ? <Loader2 className="size-4 animate-spin" /> : null}
              GERAR PROMPT DA FOTO
            </Button>
          </div>
        )}

        {prompt ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {AJUSTES.map((a) => (
              <Button
                key={a.id}
                variant="secondary"
                size="sm"
                disabled={gerando}
                onClick={() => gerar(a.instrucao)}
              >
                {a.label}
              </Button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Envie a foto criada no GPT</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr] sm:items-start">
          <div className="aspect-[9/16] w-full overflow-hidden rounded-xl border border-border bg-secondary/40">
            {fotoUrl ? (
              <a href={fotoUrl} target="_blank" rel="noreferrer">
                <img
                  src={fotoUrl}
                  alt="Foto inicial da personagem"
                  className="size-full object-cover"
                />
              </a>
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageUp className="size-8" />
                <span className="text-xs">Prévia 9:16</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <Input
              ref={entrada}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              disabled={enviando}
              onChange={(e) => {
                subir(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground">
              Envie a imagem vertical criada no GPT. Ela será o primeiro frame do vídeo.
            </p>
            {fotoUrl ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => {
                  onFoto("");
                  if (entrada.current) entrada.current.value = "";
                }}
              >
                <Trash2 className="size-4" /> Excluir foto
              </Button>
            ) : null}
            <Button
              className="h-12 w-full gap-2 text-base"
              disabled={!fotoUrl}
              onClick={onConfirmar}
            >
              CONFIRMAR FOTO E CONTINUAR
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
