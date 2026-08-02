/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ChevronDown, Loader2, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { analisarProdutoTikTok } from "@/lib/fluxo.functions";
import { atualizar, criar } from "@/lib/queries";
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
  const [meta, setMeta] = useState({
    original_tiktok_url: produto?.original_tiktok_url ?? "",
    resolved_tiktok_url: produto?.resolved_tiktok_url ?? "",
    tiktok_product_id: produto?.tiktok_product_id ?? "",
    tiktok_region: produto?.tiktok_region ?? "",
  });
  const [aviso, setAviso] = useState<string | null>(null);
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
          <p className="mt-4 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            {aviso}
          </p>
        ) : null}
      </section>

      <section className="surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{valores.nome?.trim() || "Dados do produto"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {[valores.marca, valores.categoria, valores.preco].filter(Boolean).join(" · ") ||
                "Analise o link do produto do TikTok Shop."}
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
