import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ProductForm, type ProductDraft } from "@/components/ProductForm";
import { montarPayloadProduto } from "@/lib/produto";
import { criar } from "@/lib/queries";

export const Route = createFileRoute("/produtos/novo")({
  head: () => ({
    meta: [
      { title: "Novo produto | TikTok Factory" },
      {
        name: "description",
        content: "Cole o título e a descrição do produto para criar conteúdo.",
      },
      { property: "og:title", content: "Novo produto | TikTok Factory" },
      {
        property: "og:description",
        content: "Cole o título e a descrição do produto para criar conteúdo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NovoProduto,
});

function NovoProduto() {
  const [valores, setValores] = useState<ProductDraft>({});
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function salvar() {
    const texto = String(valores.descricao_colada ?? "").trim();
    if (texto.length < 10) {
      return toast.error("Cole o título e a descrição do produto.");
    }

    setSalvando(true);
    try {
      await criar("products", montarPayloadProduto(valores));
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto salvo. A IA usará esse texto nos roteiros.");
      navigate({ to: "/produtos" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <PageHeader
        titulo="Novo produto"
        descricao="Copie o título e a descrição da página e cole tudo no campo abaixo."
      />
      <ProductForm
        valores={valores}
        onChange={setValores}
        onSalvar={salvar}
        salvando={salvando}
      />
    </>
  );
}
