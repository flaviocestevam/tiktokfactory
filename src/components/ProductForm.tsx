import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link2, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { analisarProduto } from "@/lib/produtos.functions";
import { enviarArquivo } from "@/lib/queries";
import { AreaField, TextField } from "@/components/Field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type ProductDraft = { imagens?: string[]; [key: string]: string | string[] | undefined };

export const CAMPOS_PRODUTO: Array<{
  chave: string;
  label: string;
  area?: boolean;
  rows?: number;
}> = [
  { chave: "nome", label: "Nome do produto" },
  { chave: "marca", label: "Marca" },
  { chave: "categoria", label: "Categoria" },
  { chave: "preco", label: "Preço" },
  { chave: "preco_promocional", label: "Preço promocional" },
  { chave: "tamanho", label: "Tamanho" },
  { chave: "cores", label: "Cores" },
  { chave: "variacoes", label: "Variações" },
  { chave: "publico", label: "Público indicado" },
  { chave: "descricao", label: "Descrição", area: true },
  { chave: "beneficios", label: "Benefícios informados pelo vendedor", area: true },
  { chave: "caracteristicas", label: "Características", area: true },
  { chave: "ingredientes", label: "Ingredientes", area: true },
  { chave: "modo_de_uso", label: "Modo de uso", area: true },
  { chave: "informacoes_tecnicas", label: "Informações técnicas", area: true },
  { chave: "avaliacoes", label: "Avaliações disponíveis", area: true },
  { chave: "duvidas_frequentes", label: "Perguntas frequentes", area: true },
  { chave: "advertencias", label: "Advertências", area: true },
  { chave: "restricoes", label: "Restrições", area: true },
  { chave: "diferenciais", label: "Diferenciais", area: true },
  { chave: "entrega", label: "Informações de entrega", area: true },
  { chave: "garantias", label: "Garantias", area: true },
  { chave: "oferta", label: "Informações importantes da oferta", area: true },
];

export function ProductForm({
  valores,
  onChange,
  onSalvar,
  salvando,
  rotuloSalvar = "Salvar produto",
}: {
  valores: ProductDraft;
  onChange: (v: ProductDraft) => void;
  onSalvar: () => void;
  salvando: boolean;
  rotuloSalvar?: string;
}) {
  const extrair = useServerFn(extrairProduto);
  const [extraindo, setExtraindo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const set = (chave: string, valor: string) => onChange({ ...valores, [chave]: valor });
  const txt = (chave: string) => {
    const v = valores[chave];
    return typeof v === "string" ? v : "";
  };

  async function lerLink() {
    if (!txt("link").trim()) return toast.error("Cole o link da página de vendas.");
    setExtraindo(true);
    setAviso(null);
    try {
      const res = await extrair({ data: { url: txt("link").trim() } });
      const novos: ProductDraft = { ...valores };
      Object.entries(res.dados ?? {}).forEach(([k, v]) => {
        const atual = typeof novos[k] === "string" ? (novos[k] as string) : "";
        if (String(v ?? "").trim() && !atual.trim()) novos[k] = String(v);
      });
      if (res.imagens?.length) {
        novos.imagens = [...new Set([...(valores.imagens ?? []), ...res.imagens])].slice(0, 12);
      }
      novos.status_extracao = res.ok ? "extraido" : "falhou";
      onChange(novos);
      setAviso(res.mensagem);
      if (res.ok) toast.success("Leitura concluída. Revise os campos.");
      else toast.warning(res.mensagem);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao ler a página.";
      setAviso(
        "Não foi possível ler todas as informações desta página. Complete ou cole os dados manualmente.",
      );
      toast.error(msg);
    } finally {
      setExtraindo(false);
    }
  }

  async function enviarImagens(files: FileList | null) {
    if (!files?.length) return;
    setEnviando(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 8)) {
        const url = await enviarArquivo("produtos", file);
        if (url) urls.push(url);
      }
      onChange({ ...valores, imagens: [...(valores.imagens ?? []), ...urls] });
      toast.success("Imagens enviadas.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar imagens.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-base font-semibold">Link da página de vendas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A leitura acontece no servidor. Se a página bloquear o acesso, preencha manualmente.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input
            value={txt("link")}
            onChange={(e) => set("link", e.target.value)}
            placeholder="https://..."
          />
          <Button
            type="button"
            onClick={lerLink}
            disabled={extraindo}
            className="h-11 w-full gap-2 sm:w-48"
          >
            {extraindo ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            {extraindo ? "Lendo..." : "Extrair informações"}
          </Button>
        </div>
        {aviso ? (
          <Alert className="mt-4">
            <AlertDescription>{aviso}</AlertDescription>
          </Alert>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="mb-4 text-base font-semibold">Informações do produto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CAMPOS_PRODUTO.filter((c) => !c.area).map((c) => (
            <TextField
              key={c.chave}
              label={c.label}
              value={txt(c.chave)}
              onChange={(v) => set(c.chave, v)}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-4">
          {CAMPOS_PRODUTO.filter((c) => c.area).map((c) => (
            <AreaField
              key={c.chave}
              label={c.label}
              rows={3}
              value={txt(c.chave)}
              onChange={(v) => set(c.chave, v)}
            />
          ))}
          <AreaField
            label="Informações adicionais sobre o produto"
            rows={8}
            hint="Cole aqui a descrição completa da página de vendas."
            value={txt("dados_adicionais")}
            onChange={(v) => set("dados_adicionais", v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-base font-semibold">Imagens do produto</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary">
            {enviando ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            Enviar imagens
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => enviarImagens(e.target.files)}
            />
          </label>
        </div>
        {valores.imagens?.length ? (
          // Grade fluida: colunas nascem conforme a largura, sem breakpoints rígidos
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
            {valores.imagens.map((url) => (
              <div
                key={url}
                className="group relative overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={url}
                  alt="Imagem do produto"
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Remover imagem"
                  onClick={() =>
                    onChange({
                      ...valores,
                      imagens: (valores.imagens ?? []).filter((u) => u !== url),
                    })
                  }
                  className="absolute right-1 top-1 rounded-md bg-background/85 p-1.5 opacity-100 transition-opacity group-hover:opacity-100 sm:opacity-0"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma imagem enviada ainda.</p>
        )}
      </section>

      <div className="flex justify-stretch gap-2 sm:justify-end">
        <Button onClick={onSalvar} disabled={salvando} className="h-11 w-full gap-2 sm:w-auto">
          {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
          {rotuloSalvar}
        </Button>
      </div>
    </div>
  );
}
