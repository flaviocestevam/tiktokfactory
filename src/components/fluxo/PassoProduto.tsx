/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ChevronDown, Loader2, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { analisarProdutoTikTok } from "@/lib/fluxo.functions";
import { atualizar, criar, enviarArquivo } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { linkTikTokValido } from "@/lib/config";

const CAMPOS: Array<{ id: string; label: string; longo?: boolean }> = [
  { id: "nome", label: "Nome" },
  { id: "marca", label: "Marca" },
  { id: "vendedor", label: "Vendedor" },
  { id: "categoria", label: "Categoria" },
  { id: "preco", label: "Preço atual" },
  { id: "preco_promocional", label: "Preço anterior" },
  { id: "desconto", label: "Desconto" },
  { id: "cupom", label: "Cupom" },
  { id: "frete", label: "Frete" },
  { id: "avaliacoes", label: "Avaliação" },
  { id: "numero_avaliacoes", label: "Nº de avaliações" },
  { id: "quantidade_vendida", label: "Quantidade vendida" },
  { id: "tamanho", label: "Tamanho" },
  { id: "cores", label: "Cores" },
  { id: "variacoes", label: "Variações" },
  { id: "publico", label: "Público indicado" },
  { id: "descricao", label: "Descrição", longo: true },
  { id: "beneficios", label: "Benefícios informados", longo: true },
  { id: "caracteristicas", label: "Características", longo: true },
  { id: "ingredientes", label: "Ingredientes", longo: true },
  { id: "modo_de_uso", label: "Modo de uso", longo: true },
  { id: "informacoes_tecnicas", label: "Informações técnicas", longo: true },
  { id: "duvidas_frequentes", label: "Perguntas frequentes", longo: true },
  { id: "advertencias", label: "Advertências", longo: true },
  { id: "restricoes", label: "Restrições", longo: true },
  { id: "diferenciais", label: "Diferenciais", longo: true },
  { id: "garantias", label: "Garantias", longo: true },
  { id: "oferta", label: "Informações da oferta", longo: true },
];

export type ProdutoFluxo = Record<string, any>;

export function PassoProduto({
  produto,
  onProdutoSalvo,
  onContinuar,
}: {
  produto: ProdutoFluxo | null;
  onProdutoSalvo: (produto: ProdutoFluxo) => void;
  onContinuar: (produto: ProdutoFluxo) => void;
}) {
  const [link, setLink] = useState<string>(produto?.original_tiktok_url ?? "");
  const [analisando, setAnalisando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>(() => montar(produto));
  const [origem, setOrigem] = useState<Record<string, string>>(produto?.origem_dados ?? {});
  const [imagens, setImagens] = useState<string[]>(
    Array.isArray(produto?.imagens) ? (produto?.imagens as string[]) : [],
  );
  const [principal, setPrincipal] = useState<string>(produto?.imagem_principal ?? "");
  const [meta, setMeta] = useState({
    original_tiktok_url: produto?.original_tiktok_url ?? "",
    resolved_tiktok_url: produto?.resolved_tiktok_url ?? "",
    tiktok_product_id: produto?.tiktok_product_id ?? "",
    tiktok_region: produto?.tiktok_region ?? "",
  });
  const [aviso, setAviso] = useState<string | null>(null);
  const [descricaoColada, setDescricaoColada] = useState<string>(produto?.descricao_colada ?? "");
  const [editando, setEditando] = useState(false);

  function montar(p: ProdutoFluxo | null) {
    const v: Record<string, string> = {};
    for (const c of CAMPOS) v[c.id] = (p?.[c.id] as string) ?? "";
    return v;
  }

  function alterar(id: string, valor: string) {
    setValores((v) => ({ ...v, [id]: valor }));
    setOrigem((o) => ({
      ...o,
      [id]: valor.trim() ? (o[id] === "tiktok_shop" ? "manual" : o[id] || "manual") : "",
    }));
  }

  async function analisar() {
    if (!link.trim()) return toast.error("Cole o link do produto do TikTok Shop.");
    if (!linkTikTokValido(link)) {
      return toast.error("Este link não é do TikTok Shop. Cole o link copiado direto do app.");
    }
    setAnalisando(true);
    setAviso(null);
    try {
      const res = await analisarProdutoTikTok({ data: { url: link.trim() } });
      setMeta({
        original_tiktok_url: res.original_tiktok_url,
        resolved_tiktok_url: res.resolved_tiktok_url,
        tiktok_product_id: res.tiktok_product_id ?? "",
        tiktok_region: res.tiktok_region ?? "",
      });
      setValores((v) => {
        const novo = { ...v };
        for (const c of CAMPOS) {
          const lido = (res.dados as any)[c.id];
          if (typeof lido === "string" && lido.trim()) novo[c.id] = lido.trim();
        }
        return novo;
      });
      setOrigem((o) => ({ ...o, ...res.origem }));
      if (res.imagens.length) {
        setImagens((antigas) => [...new Set([...antigas, ...res.imagens])]);
        setPrincipal((p) => p || res.imagens[0]);
      }
      if (!res.ok) setAviso(res.mensagem);
      toast[res.ok ? "success" : "warning"](res.mensagem);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao analisar o link.";
      setAviso(msg);
      toast.error(msg);
    } finally {
      setAnalisando(false);
    }
  }

  async function subirImagens(files: FileList | null) {
    if (!files?.length) return;
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 10)) urls.push(await enviarArquivo("produtos", f));
      setImagens((a) => [...a, ...urls]);
      setPrincipal((p) => p || urls[0]);
      toast.success("Imagens enviadas.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar imagens.");
    }
  }

  async function confirmar() {
    if (!valores.nome?.trim()) return toast.error("Informe pelo menos o nome do produto.");
    setSalvando(true);
    try {
      const payload: Record<string, unknown> = {
        ...Object.fromEntries(CAMPOS.map((c) => [c.id, valores[c.id]?.trim() || null])),
        link: meta.original_tiktok_url || link.trim() || null,
        original_tiktok_url: meta.original_tiktok_url || link.trim() || null,
        resolved_tiktok_url: meta.resolved_tiktok_url || null,
        tiktok_product_id: meta.tiktok_product_id || null,
        tiktok_region: meta.tiktok_region || null,
        last_analyzed_at: new Date().toISOString(),
        imagens,
        imagem_principal: principal || imagens[0] || null,
        descricao_colada: descricaoColada.trim() || null,
        origem_dados: origem,
        status_extracao: aviso ? "parcial" : "tiktok_shop",
      };
      const salvo = produto?.id
        ? await atualizar("products", produto.id as string, payload)
        : await criar("products", payload);
      onProdutoSalvo(salvo as ProdutoFluxo);
      onContinuar(salvo as ProdutoFluxo);
      toast.success("Produto confirmado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Cole o link do produto do TikTok Shop</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Cole aqui o link copiado do TikTok Shop"
            className="h-11"
          />
          <Button onClick={analisar} disabled={analisando} className="h-11 shrink-0 gap-2">
            {analisando ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            ANALISAR PRODUTO
          </Button>
        </div>
        {meta.tiktok_product_id ? (
          <p className="mt-3 text-xs text-muted-foreground">
            ID do produto: {meta.tiktok_product_id}
            {meta.tiktok_region ? ` · região ${meta.tiktok_region}` : ""}
          </p>
        ) : null}
        {aviso ? (
          <div className="mt-4 space-y-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
            <p className="text-muted-foreground">{aviso}</p>
            <Textarea
              value={descricaoColada}
              onChange={(e) => setDescricaoColada(e.target.value)}
              placeholder="Cole aqui a descrição da página do produto"
              rows={5}
            />
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Envie até 10 capturas ou imagens do produto
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => subirImagens(e.target.files)}
              />
            </div>
          </div>
        ) : null}
      </section>

      <section className="surface p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Imagens do produto</h2>
          <Input
            type="file"
            accept="image/*"
            multiple
            className="w-auto"
            onChange={(e) => subirImagens(e.target.files)}
          />
        </div>
        {imagens.length ? (
          <div className="mt-4 grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-5">
            {imagens.map((url) => (
              <div
                key={url}
                className={cn(
                  "group relative overflow-hidden rounded-xl border",
                  principal === url ? "border-primary ring-1 ring-primary/40" : "border-border",
                )}
              >
                <img
                  src={url}
                  alt="Imagem do produto"
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-background/80 p-1">
                  <button
                    type="button"
                    title="Usar como referência principal"
                    onClick={() => setPrincipal(url)}
                    className="flex-1 rounded-md p-1 text-[10px] font-medium hover:bg-secondary"
                  >
                    <Star
                      className={cn(
                        "mx-auto size-3.5",
                        principal === url && "fill-primary text-primary",
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    title="Remover imagem"
                    onClick={() => {
                      setImagens((a) => a.filter((i) => i !== url));
                      setPrincipal((p) => (p === url ? "" : p));
                    }}
                    className="rounded-md p-1 hover:bg-secondary"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma imagem ainda. Analise o link ou envie as imagens manualmente.
          </p>
        )}
        {imagens.length ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Use a estrela para escolher a imagem que será a referência principal da foto da
            personagem.
          </p>
        ) : null}
      </section>

      <section className="surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{valores.nome?.trim() || "Dados do produto"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {[valores.marca, valores.categoria, valores.preco].filter(Boolean).join(" · ") ||
                "Analise o link ou preencha os dados manualmente."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              {CAMPOS.filter((c) => valores[c.id]?.trim()).length} de {CAMPOS.length} campos
              preenchidos
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setEditando((e) => !e)}>
            <ChevronDown className={cn("size-4 transition-transform", editando && "rotate-180")} />
            {editando ? "OCULTAR DADOS" : "EDITAR DADOS DO PRODUTO"}
          </Button>
        </div>
        <div className={cn("mt-5 grid gap-4 sm:grid-cols-2", !editando && "hidden")}>
          {CAMPOS.map((c) => (
            <div key={c.id} className={cn("space-y-1.5", c.longo && "sm:col-span-2")}>
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {c.label}
                </label>
                {valores[c.id]?.trim() ? (
                  <Badge variant="secondary" className="text-[10px]">
                    {origem[c.id] === "tiktok_shop"
                      ? "TikTok Shop"
                      : origem[c.id] === "ia"
                        ? "Interpretação da IA"
                        : "Manual"}
                  </Badge>
                ) : null}
              </div>
              {c.longo ? (
                <Textarea
                  value={valores[c.id] ?? ""}
                  onChange={(e) => alterar(c.id, e.target.value)}
                  rows={3}
                />
              ) : (
                <Input
                  value={valores[c.id] ?? ""}
                  onChange={(e) => alterar(c.id, e.target.value)}
                  className="h-11"
                />
              )}
            </div>
          ))}
        </div>
        <Button
          onClick={confirmar}
          disabled={salvando}
          className="mt-6 h-12 w-full gap-2 text-base sm:w-auto"
        >
          {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
          CONFIRMAR PRODUTO E CONTINUAR
        </Button>
      </section>
    </div>
  );
}
