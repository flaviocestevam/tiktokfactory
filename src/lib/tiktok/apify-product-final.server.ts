import type { LeituraPagina } from "./types";
import {
  apifyProdutoDisponivel as apifyDisponivelBase,
  lerProdutoComApify as lerProdutoBase,
  type OpcoesApifyProduto,
} from "./apify-product-async.server";

const ATOR_BR_PRIMARIO = "herus13~tiktok-shop-scraper";
const ATOR_GLOBAL_FALLBACK = "jungle_synthesizer~tiktok-shop-product-detail-scraper";
const LIMITE_TOTAL_MS = 65_000;

let filaExecucao: Promise<void> = Promise.resolve();

function restaurarVariavel(nome: string, valorAnterior: string | undefined) {
  if (valorAnterior === undefined) delete process.env[nome];
  else process.env[nome] = valorAnterior;
}

async function executarComOrdemExclusiva<T>(acao: () => Promise<T>): Promise<T> {
  const anterior = filaExecucao;
  let liberar!: () => void;
  filaExecucao = new Promise<void>((resolve) => {
    liberar = resolve;
  });

  await anterior;
  try {
    return await acao();
  } finally {
    liberar();
  }
}

export function apifyProdutoDisponivel() {
  return apifyDisponivelBase();
}

export async function lerProdutoComApify(
  url: string,
  op: OpcoesApifyProduto,
): Promise<LeituraPagina | null> {
  return executarComOrdemExclusiva(async () => {
    const pais = (op.country ?? "BR").toUpperCase();
    const primarioAnterior = process.env.APIFY_TIKTOK_PRIMARY_ACTOR_ID;
    const fallbackAnterior = process.env.APIFY_TIKTOK_FALLBACK_ACTOR_ID;

    process.env.APIFY_TIKTOK_PRIMARY_ACTOR_ID =
      pais === "BR" ? ATOR_BR_PRIMARIO : ATOR_GLOBAL_FALLBACK;
    process.env.APIFY_TIKTOK_FALLBACK_ACTOR_ID =
      pais === "BR" ? ATOR_GLOBAL_FALLBACK : ATOR_BR_PRIMARIO;

    try {
      return await lerProdutoBase(url, {
        ...op,
        timeoutMs: Math.min(LIMITE_TOTAL_MS, Math.max(45_000, op.timeoutMs ?? LIMITE_TOTAL_MS)),
      });
    } finally {
      restaurarVariavel("APIFY_TIKTOK_PRIMARY_ACTOR_ID", primarioAnterior);
      restaurarVariavel("APIFY_TIKTOK_FALLBACK_ACTOR_ID", fallbackAnterior);
    }
  });
}
