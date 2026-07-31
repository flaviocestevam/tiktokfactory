import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar no StudioIA" },
      { name: "description", content: "Acesse sua conta para criar campanhas de vídeo para TikTok Shop." },
      { property: "og:title", content: "Entrar no StudioIA" },
      { property: "og:description", content: "Acesse sua conta para criar campanhas de vídeo para TikTok Shop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [nome, setNome] = useState("");
  const [cadEmail, setCadEmail] = useState("");
  const [cadSenha, setCadSenha] = useState("");
  const [recEmail, setRecEmail] = useState("");

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginSenha });
    setCarregando(false);
    if (error) return toast.error(traduzir(error.message));
    toast.success("Bem-vinda de volta!");
    navigate({ to: "/dashboard" });
  }

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (cadSenha.length < 6) return toast.error("A senha precisa ter pelo menos 6 caracteres.");
    setCarregando(true);
    const { error } = await supabase.auth.signUp({
      email: cadEmail,
      password: cadSenha,
      options: { data: { nome }, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setCarregando(false);
    if (error) return toast.error(traduzir(error.message));
    toast.success("Conta criada! Verifique seu e-mail se a confirmação estiver ativa.");
    navigate({ to: "/dashboard" });
  }

  async function recuperar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(recEmail, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setCarregando(false);
    if (error) return toast.error(traduzir(error.message));
    toast.success("Enviamos um link de recuperação para o seu e-mail.");
  }

  async function entrarComGoogle() {
    setCarregando(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setCarregando(false);
      return toast.error("Não foi possível entrar com o Google.");
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wand2 className="size-5" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">
            Studio<span className="text-primary">IA</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Campanhas de vídeo para TikTok Shop com influenciadoras de IA.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="cadastrar">Cadastro</TabsTrigger>
              <TabsTrigger value="recuperar">Senha</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar" className="mt-5">
              <form onSubmit={entrar} className="space-y-4">
                <Campo id="login-email" label="E-mail" type="email" value={loginEmail} onChange={setLoginEmail} />
                <Campo id="login-senha" label="Senha" type="password" value={loginSenha} onChange={setLoginSenha} />
                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="cadastrar" className="mt-5">
              <form onSubmit={cadastrar} className="space-y-4">
                <Campo id="cad-nome" label="Nome" type="text" value={nome} onChange={setNome} />
                <Campo id="cad-email" label="E-mail" type="email" value={cadEmail} onChange={setCadEmail} />
                <Campo id="cad-senha" label="Senha" type="password" value={cadSenha} onChange={setCadSenha} />
                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? <Loader2 className="size-4 animate-spin" /> : "Criar conta"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="recuperar" className="mt-5">
              <form onSubmit={recuperar} className="space-y-4">
                <Campo id="rec-email" label="E-mail da conta" type="email" value={recEmail} onChange={setRecEmail} />
                <Button type="submit" className="w-full" disabled={carregando}>
                  {carregando ? <Loader2 className="size-4 animate-spin" /> : "Enviar link de recuperação"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={entrarComGoogle} disabled={carregando}>
            Continuar com o Google
          </Button>
        </div>
      </div>
    </div>
  );
}

function Campo({
  id,
  label,
  type,
  value,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} required onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function traduzir(mensagem: string) {
  if (/invalid login credentials/i.test(mensagem)) return "E-mail ou senha incorretos.";
  if (/already registered/i.test(mensagem)) return "Este e-mail já possui conta. Faça login.";
  if (/email not confirmed/i.test(mensagem)) return "Confirme seu e-mail antes de entrar.";
  return mensagem;
}