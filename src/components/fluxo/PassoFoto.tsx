/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import { ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/CopyButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analisarFotoProjeto, gerarPromptFoto } from "@/lib/fluxo.functions";
import { validarImagem } from "@/lib/fotos";
import { atualizar, enviarArquivo } from "@/lib/queries";

const AJUSTES = [
  {
    id: "produto",
    label: "PRODUTO MAIS VISÍVEL",
    instrucao:
      "Torne o produto principal mais fácil de identificar, preservando a forma natural de vestir, aplicar, usar, manusear, apoiar ou demonstrar conforme sua categoria. Não force o produto para uma mão e não invente embalagem ou rótulo.",
  },
  {
    id: "natural",
    label: "MAIS NATURAL",
    instrucao: "Deixe a cena mais espontânea, com pose e expressão menos posadas.",
  },
  {
    id: "composicao",
    label: "OUTRA COMPOSIÇÃO",
    instrucao:
      "Crie uma composição diferente, mantendo exatamente a mesma identidade da personagem, a mesma aparência do produto e uma forma de demonstração coerente com a categoria.",
  },
  {
    id: "enquadramento",
    label: "AJUSTAR ENQUADRAMENTO",
    instrucao:
      "Ajuste apenas o enquadramento e a distância da câmera, sem alterar a identidade, o produto nem a forma natural de interação.",
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
  const [analise, setAnalise] = useState<"ocioso" | "analisando" | "ok" | "falhou">(
    fotoUrl ? "ok" : "ocioso",
  );
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
      // A foto é a única fonte visual: lemos o estado inicial automaticamente.
      setAnalise("analisando");
      await atualizar("projects", projectId, {
        reference_image_url: url,
        reference_image_uploaded_at: new Date().toISOString(),
      });
      const res: any = await analisarFotoProjeto({ data: { projectId } });
      setAnalise(res?.ok ? "ok" : "falhou");
      if (!res?.ok) toast.warning("A foto foi enviada, mas a leitura automática falhou.");
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

        <p className="mt-2 text-xs text-muted-foreground">
          Ao gerar a foto, anexe DUAS imagens: a imagem principal da personagem para manter a
          identidade e a imagem do produto para manter sua aparência. O produto será apresentado da
          forma apropriada à categoria — vestido, aplicado, usado, demonstrado ou de outra maneira
          coerente — sem obrigação de estar na mão.
        </p>

        {prompt ? (
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-xl border border-border bg-secondary/40 p-4 text-sm leading-relaxed">
            {prompt}
          </pre>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Gere o prompt da personagem apresentando ou demonstrando este produto da forma
              apropriada à categoria.
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
              Envie a imagem vertical criada no GPT. Ela será o primeiro frame do vídeo e a única
              referência visual da produção.
            </p>
            {analise === "analisando" ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Lendo a foto para manter a
                continuidade do vídeo...
              </p>
            ) : null}
            {analise === "ok" && fotoUrl ? (
              <p className="text-xs text-muted-foreground">
                Foto lida: pose, modo de interação e estado do produto serão respeitados nos prompts.
              </p>
            ) : null}
            {analise === "falhou" ? (
              <p className="text-xs text-destructive">
                Não foi possível ler a foto automaticamente. Ela será analisada de novo ao gerar os
                roteiros.
              </p>
            ) : null}
            {fotoUrl ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => {
                  onFoto("");
                  setAnalise("ocioso");
                  if (entrada.current) entrada.current.value = "";
                }}
              >
                <Trash2 className="size-4" /> Excluir foto
              </Button>
            ) : null}
            <Button
              className="h-12 w-full gap-2 text-base"
              disabled={!fotoUrl || analise === "analisando"}
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
