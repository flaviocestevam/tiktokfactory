/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { analisarProdutoTikTok } from "@/lib/fluxo.functions";
import { atualizar, criar } from "@/lib/queries";
import { linkTikTokValido } from "@/lib/config";
import {
  CAMPOS_PRODUTO,
  OFERTA_VAZIA,
  type DadosProduto,
  type Oferta,
  type ResultadoAnalise,
} from "@/lib/tiktok/types";

const CAMPOS_EXIBICAO: Array<{ id: keyof DadosProduto; label: string; longo?: boolean }> = [
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
  { id: "variacoes", label: "Variações" },
  { id: "tamanho", label: "Tamanho" },
  { id: "cores", label: "Cores" },
  { id: "publico", label: "Público indicado" },
  { id: "descricao", label: "Descrição", longo: true },
  { id: "beneficios", label: "Benefícios informados", longo: true },
  { id: "caracteristicas", label: "Características", longo: true },
  { id: "ingredientes", label: "Ingredientes", longo: true },
  { id: "modo_de_uso", label: "Modo de uso", longo: true },
  { id: "informacoes_tecnicas", label: "Informações técnicas", longo: true },
  { id: "advertencias", label: "Advertências", longo: true },
  { id: "restricoes", label: "Restrições", longo: true },
  { id: "diferenciais", label: "Diferenciais", longo: true },
  { id: "garantias", label: "Garantias", longo: true },
];

export type ProdutoFluxo = Record<string, any>;

type Diagnostico = {
  status: string;
  fonte: string;
  tentativas: number;
  mensagem: string;
  detalhe: string;
  productId: string;
  regiao: string;
};

function montarDados(origem: Record<string, unknown> | null | undefined): DadosProduto {
  const dados: DadosProduto = {};
  for (const campo of CAMPOS_PRODUTO) {
    const valor = String(origem?.[campo] ?? "").trim();
    if (valor) dados[campo] = valor;
  }
  return dados;
}

function mensagemFalha(resultado: ResultadoAnalise) {
  if (resultado.status === "blocked") {
    return "O TikTok bloqueou a leitura com uma verificação de segurança. O produto não foi liberado para evitar dados incompletos.";
  }
  if (resultado.status === "unavailable") {
    return "O produto está indisponível, removido ou restrito para a região informada.";
  }
  if (resultado.status === "invalid_product") {
    return "O link abriu uma página que não corresponde ao produto informado.";
  }
  if (resultado.status === "partial") {
    return "A leitura retornou dados insuficientes. Nenhum produto parcial pode seguir para a produção.";
  }
  return resultado.detalhe || resultado.mensagem || "Não foi possível ler o produto.";
}

export function PassoProduto({
  produto,
  onProdutoSalvo,
  onContinuar,
}: {
  produto: ProdutoFluxo | null;
  onProdutoSalvo: (produto: ProdutoFluxo) => void;
  onContinuar: (produto: ProdutoFluxo) => void;
}) {
  const produtoJaValidado =
    produto?.extraction_status === "success" || produto?.status_extracao === "success";
  const [link, setLink] = useState<string>(
    produto?.original_tiktok_url ?? produto?.link ?? "",
  );
  const [analisando, setAnalisando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [valido, setValido] = useState(Boolean(produtoJaValidado));
  const [resultado, setResultado] = useState<ResultadoAnalise | null>(null);
  const [dados, setDados] = useState<DadosProduto>(() => montarDados(produto));
  const [oferta, setOferta] = useState<Oferta>(() => ({
    ...OFERTA_VAZIA,
    ...((produto?.normalized_product_data as any)?.oferta ?? {}),
  }));
  const [diagnostico, setDiagnostico] = useState<Diagnostico>({
    status: String(produto?.extraction_status ?? produto?.status_extracao ?? ""),
    fonte: String(produto?.extraction_method ?? ""),
    tentativas: Number(produto?.extraction_attempts ?? 0),
    mensagem: produtoJaValidado ? "Produto validado anteriormente." : "",
    detalhe: "",
    productId: String(produto?.tiktok_product_id ?? ""),
    regiao: String(produto?.tiktok_country_code ?? produto?.tiktok_region ?? ""),
  });

  async function analisar() {
    const entrada = link.trim();
    if (!entrada) return toast.error("Cole o link do produto do TikTok Shop.");
    if (!linkTikTokValido(entrada)) {
      return toast.error("Este link não é do TikTok Shop. Cole o link copiado direto do app.");
    }

    setAnalisando(true);
    setValido(false);
    setResultado(null);
    setDados({});
    setOferta({ ...OFERTA_VAZIA });
    setDiagnostico({
      status: "pending",
      fonte: "",
      tentativas: 0,
      mensagem: "Analisando o produto...",
      detalhe: "",
      productId: "",
      regiao: "",
    });

    try {
      const res = (await analisarProdutoTikTok({ data: { url: entrada } })) as ResultadoAnalise;
      setResultado(res);
      setDados(montarDados(res.dados));
      setOferta({ ...OFERTA_VAZIA, ...res.oferta });
      setValido(Boolean(res.ok));
      setDiagnostico({
        status: res.status,
        fonte: res.fonte,
        tentativas: res.tentativas,
        mensagem: res.ok ? "Produto encontrado e validado." : mensagemFalha(res),
        detalhe: res.detalhe ?? "",
        productId: res.tiktok_product_id ?? "",
        regiao: res.tiktok_region ?? "",
      });
      toast[res.ok ? "success" : "warning"](
        res.ok ? "Produto encontrado e validado." : mensagemFalha(res),
      );
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : "Falha ao analisar o link.";
      setDiagnostico((d) => ({ ...d, status: "failed", mensagem, detalhe: mensagem }));
      toast.error(mensagem);
    } finally {
      setAnalisando(false);
    }
  }

  async function confirmar() {
    if (!valido) {
      return toast.error("Analise o produto com sucesso antes de continuar.");
    }

    const dadosFinais: DadosProduto = { ...(resultado?.dados ?? dados) };
    const ofertaFinal: Oferta = { ...OFERTA_VAZIA, ...(resultado?.oferta ?? oferta) };
    if (!dadosFinais.preco) {
      dadosFinais.preco =
        ofertaFinal.current_price_formatted || ofertaFinal.current_price_value || undefined;
    }
    if (!dadosFinais.preco_promocional) {
      dadosFinais.preco_promocional =
        ofertaFinal.original_price_formatted || ofertaFinal.original_price_value || undefined;
    }
    if (!dadosFinais.desconto && ofertaFinal.discount_text) {
      dadosFinais.desconto = ofertaFinal.discount_text;
    }

    const nome = String(dadosFinais.nome ?? "").trim();
    if (!nome) return toast.error("A leitura válida precisa conter o nome do produto.");

    setSalvando(true);
    try {
      const linkInfo = resultado?.link;
      const payload: Record<string, unknown> = {};
      for (const campo of CAMPOS_PRODUTO) {
        payload[campo] = String(dadosFinais[campo] ?? "").trim() || null;
      }

      Object.assign(payload, {
        nome,
        link: resultado?.original_tiktok_url ?? produto?.link ?? link.trim(),
        original_tiktok_url:
          resultado?.original_tiktok_url ?? produto?.original_tiktok_url ?? link.trim(),
        resolved_tiktok_url:
          resultado?.resolved_tiktok_url ?? produto?.resolved_tiktok_url ?? null,
        redirected_tiktok_url:
          linkInfo?.redirected_url ?? produto?.redirected_tiktok_url ?? null,
        canonical_tiktok_url:
          linkInfo?.canonical_url ?? produto?.canonical_tiktok_url ?? null,
        fetch_tiktok_url: linkInfo?.fetch_url ?? produto?.fetch_tiktok_url ?? null,
        tiktok_product_id:
          resultado?.tiktok_product_id ?? produto?.tiktok_product_id ?? null,
        tiktok_region: resultado?.tiktok_region ?? produto?.tiktok_region ?? null,
        tiktok_country_code:
          linkInfo?.country_code ?? produto?.tiktok_country_code ?? produto?.tiktok_region ?? null,
        tiktok_market: linkInfo?.market ?? produto?.tiktok_market ?? null,
        source_locale: linkInfo?.locale ?? produto?.source_locale ?? null,
        source_language: linkInfo?.source_language ?? produto?.source_language ?? null,
        currency_code: ofertaFinal.currency_code || produto?.currency_code || null,
        currency_symbol: ofertaFinal.currency_symbol || produto?.currency_symbol || null,
        normalized_product_data: { produto: dadosFinais, oferta: ofertaFinal },
        original_product_data:
          resultado?.dados_originais ?? produto?.original_product_data ?? {},
        dados_extraidos: resultado?.dados ?? dadosFinais,
        origem_dados: resultado?.origem ?? produto?.origem_dados ?? {},
        imagens: resultado?.imagens ?? produto?.imagens ?? [],
        extraction_status: "success",
        status_extracao: "success",
        extraction_attempts:
          resultado?.tentativas ?? Number(produto?.extraction_attempts ?? 0),
        extraction_method:
          resultado?.fonte ?? produto?.extraction_method ?? "cache",
        extraction_error_code: null,
        last_analyzed_at: new Date().toISOString(),
      });

      const salvo = produto?.id
        ? await atualizar("products", String(produto.id), payload)
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

  const camposPreenchidos = CAMPOS_EXIBICAO.filter((campo) =>
    String(dados[campo.id] ?? "").trim(),
  );

  return (
    <div className="space-y-6">
      <section className="surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Cole o link do produto do TikTok Shop</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Os dados são importados automaticamente. Produtos parciais ou bloqueados não podem avançar.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              if (resultado && e.target.value.trim() !== resultado.original_tiktok_url) {
                setValido(false);
              }
            }}
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

        {diagnostico.status ? (
          <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={valido ? "default" : "secondary"}>
                {valido ? "LEITURA VÁLIDA" : diagnostico.status.toUpperCase()}
              </Badge>
              {diagnostico.fonte ? (
                <span className="text-xs text-muted-foreground">Motor: {diagnostico.fonte}</span>
              ) : null}
              {diagnostico.tentativas ? (
                <span className="text-xs text-muted-foreground">
                  {diagnostico.tentativas} tentativa(s)
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{diagnostico.mensagem}</p>
            {diagnostico.productId ? (
              <p className="mt-2 text-xs text-muted-foreground">
                ID: {diagnostico.productId}
                {diagnostico.regiao ? ` · região ${diagnostico.regiao}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="surface p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{dados.nome || "Dados do produto"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {[dados.marca, dados.categoria, dados.preco].filter(Boolean).join(" · ") ||
                "Aguardando uma leitura automática válida."}
            </p>
          </div>
          <Badge variant="outline">{camposPreenchidos.length} campos encontrados</Badge>
        </div>

        {camposPreenchidos.length ? (
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {camposPreenchidos.map((campo) => (
              <div
                key={campo.id}
                className={campo.longo ? "rounded-xl border border-border p-3 sm:col-span-2" : "rounded-xl border border-border p-3"}
              >
                <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {campo.label}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm">
                  {String(dados[campo.id])}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum dado comercial validado.
          </div>
        )}

        <Button
          onClick={confirmar}
          disabled={!valido || salvando || analisando}
          className="mt-6 h-12 w-full gap-2 text-base sm:w-auto"
        >
          {salvando ? <Loader2 className="size-4 animate-spin" /> : null}
          {valido ? "CONFIRMAR PRODUTO E CONTINUAR" : "AGUARDANDO LEITURA VÁLIDA"}
        </Button>
      </section>
    </div>
  );
}
