// Validação de domínio: aceita qualquer subdomínio oficial do TikTok, de qualquer país.

/** Domínios raiz oficiais aceitos. Configurável por ambiente, sem lista por país. */
export const TIKTOK_ALLOWED_ROOT_DOMAINS: string[] = (
  process.env["TIKTOK_ALLOWED_ROOT_DOMAINS"] || "tiktok.com"
)
  .split(",")
  .map((d) => d.trim().toLowerCase().replace(/^\./, ""))
  .filter(Boolean);

const HOST_PRIVADO =
  /^(localhost$|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.|169\.254\.|\[|::)/;

export function dominioPermitido(hostname: string) {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return TIKTOK_ALLOWED_ROOT_DOMAINS.some((raiz) => host === raiz || host.endsWith(`.${raiz}`));
}

export class LinkInvalido extends Error {}

/** Aceita qualquer URL https de um domínio oficial do TikTok. */
export function validarUrlTikTok(bruto: string): URL {
  let url: URL;
  try {
    url = new URL(String(bruto ?? "").trim());
  } catch {
    throw new LinkInvalido("Link inválido. Cole o link copiado do TikTok Shop.");
  }
  if (url.protocol !== "https:") throw new LinkInvalido("Só aceitamos links https do TikTok.");
  const host = url.hostname.toLowerCase();
  if (HOST_PRIVADO.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    throw new LinkInvalido("Endereço não permitido.");
  }
  if (!dominioPermitido(host)) {
    throw new LinkInvalido("Este link não é do TikTok. Cole um link de produto do TikTok Shop.");
  }
  return url;
}

export function ehLinkPermitido(bruto: string) {
  try {
    validarUrlTikTok(bruto);
    return true;
  } catch {
    return false;
  }
}
