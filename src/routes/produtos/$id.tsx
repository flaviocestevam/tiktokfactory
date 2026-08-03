import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ProductForm, type ProductDraft } from "@/components/ProductForm";
import { Skeleton } from "@/components/ui/skeleton";
import { montarPayloadProduto, produtoParaDraft } from "@/lib/produto";
import { atualizar, obter } from "@/lib/queries";

export const Route = createFileRoute("/produtos/$id")({
  head: () => ({
    meta: [
      { title: "Editar produto | TikTok Factory" },
      { name: "description", content: "Atualize manualmente as informações do produto." },
      { property: "og:title", content: "Editar produto | TikTok Factory" },
      { property: "og:description", content: "Atualize manualmente as informações do produto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditarProduto,
});

function EditarProduto() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [valores, setValores] = useState<ProductDraft | null>(null);
  const [salvando, setSalvando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => obter("products", id),
  });

  useEffect(() => {
    if (data) setValores(produtoParaDraft(data as unknown as Record<string, unknown>));
  }, [data]);

  async function salvar() {
    if (!valores) return;

    const nome = typeof valores.nome === "string" ? valores.nome.trim() : "";
    const descricao = typeof valores.descricao === "string" ? valores.descricao.trim() : "";
    const beneficios = typeof valores.beneficios === "string" ? valores.beneficios.trim() : "";

    if (!nome) return toast.error("Informe o nome do produto.");
    if (!descricao) return toast.error("Informe a descrição do produto.");
    if (!beneficios) return toast.error("Informe os principais benefícios.");

    setSalvando(true);
    try {
      await atualizar("products", id, montarPayloadProduto(valores));
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
      toast.success("Produto atualizado.");
      navigate({ to: "/produtos" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (isLoading || !valores) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <>
      <PageHeader
        titulo="Editar produto"
        descricao="Atualize manualmente as informações usadas nos roteiros e CTAs."
      />
      <ProductForm
        valores={valores}
        onChange={setValores}
        onSalvar={salvar}
        salvando={salvando}
        rotuloSalvar="Salvar alterações"
      />
    </>
  );
}
