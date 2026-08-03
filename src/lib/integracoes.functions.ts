import { createServerFn } from "@tanstack/react-start";

export type StatusIntegracoes = {
  inteligencia_artificial: boolean;
  banco: boolean;
  banco_admin: boolean;
  pronto_para_cadastrar_produto: boolean;
  pronto_para_gerar_conteudo: boolean;
};

export const obterStatusIntegracoes = createServerFn({ method: "GET" }).handler(
  async (): Promise<StatusIntegracoes> => {
    const banco = Boolean(process.env["SUPABASE_URL"]);
    const bancoAdmin = Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]);
    const ia = Boolean(process.env["LOVABLE_API_KEY"]);

    return {
      inteligencia_artificial: ia,
      banco,
      banco_admin: bancoAdmin,
      pronto_para_cadastrar_produto: banco && bancoAdmin,
      pronto_para_gerar_conteudo: ia && banco && bancoAdmin,
    };
  },
);
