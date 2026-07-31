import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Página em Branco" },
      { name: "description", content: "Uma página em branco." },
      { property: "og:title", content: "Página em Branco" },
      { property: "og:description", content: "Uma página em branco." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <div className="min-h-screen bg-background" />;
}
