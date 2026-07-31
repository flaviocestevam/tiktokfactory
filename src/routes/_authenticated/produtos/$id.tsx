import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { ProductForm, type ProductDraft } from "@/components/ProductForm";
import { Skeleton } from "@/components/ui/skeleton";
import { montarPayloadProduto, produtoParaDraft } from "@/lib/produto";
import { obterUsuarioId } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/produtos/$id")({
  head: () => ({
    meta: [
      { title: "Editar produto | StudioIA" },
      { name: "description", content: "Revise e complete as informações do produto." },
      { property: "og:title", content: "Editar produto | StudioIA" },
      { property: "og:description", content: "Revise e complete as informações do produto." },
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
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    if (data) setValores(produtoParaDraft(data as unknown as Record<string, unknown>));
  }, [data]);

  async function salvar() {
    if (!valores) return;
    setSalvando(true);
    try {
      const user_id = await obterUsuarioId();
      const { error } = await supabase.from("products").update(montarPayloadProduto(valores, user_id)).eq("id", id);
      if (error) throw new Error(error.message);
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
      <PageHeader titulo="Editar produto" descricao="Complete as informações que faltarem." />
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