import { createServerFn } from "@tanstack/react-start";
import { statusLeitoresProduto } from "./tiktok/browser-reader.server";

export type StatusIntegracoes = {
  produto: {
    apify: boolean;
    browser_service: boolean;
    firecrawl: boolean;
    jina: boolean;
    leitor_estruturado: boolean;
  };
  inteligencia_artificial: boolean;
  banco: boolean;
  banco_admin: boolean;
  pronto_para_importar_produto: boolean;
  pronto_para_gerar_conteudo: boolean;
};

export const obterStatusIntegracoes = createServerFn({ method: "GET" }).handler(
  async (): Promise<StatusIntegracoes> => {
    const leitores = statusLeitoresProduto();
    const banco = Boolean(process.env["SUPABASE_URL"]);
    const bancoAdmin = Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]);
    const ia = Boolean(process.env["LOVABLE_API_KEY"]);
    const leitorEstruturado = leitores.apify || leitores.browser_service || leitores.firecrawl;

    return {
      produto: {
        ...leitores,
        leitor_estruturado: leitorEstruturado,
      },
      inteligencia_artificial: ia,
      banco,
      banco_admin: bancoAdmin,
      pronto_para_importar_produto: leitorEstruturado && banco && bancoAdmin,
      pronto_para_gerar_conteudo: ia && banco && bancoAdmin,
    };
  },
);
