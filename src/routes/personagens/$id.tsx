import { useRef, useState } from "react";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, ImagePlus, Loader2, Maximize2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ROTULOS_FOTO,
  TIPOS_AUXILIARES,
  type TipoFoto,
  confirmarIdentidade,
  enviarFoto,
  lerAuxiliares,
  removerFoto,
  validarImagem,
} from "@/lib/fotos";
import { obter } from "@/lib/queries";

export const Route = createFileRoute("/personagens/$id")({
  head: () => ({
    meta: [
      { title: "Editar personagem | TikTok Factory" },
      { name: "description", content: "Cadastre a foto canônica e as imagens de referência da personagem." },
      { property: "og:title", content: "Editar personagem | TikTok Factory" },
      { property: "og:description", content: "Cadastre a foto canônica e as imagens de referência da personagem." },
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
  const [tipoAuxiliar, setTipoAuxiliar] = useState<TipoFoto>("rosto");
  const entradaPrincipal = useRef<HTMLInputElement>(null);
  const entradaAuxiliar = useRef<HTMLInputElement>(null);

  const { data: p, isLoading } = useQuery({
    queryKey: ["character", id],
    queryFn: () => obter("characters", id),
  });

  function atualizarCaches() {
    queryClient.invalidateQueries({ queryKey: ["character", id] });
    queryClient.invalidateQueries({ queryKey: ["characters"] });
  }

  const upload = useMutation({
    mutationFn: ({ arquivo, tipo }: { arquivo: File; tipo: TipoFoto }) => enviarFoto(id, tipo, arquivo),
    onSuccess: (_d, v) => {
      atualizarCaches();
      toast.success(
        v.tipo === "canonica" ? "Foto canônica cadastrada com sucesso." : "Foto de referência cadastrada.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: ({ tipo, fotoId }: { tipo: TipoFoto; fotoId?: string }) => removerFoto(id, tipo, fotoId),
    onSuccess: () => {
      atualizarCaches();
      toast.success("Foto removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmar = useMutation({
    mutationFn: (confirmada: boolean) => confirmarIdentidade(id, confirmada),
    onSuccess: (_d, confirmada) => {
      atualizarCaches();
      toast.success(confirmada ? "Identidade visual confirmada." : "Confirmação removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function selecionar(arquivo: File | undefined, tipo: TipoFoto) {
    if (!arquivo) return;
    const erro = validarImagem(arquivo);
    if (erro) return toast.error(erro);
    upload.mutate({ arquivo, tipo });
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

  const auxiliares = lerAuxiliares(p.fotos_canonicas_auxiliares);
  const enviando = upload.isPending;

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
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Identidade visual da personagem</h2>
          {p.identidade_visual_confirmada ? (
            <Badge className="gap-1">
              <BadgeCheck className="size-3.5" /> Identidade confirmada
            </Badge>
          ) : (
            <Badge variant="secondary">Identidade não confirmada</Badge>
          )}
        </header>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Esta é a imagem principal usada para representar a personagem e preservar sua identidade nos
          prompts de imagem e vídeo.
        </p>

        <input
          ref={entradaPrincipal}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            selecionar(e.target.files?.[0], "canonica");
            e.target.value = "";
          }}
        />

        <div className="grid gap-5 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary/40">
            {p.foto_canonica_principal ? (
              <img
                src={p.foto_canonica_principal}
                alt={`Foto canônica de ${p.nome_exibicao || p.nome}`}
                className="aspect-[3/4] w-full object-contain"
              />
            ) : (
              <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 p-6 text-center">
                <ImagePlus className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Foto canônica ainda não cadastrada</p>
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
                  <Upload className="size-4" />{" "}
                  {p.foto_canonica_principal ? "TROCAR FOTO" : "ENVIAR FOTO CANÔNICA"}
                </>
              )}
            </Button>

            {p.foto_canonica_principal ? (
              <>
                <Button
                  variant="outline"
                  className="min-h-11 w-full"
                  onClick={() => setAmpliada(p.foto_canonica_principal)}
                >
                  <Maximize2 className="size-4" /> AMPLIAR
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 w-full"
                  disabled={confirmar.isPending}
                  onClick={() => confirmar.mutate(!p.identidade_visual_confirmada)}
                >
                  <BadgeCheck className="size-4" />{" "}
                  {p.identidade_visual_confirmada ? "DESFAZER CONFIRMAÇÃO" : "CONFIRMAR COMO FOTO CANÔNICA"}
                </Button>
                <Button
                  variant="outline"
                  className="min-h-11 w-full text-destructive"
                  disabled={remover.isPending}
                  onClick={() => remover.mutate({ tipo: "canonica" })}
                >
                  <Trash2 className="size-4" /> REMOVER FOTO
                </Button>
              </>
            ) : null}

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              JPG, JPEG, PNG ou WEBP · até 10 MB. A foto canônica é a referência mais importante da
              personagem e nunca é misturada com outras influenciadoras.
            </p>
          </div>
        </div>
      </section>

      <section className="surface mt-5 space-y-4 p-5 sm:p-6">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold">Imagens auxiliares</h2>
          <p className="text-sm text-muted-foreground">
            Complementam rosto, cabelo, corpo, proporções e expressões. Servem apenas como apoio à foto
            canônica principal.
          </p>
        </header>

        <input
          ref={entradaAuxiliar}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            selecionar(e.target.files?.[0], tipoAuxiliar);
            e.target.value = "";
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={tipoAuxiliar}
            onChange={(e) => setTipoAuxiliar(e.target.value as TipoFoto)}
            className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm"
            aria-label="Tipo da foto de referência"
          >
            {TIPOS_AUXILIARES.map((t) => (
              <option key={t} value={t}>
                {ROTULOS_FOTO[t]}
              </option>
            ))}
          </select>
          <Button
            className="min-h-11"
            disabled={enviando}
            onClick={() => entradaAuxiliar.current?.click()}
          >
            {enviando ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Enviando foto...
              </>
            ) : (
              <>
                <ImagePlus className="size-4" /> ADICIONAR FOTO DE REFERÊNCIA
              </>
            )}
          </Button>
        </div>

        {auxiliares.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma imagem auxiliar cadastrada.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auxiliares.map((f) => (
              <figure key={f.id} className="overflow-hidden rounded-2xl border border-border">
                <img
                  src={f.url}
                  alt={f.rotulo || ROTULOS_FOTO[f.tipo]}
                  loading="lazy"
                  className="aspect-[3/4] w-full bg-secondary/40 object-contain"
                />
                <figcaption className="space-y-2 p-3">
                  <p className="text-xs font-medium">{f.rotulo || ROTULOS_FOTO[f.tipo]}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setAmpliada(f.url)}>
                      Ampliar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={enviando}
                      onClick={() => {
                        setTipoAuxiliar(f.tipo);
                        entradaAuxiliar.current?.click();
                      }}
                    >
                      Substituir
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      disabled={remover.isPending}
                      onClick={() => remover.mutate({ tipo: f.tipo, fotoId: f.id })}
                    >
                      Remover
                    </Button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!ampliada} onOpenChange={(o) => !o && setAmpliada(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">Foto ampliada</DialogTitle>
          {ampliada ? (
            <img src={ampliada} alt="Foto ampliada da personagem" className="max-h-[80vh] w-full object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
