import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CircleOff } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { obterStatusIntegracoes } from "@/lib/integracoes.functions";
import { contar } from "@/lib/queries";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | TikTok Factory" },
      {
        name: "description",
        content: "Estado do espaço de trabalho do TikTok Factory.",
      },
      { property: "og:title", content: "Configurações | TikTok Factory" },
      {
        property: "og:description",
        content: "Estado do espaço de trabalho do TikTok Factory.",
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

  const integracoes = useQuery({
    queryKey: ["status-integracoes"],
    queryFn: () => obterStatusIntegracoes(),
    refetchOnWindowFocus: true,
  });

  if (resumo.isLoading || integracoes.isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  const itens = [
    { rotulo: "Produtos", valor: resumo.data?.produtos ?? 0 },
    { rotulo: "Personagens", valor: resumo.data?.personagens ?? 0 },
    { rotulo: "Produções", valor: resumo.data?.projetos ?? 0 },
  ];
  const status = integracoes.data;

  return (
    <>
      <PageHeader
        titulo="Configurações"
        descricao="Estado do espaço de trabalho e dos recursos usados no fluxo."
      />

      <div className="grid max-w-2xl grid-cols-2 gap-3">
        {itens.map((item) => (
          <div key={item.rotulo} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <p className="truncate text-sm text-muted-foreground">{item.rotulo}</p>
            <p className="mt-1 text-[clamp(1.25rem,1rem+1.2vw,1.75rem)] font-bold tabular-nums">
              {item.valor}
            </p>
          </div>
        ))}
      </div>

      <section className="surface mt-6 max-w-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Cadastro de produtos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Os produtos são cadastrados manualmente pelo formulário, com controle total das informações usadas nos roteiros.
            </p>
          </div>
          <Badge variant={status?.pronto_para_cadastrar_produto ? "default" : "secondary"}>
            {status?.pronto_para_cadastrar_produto ? "PRONTO" : "CONFIGURAR BANCO"}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatusItem nome="Banco de dados" ativo={status?.banco ?? false} />
          <StatusItem nome="Acesso administrativo" ativo={status?.banco_admin ?? false} />
        </div>
      </section>

      <section className="surface mt-4 max-w-3xl p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Geração de conteúdo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Banco e inteligência artificial são usados para foto, roteiros e clipes.
            </p>
          </div>
          <Badge variant={status?.pronto_para_gerar_conteudo ? "default" : "secondary"}>
            {status?.pronto_para_gerar_conteudo ? "PRONTO" : "CONFIGURAR"}
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatusItem nome="Banco de dados" ativo={status?.banco ?? false} />
          <StatusItem nome="Acesso administrativo" ativo={status?.banco_admin ?? false} />
          <StatusItem
            nome="Inteligência artificial"
            ativo={status?.inteligencia_artificial ?? false}
          />
        </div>
      </section>

      <p className="mt-5 max-w-3xl text-xs text-muted-foreground">
        Esta tela mostra apenas se cada recurso está disponível. Nenhuma chave ou valor secreto é enviado ao navegador.
      </p>
    </>
  );
}

function StatusItem({ nome, ativo }: { nome: string; ativo: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-3">
      {ativo ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
      ) : (
        <CircleOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium">{nome}</p>
        <p className="text-xs text-muted-foreground">{ativo ? "Configurado" : "Não configurado"}</p>
      </div>
    </div>
  );
}
