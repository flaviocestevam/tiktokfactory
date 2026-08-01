import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { contar } from "@/lib/queries";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | TikTok Factory" },
      {
        name: "description",
        content: "Informações do espaço de trabalho interno do TikTok Factory.",
      },
      { property: "og:title", content: "Configurações | TikTok Factory" },
      {
        property: "og:description",
        content: "Informações do espaço de trabalho interno do TikTok Factory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const resumo = useQuery({
    queryKey: ["resumo-workspace"],
    queryFn: async () => ({
      produtos: await contar("products"),
      personagens: await contar("characters"),
      projetos: await contar("projects"),
    }),
  });

  if (resumo.isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  const itens = [
    { rotulo: "Produtos", valor: resumo.data?.produtos ?? 0 },
    { rotulo: "Personagens", valor: resumo.data?.personagens ?? 0 },
    { rotulo: "Projetos", valor: resumo.data?.projetos ?? 0 },
  ];

  return (
    <>
      <PageHeader
        titulo="Configurações"
        descricao="Ferramenta interna e privada, sem login e com um único espaço de trabalho compartilhado."
      />
      <div className="grid max-w-2xl grid-cols-2 gap-3">
        {itens.map((i) => (
          <div key={i.rotulo} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <p className="truncate text-sm text-muted-foreground">{i.rotulo}</p>
            <p className="mt-1 text-[clamp(1.25rem,1rem+1.2vw,1.75rem)] font-bold tabular-nums">
              {i.valor}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 max-w-2xl text-xs text-muted-foreground">
        Todo o acesso ao banco acontece no servidor. O navegador não conversa direto com o banco de
        dados.
      </p>
    </>
  );
}
