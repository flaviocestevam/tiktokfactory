import { analisarProdutoTikTokShop } from "../src/lib/tiktok/product-analyzer.server";
import { normalizarLinkTikTokShop } from "../src/lib/tiktok/normalize-url.server";

const URL_TESTE =
  process.env.AUDIT_PRODUCT_URL ||
  "https://shop.tiktok.com/br/pdp/1731254692141565116?source=product_detail&enter_method=feed_list_more_from&first_entrance=product_detail&first_entrance_position=region_not_match&first_entrance_tt_scene=seo&btm_pre=a2270.b78616.c37041.d89097_i1&btm_pre_show_id=d528ed42-742d-423b-8181-1c7fd4114bdc&btm_transfer_id=7df6aa99-002d-4c0c-8872-ec03c5107c71&btm_ppre=a2270.b78616.c37041.d89097_i2";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  console.log("\n=== AUDITORIA TIKTOK FACTORY ===");
  console.log("URL de teste:", URL_TESTE);

  const link = await normalizarLinkTikTokShop(URL_TESTE);
  console.log("\n1. NORMALIZAÇÃO");
  console.log(JSON.stringify(link, null, 2));

  assert(link.product_id === "1731254692141565116", "ID do produto não foi reconhecido corretamente.");
  assert(link.country_code === "BR", "A região BR não foi reconhecida corretamente.");
  assert(!link.fetch_url.includes("source="), "A URL de leitura ainda contém source.");
  assert(!link.fetch_url.includes("btm_"), "A URL de leitura ainda contém parâmetros btm_.");
  assert(!link.fetch_url.includes("first_entrance"), "A URL de leitura ainda contém first_entrance.");

  console.log("✓ Link normalizado corretamente.");

  console.log("\n2. EXTRAÇÃO REAL");
  const resultado = await analisarProdutoTikTokShop(URL_TESTE);
  console.log(
    JSON.stringify(
      {
        ok: resultado.ok,
        status: resultado.status,
        fonte: resultado.fonte,
        tentativas: resultado.tentativas,
        mensagem: resultado.mensagem,
        detalhe: resultado.detalhe,
        product_id: resultado.tiktok_product_id,
        region: resultado.tiktok_region,
        dados: resultado.dados,
        oferta: resultado.oferta,
      },
      null,
      2,
    ),
  );

  assert(resultado.tiktok_product_id === "1731254692141565116", "O resultado perdeu o ID do produto.");
  assert(resultado.tiktok_region === "BR", "O resultado perdeu a região BR.");
  assert(resultado.ok, `A extração automática falhou: ${resultado.status} — ${resultado.detalhe ?? resultado.mensagem}`);
  assert(String(resultado.dados.nome ?? "").trim(), "A extração não retornou o nome do produto.");

  const campos = Object.entries(resultado.dados)
    .filter(([, value]) => String(value ?? "").trim())
    .map(([key]) => key);

  console.log(`✓ Produto extraído com ${campos.length} campos: ${campos.join(", ")}`);
  console.log("\n=== AUDITORIA CONCLUÍDA COM SUCESSO ===\n");
}

main().catch((error) => {
  console.error("\n=== AUDITORIA FALHOU ===");
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
