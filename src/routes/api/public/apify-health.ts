import { createFileRoute } from "@tanstack/react-router";

const GATEWAY_APIFY_BASE = "https://connector-gateway.lovable.dev/apify";
const APIFY_API_BASE = "https://api.apify.com";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

async function verificarGateway(lovableApiKey: string, connectionApiKey: string) {
  const resposta = await fetch(`${GATEWAY_APIFY_BASE}/v2/users/me`, {
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Lovable-API-Key": lovableApiKey,
      "X-Connection-Api-Key": connectionApiKey,
    },
    signal: AbortSignal.timeout(20_000),
  });

  return {
    ok: resposta.ok,
    status: resposta.status,
    detalhe: resposta.ok ? null : (await resposta.text()).slice(0, 300),
  };
}

async function verificarTokenDireto(token: string) {
  const endpoint = new URL(`${APIFY_API_BASE}/v2/users/me`);
  endpoint.searchParams.set("token", token);
  const resposta = await fetch(endpoint, {
    signal: AbortSignal.timeout(20_000),
  });

  return {
    ok: resposta.ok,
    status: resposta.status,
    detalhe: resposta.ok ? null : (await resposta.text()).slice(0, 300),
  };
}

export const Route = createFileRoute("/api/public/apify-health")({
  server: {
    handlers: {
      GET: async () => {
        const lovableApiKey = process.env["LOVABLE_API_KEY"]?.trim() ?? "";
        const connectionApiKey = process.env["APIFY_API_KEY"]?.trim() ?? "";
        const tokenDireto = process.env["APIFY_TOKEN"]?.trim() ?? "";

        try {
          if (lovableApiKey && connectionApiKey) {
            const resultado = await verificarGateway(lovableApiKey, connectionApiKey);
            return json(
              {
                ok: resultado.ok,
                conectado: resultado.ok,
                modo: "lovable_gateway",
                status_apify: resultado.status,
                erro: resultado.detalhe,
              },
              resultado.ok ? 200 : 503,
            );
          }

          if (tokenDireto) {
            const resultado = await verificarTokenDireto(tokenDireto);
            return json(
              {
                ok: resultado.ok,
                conectado: resultado.ok,
                modo: "token_direto",
                status_apify: resultado.status,
                erro: resultado.detalhe,
              },
              resultado.ok ? 200 : 503,
            );
          }

          return json(
            {
              ok: false,
              conectado: false,
              modo: "ausente",
              status_apify: null,
              erro: "A conexão Apify ainda não foi disponibilizada ao backend deste projeto.",
            },
            503,
          );
        } catch (erro) {
          return json(
            {
              ok: false,
              conectado: false,
              modo: lovableApiKey && connectionApiKey ? "lovable_gateway" : "token_direto",
              status_apify: null,
              erro: erro instanceof Error ? erro.message : String(erro),
            },
            503,
          );
        }
      },
    },
  },
});
