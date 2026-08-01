import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analisarProdutoTikTokShop } from "./tiktok.server";
import {
  ajustarClipes,
  carregarResultados,
  criarTresRoteiros,
  gerarFotoInicial,
  regerarClipe,
  regerarRoteiro,
} from "./fluxo.persist.server";

export const analisarProdutoTikTok = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ url: z.string().min(8).max(2000) }).parse(i))
  .handler(async ({ data }) => analisarProdutoTikTokShop(data.url));

export const gerarPromptFoto = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ projectId: z.string().uuid(), ajuste: z.string().max(500).optional() }).parse(i),
  )
  .handler(async ({ data }) => gerarFotoInicial(data.projectId, data.ajuste));

export const gerarTresRoteiros = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => criarTresRoteiros(data.projectId));

export const regerarRoteiroVariante = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        scriptId: z.string().uuid(),
        instrucao: z.string().max(1000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => regerarRoteiro(data.projectId, data.scriptId, data.instrucao));

export const listarResultados = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => carregarResultados(data.projectId));

export const regerarClipeFlow = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        clipId: z.string().uuid(),
        instrucao: z.string().max(1000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => regerarClipe(data.projectId, data.clipId, data.instrucao));

export const reorganizarClipes = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        scriptId: z.string().uuid(),
        modo: z.enum(["redistribuir", "unir", "separar"]),
        ordem: z.number().int().min(1).max(60).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => ajustarClipes(data.projectId, data.scriptId, data.modo, data.ordem));
