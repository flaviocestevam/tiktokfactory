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
      { title: "Novo produto | StudioIA" },
      { name: "description", content: "Cadastre um produto por link ou manualmente." },
      { property: "og:title", content: "Novo produto | StudioIA" },
      { property: "og:description", content: "Cadastre um produto por link ou manualmente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NovoProduto,
});

function NovoProduto() {
  const [valores, setValores] = useState<ProductDraft>({ imagens: [] });
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function salvar() {
    const nome = typeof valores.nome === "string" ? valores.nome.trim() : "";
    if (!nome) return toast.error("Informe ao menos o nome do produto.");
    setSalvando(true);
    try {
      await criar("products", montarPayloadProduto(valores));
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto cadastrado.");
      navigate({ to: "/produtos" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <PageHeader titulo="Novo produto" descricao="Cole o link da página de vendas ou preencha manualmente." />
      <ProductForm valores={valores} onChange={setValores} onSalvar={salvar} salvando={salvando} />
    </>
  );
}