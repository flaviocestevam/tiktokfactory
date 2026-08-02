// Segue redirecionamentos mantendo o destino dentro dos domínios oficiais.
import { validarUrlTikTok } from "./validate-url.server";

const MAX_SALTOS = 8;
const TEMPO_LIMITE = 15_000;

export const UA_NAVEGADOR =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export async function resolverRedirecionamentos(url: URL): Promise<URL> {
  let atual = url;
  for (let i = 0; i < MAX_SALTOS; i++) {
    let res: Response;
    try {
      res = await fetch(atual.toString(), {
        method: "GET",
        redirect: "manual",
        headers: { "User-Agent": UA_NAVEGADOR, Accept: "text/html,*/*" },
        signal: AbortSignal.timeout(TEMPO_LIMITE),
      });
    } catch {
      return atual;
    }
    const destino = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && destino) {
      try {
        atual = validarUrlTikTok(new URL(destino, atual).toString());
      } catch {
        return atual;
      }
      continue;
    }
    return atual;
  }
  return atual;
}
