import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Film, Image as ImageIcon, ScrollText, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudioIA — Vídeos de venda para TikTok Shop com IA" },
      {
        name: "description",
        content:
          "Cadastre o produto, escolha personagem e cenário e gere roteiro, prompt de foto e prompt de vídeo para TikTok Shop.",
      },
      { property: "og:title", content: "StudioIA — Vídeos de venda para TikTok Shop com IA" },
      {
        property: "og:description",
        content: "Central de produção de campanhas de vídeo com influenciadoras de inteligência artificial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const RECURSOS = [
  { icon: Sparkles, titulo: "Estratégia", texto: "Análise honesta do produto e ao menos cinco ângulos de venda." },
  { icon: ScrollText, titulo: "Roteiro por tempo", texto: "Fala, ação, expressão, câmera e texto na tela, segundo a segundo." },
  { icon: ImageIcon, titulo: "Prompt de foto", texto: "Prompt técnico com regras de identidade e reprodução fiel do produto." },
  { icon: Film, titulo: "Prompt do Google Flow", texto: "Cena, ação, câmera, diálogo, continuidade e restrições negativas." },
  { icon: Users, titulo: "Biblioteca de personagens", texto: "Ficha completa de identidade, linguagem e aparência canônica." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6">
        <span className="font-display text-lg font-bold">
          Studio<span className="text-primary">IA</span>
        </span>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10 lg:pt-20">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-accent">
          <Sparkles className="size-3.5" /> Produção de vídeos comerciais com IA
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
          Campanhas de vídeo para TikTok Shop com influenciadoras de inteligência artificial.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Cadastre o produto ou cole o link da página de vendas, escolha cenário e formato, e receba estratégia,
          roteiro por tempo, prompt de foto e prompt de vídeo — tudo editável e pronto para copiar.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/auth">
              Começar agora <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RECURSOS.map((r) => (
            <article key={r.titulo} className="rounded-2xl border border-border bg-card p-5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-accent">
                <r.icon className="size-4.5" />
              </span>
              <h2 className="mt-4 text-base font-semibold">{r.titulo}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.texto}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
