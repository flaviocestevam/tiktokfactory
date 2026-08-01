import { useRef, useState } from "react";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Loader2, Maximize2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { enviarFoto, removerFoto, validarImagem } from "@/lib/fotos";
import { obter } from "@/lib/queries";

const DESCRICAO = "Cadastre a foto do perfil usada para identificar a personagem na interface.";

export const Route = createFileRoute("/personagens/$id")({
  head: () => ({
    meta: [
      { title: "Editar personagem | TikTok Factory" },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: "Editar personagem | TikTok Factory" },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditarPersonagem,
});

function EditarPersonagem() {
  const { id } = useParams({ from: "/personagens/$id" });
  const queryClient = useQueryClient();
  const [ampliada, setAmpliada] = useState<string | null>(null);
  const entradaPrincipal = useRef<HTMLInputElement>(null);

  const { data: p, isLoading } = useQuery({
    queryKey: ["character", id],
    queryFn: () => obter("characters", id),
  });

  function atualizarCaches() {
    queryClient.invalidateQueries({ queryKey: ["character", id] });
    queryClient.invalidateQueries({ queryKey: ["characters"] });
  }

  const upload = useMutation({
    mutationFn: (arquivo: File) => enviarFoto(id, "canonica", arquivo),
    onSuccess: () => {
      atualizarCaches();
      toast.success("Foto do perfil salva.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: () => removerFoto(id, "canonica"),
    onSuccess: () => {
      atualizarCaches();
      toast.success("Foto removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function selecionar(arquivo: File | undefined) {
    if (!arquivo) return;
    const erro = validarImagem(arquivo);
    if (erro) return toast.error(erro);
    upload.mutate(arquivo);
  }

  if (isLoading) return <Skeleton className="h-[70vh] rounded-2xl" />;
  if (!p) {
    return (
      <div className="surface p-6">
        <p className="text-sm text-muted-foreground">Personagem não encontrada.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/personagens">Voltar</Link>
        </Button>
      </div>
    );
  }

  const enviando = upload.isPending;
  const foto = p.foto_canonica_principal as string | null;

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link to="/personagens">
          <ArrowLeft className="size-4" /> Personagens
        </Link>
      </Button>

      <PageHeader
        titulo={p.nome_exibicao || p.nome}
        descricao={[p.nicho, p.idade ? `${p.idade} anos` : null].filter(Boolean).join(" · ")}
      />

      <section className="surface space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Foto de identificação</h2>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Esta foto é usada apenas para identificar a personagem nos cards e no fluxo de criação.
        </p>

        <input
          ref={entradaPrincipal}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            selecionar(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary/40">
            {foto ? (
              <img
                src={foto}
                alt={`Foto do perfil de ${p.nome_exibicao || p.nome}`}
                className="aspect-[3/4] w-full object-contain"
              />
            ) : (
              <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 p-6 text-center">
                <ImagePlus className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Foto do perfil ainda não cadastrada.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="min-h-11 w-full"
              disabled={enviando}
              onClick={() => entradaPrincipal.current?.click()}
            >
              {enviando ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Enviando foto...
                </>
              ) : (
                <>
                  <Upload className="size-4" /> {foto ? "TROCAR FOTO DO PERFIL" : "CADASTRAR FOTO DO PERFIL"}
                </>
              )}
            </Button>

            {foto ? (
              <>
                <Button variant="outline" className="min-h-11 w-full" onClick={() => setAmpliada(foto)}>
                  <Maximize2 className="size-4" /> VISUALIZAR
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 w-full text-destructive"
                  disabled={remover.isPending}
                  onClick={() => remover.mutate()}
                >
                  <Trash2 className="size-4" /> REMOVER FOTO
                </Button>
              </>
            ) : null}

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              JPG, JPEG, PNG ou WEBP · até 10 MB. A foto do perfil não é usada em nenhuma geração de
              roteiro, imagem ou vídeo.
            </p>
          </div>
        </div>
      </section>

      <Dialog open={!!ampliada} onOpenChange={(o) => !o && setAmpliada(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Foto ampliada</DialogTitle>
          {ampliada ? (
            <img src={ampliada} alt="Foto do perfil ampliada" className="max-h-[80vh] w-full object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
