import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { TextField } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | StudioIA" },
      { name: "description", content: "Ajuste seus dados de perfil no StudioIA." },
      { property: "og:title", content: "Configurações | StudioIA" },
      { property: "og:description", content: "Ajuste seus dados de perfil no StudioIA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  const perfil = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada.");
      const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).maybeSingle();
      return { ...data, email: data?.email ?? auth.user.email ?? "", id: auth.user.id };
    },
  });

  useEffect(() => {
    if (perfil.data?.nome) setNome(perfil.data.nome);
  }, [perfil.data]);

  async function salvar() {
    if (!perfil.data?.id) return;
    setSalvando(true);
    const { error } = await supabase.from("profiles").update({ nome }).eq("id", perfil.data.id);
    setSalvando(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado.");
  }

  if (perfil.isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <>
      <PageHeader titulo="Configurações" descricao="Seus dados de conta no StudioIA." />
      <div className="max-w-lg space-y-4 rounded-2xl border border-border bg-card p-5">
        <TextField label="Nome" value={nome} onChange={setNome} />
        <TextField label="E-mail" value={perfil.data?.email ?? ""} onChange={() => {}} />
        <p className="text-xs text-muted-foreground">Plano atual: {perfil.data?.plano ?? "free"}</p>
        <Button onClick={salvar} disabled={salvando}>
          Salvar alterações
        </Button>
      </div>
    </>
  );
}