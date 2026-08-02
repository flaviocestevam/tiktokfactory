import { createFileRoute } from "@tanstack/react-router";
import { analisarProdutoTikTokShop } from "../../../lib/tiktok.server";

const PRODUTO_TESTE =
  "https://shop.tiktok.com/br/pdp/1731254692141565116";
const CACHE_MS = 10 * 60 * 1000;

let cache:
  | {
      expiraEm: number;
      execucao: Promise<Record<string, unknown>>;
    }
  | null = null;

async function executarDiagnostico() {
  const agora = Date.now();
  if (cache && cache.expiraEm > agora) return cache.execucao;

  const execucao = (async () => {
    const inicio = Date.now();
    const ambiente = {
      apify_token_direto: Boolean(process.env.APIFY_TOKEN),
      apify_conexao_lovable: Boolean(process.env.APIFY_API_KEY),
      lovable_api_key: Boolean(process.env.LOVABLE_API_KEY),
      gateway_pronto: Boolean(
        process.env.APIFY_API_KEY && process.env.LOVABLE_API_KEY,
      ),
    };

    try {
      const resultado = await analisarProdutoTikTokShop(PRODUTO_TESTE);
      return {
        diagnostico: "tiktok_shop_apify",
        executado_em: new Date().toISOString(),
        duracao_ms: Date.now() - inicio,
        ambiente,
        resultado: {
          ok: resultado.ok,
          status: resultado.status,
          mensagem: resultado.mensagem,
          detalhe: resultado.detalhe,
          fonte: resultado.fonte,
          tentativas: resultado.tentativas,
          product_id: resultado.tiktok_product_id,
          region: resultado.tiktok_region,
          nome: resultado.dados?.nome ?? "",
          marca: resultado.dados?.marca ?? "",
          vendedor: resultado.dados?.vendedor ?? "",
          categoria: resultado.dados?.categoria ?? "",
          preco: resultado.dados?.preco ?? "",
          preco_anterior: resultado.dados?.preco_promocional ?? "",
          descricao_presente: Boolean(resultado.dados?.descricao),
          campos_preenchidos: Object.keys(resultado.dados ?? {}).filter(
            (campo) => Boolean(String(resultado.dados?.[campo as keyof typeof resultado.dados] ?? "").trim()),
          ),
        },
      };
    } catch (erro) {
      return {
        diagnostico: "tiktok_shop_apify",
        executado_em: new Date().toISOString(),
        duracao_ms: Date.now() - inicio,
        ambiente,
        resultado: {
          ok: false,
          status: "erro_interno",
          mensagem: erro instanceof Error ? erro.message : String(erro),
        },
      };
    }
  })();

  cache = { expiraEm: agora + CACHE_MS, execucao };
  return execucao;
}

export const Route = createFileRoute("/api/public/tiktok-diagnostic")({
  server: {
    handlers: {
      GET: async () => {
        const diagnostico = await executarDiagnostico();
        return Response.json(diagnostico, {
          headers: {
            "Cache-Control": "no-store",
            "X-Robots-Tag": "noindex, nofollow",
          },
        });
      },
    },
  },
});
