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
      { name: "description", content: "Cadastre manualmente as informações do produto." },
      { property: "og:title", content: "Novo produto | TikTok Factory" },
      { property: "og:description", content: "Cadastre manualmente as informações do produto." },
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
    const nome = typeof valores.nome === "string" ? valores.nome.trim() : "";
    const descricao = typeof valores.descricao === "string" ? valores.descricao.trim() : "";
    const beneficios = typeof valores.beneficios === "string" ? valores.beneficios.trim() : "";

    if (!nome) return toast.error("Informe o nome do produto.");
    if (!descricao) return toast.error("Informe a descrição do produto.");
    if (!beneficios) return toast.error("Informe os principais benefícios.");

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
      <PageHeader
        titulo="Novo produto"
        descricao="Preencha manualmente as informações que serão usadas nos roteiros e CTAs."
      />
      <ProductForm valores={valores} onChange={setValores} onSalvar={salvar} salvando={salvando} />
    </>
  );
}
