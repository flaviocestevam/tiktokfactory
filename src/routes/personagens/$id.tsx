import { useEffect, useRef, useState } from "react";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Loader2, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { enviarFoto, removerFoto, validarImagem } from "@/lib/fotos";
import { atualizar, obter } from "@/lib/queries";

const CAMPOS_BIO = [
  { campo: "biografia", rotulo: "Biografia pública", linhas: 4 },
  { campo: "biografia_interna", rotulo: "Biografia interna", linhas: 4 },
  { campo: "historia_pessoal", rotulo: "História pessoal", linhas: 4 },
  { campo: "personalidade", rotulo: "Personalidade", linhas: 3 },
  { campo: "posicionamento", rotulo: "Posicionamento", linhas: 3 },
  { campo: "promessa_central", rotulo: "Promessa central", linhas: 2 },
  { campo: "publico_principal", rotulo: "Público principal", linhas: 2 },
  { campo: "dores_publico", rotulo: "Dores do público", linhas: 3 },
  { campo: "desejos_publico", rotulo: "Desejos do público", linhas: 3 },
  { campo: "pilares_conteudo", rotulo: "Pilares de conteúdo", linhas: 3 },
  { campo: "tipo_comunicacao", rotulo: "Tipo de comunicação", linhas: 2 },
  { campo: "estilo_humor", rotulo: "Estilo de humor", linhas: 2 },
  { campo: "vocabulario", rotulo: "Vocabulário", linhas: 2 },
  { campo: "bordoes", rotulo: "Bordões", linhas: 2 },
  { campo: "palavras_proibidas", rotulo: "Palavras proibidas", linhas: 2 },
] as const;

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
  const [bio, setBio] = useState<Record<string, string>>({});
  const entradaPrincipal = useRef<HTMLInputElement>(null);

  const { data: p, isLoading } = useQuery({
    queryKey: ["character", id],
    queryFn: () => obter("characters", id),
  });

  function atualizarCaches() {
    queryClient.invalidateQueries({ queryKey: ["character", id] });
    queryClient.invalidateQueries({ queryKey: ["characters"] });
  }

  useEffect(() => {
    if (!p) return;
    const inicial: Record<string, string> = {};
    for (const { campo } of CAMPOS_BIO) {
      inicial[campo] = ((p as Record<string, unknown>)[campo] as string | null) ?? "";
    }
    setBio(inicial);
  }, [p]);

  const salvarBio = useMutation({
    mutationFn: () => atualizar("characters", id, bio),
    onSuccess: () => {
      atualizarCaches();
      toast.success("Textos da personagem salvos.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
                  <Upload className="size-4" /> {foto ? "EDITAR FOTO DO PERFIL" : "CADASTRAR FOTO DO PERFIL"}
                </>
              )}
            </Button>

            {foto ? (
              <>
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

      <section className="surface mt-5 space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-semibold">Textos da personagem</h2>
          <p className="text-sm text-muted-foreground">
            Estes textos definem comportamento e comunicação usados na geração dos roteiros.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {CAMPOS_BIO.map(({ campo, rotulo, linhas }) => (
            <div key={campo} className="space-y-1.5">
              <Label htmlFor={campo}>{rotulo}</Label>
              <Textarea
                id={campo}
                rows={linhas}
                value={bio[campo] ?? ""}
                onChange={(e) => setBio((b) => ({ ...b, [campo]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <Button
          className="min-h-11 w-full sm:w-auto"
          disabled={salvarBio.isPending}
          onClick={() => salvarBio.mutate()}
        >
          {salvarBio.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          SALVAR TEXTOS
        </Button>
      </section>
    </>
  );
}
