/* eslint-disable @typescript-eslint/no-explicit-any */
// Baixa as imagens reais do produto e guarda no Storage, sem depender de URLs temporárias.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ASSINATURAS: Array<{ ext: string; tipo: string; teste: (b: Uint8Array) => boolean }> = [
  {
    ext: "jpg",
    tipo: "image/jpeg",
    teste: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: "png",
    tipo: "image/png",
    teste: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    ext: "webp",
    tipo: "image/webp",
    teste: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57,
  },
];

const TAMANHO_MINIMO = 8_000;
const TAMANHO_MAXIMO = 8_000_000;
const UM_ANO = 60 * 60 * 24 * 365;

async function hash(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Baixa, valida e salva as imagens em produtos/{pais}/{product_id}/{uuid}.ext */
export async function salvarImagensDoProduto(
  urls: string[],
  contexto: { country_code: string | null; product_id: string | null },
  limite = 8,
): Promise<string[]> {
  const pais = (contexto.country_code || "xx").toLowerCase();
  const id = contexto.product_id || "sem-id";
  const vistos = new Set<string>();
  const salvas: string[] = [];

  for (const url of urls) {
    if (salvas.length >= limite) break;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) continue;
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength < TAMANHO_MINIMO || bytes.byteLength > TAMANHO_MAXIMO) continue;
      const assinatura = ASSINATURAS.find((a) => a.teste(bytes));
      if (!assinatura) continue;
      const impressao = await hash(bytes);
      if (vistos.has(impressao)) continue;
      vistos.add(impressao);

      const caminho = `${pais}/${id}/${crypto.randomUUID()}.${assinatura.ext}`;
      const { error } = await supabaseAdmin.storage
        .from("produtos")
        .upload(caminho, bytes, { contentType: assinatura.tipo, upsert: true });
      if (error) {
        console.error("[tiktok] falha ao salvar imagem:", error.message);
        continue;
      }
      const { data } = await supabaseAdmin.storage
        .from("produtos")
        .createSignedUrl(caminho, UM_ANO);
      if (data?.signedUrl) salvas.push(data.signedUrl);
    } catch (e) {
      console.error("[tiktok] erro ao baixar imagem:", e instanceof Error ? e.message : e);
    }
  }
  return salvas;
}
