import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { contar } from "@/lib/queries";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | StudioIA" },
      { name: "description", content: "Informações do espaço de trabalho interno do StudioIA." },
      { property: "og:title", content: "Configurações | StudioIA" },
      { property: "og:description", content: "Informações do espaço de trabalho interno do StudioIA." },
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
      cenarios: await contar("scenarios"),
      projetos: await contar("projects"),
      templates: await contar("templates"),
    }),
  });

  if (resumo.isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  const itens = [
    { rotulo: "Produtos", valor: resumo.data?.produtos ?? 0 },
    { rotulo: "Personagens", valor: resumo.data?.personagens ?? 0 },
    { rotulo: "Cenários", valor: resumo.data?.cenarios ?? 0 },
    { rotulo: "Projetos", valor: resumo.data?.projetos ?? 0 },
    { rotulo: "Templates", valor: resumo.data?.templates ?? 0 },
  ];

  return (
    <>
      <PageHeader
        titulo="Configurações"
        descricao="Ferramenta interna e privada, sem login e com um único espaço de trabalho compartilhado."
      />
      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        {itens.map((i) => (
          <div key={i.rotulo} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{i.rotulo}</p>
            <p className="mt-1 text-2xl font-bold">{i.valor}</p>
          </div>
        ))}
      </div>
      <p className="mt-5 max-w-2xl text-xs text-muted-foreground">
        Todo o acesso ao banco acontece no servidor. O navegador não conversa direto com o banco de dados.
      </p>
    </>
  );
}