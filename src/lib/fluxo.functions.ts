import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analisarProdutoTikTokShop } from "./tiktok.server";
import { analisarFotoDaProducao } from "./analise-imagem.server";
import {
  ajustarClipes,
  aprovarRoteiro,
  prepararClipes,
  carregarResultados,
  criarTresRoteiros,
  editarClipeManual,
  editarRoteiroManual,
  regerarClipe,
  regerarRoteiro,
} from "./fluxo.persist.server";

export const analisarProdutoTikTok = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ url: z.string().min(8).max(2000) }).parse(i))
  .handler(async ({ data }) => analisarProdutoTikTokShop(data.url));

export const gerarTresRoteiros = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => criarTresRoteiros(data.projectId));

export const regerarRoteiroVariante = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
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
  .validator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => carregarResultados(data.projectId));

export const regerarClipeFlow = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
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
  .validator((i: unknown) =>
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

export const aprovarRoteiroVariante = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({ projectId: z.string().uuid(), scriptId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data }) => aprovarRoteiro(data.projectId, data.scriptId));

export const gerarClipesDoRoteiro = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({ projectId: z.string().uuid(), scriptId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data }) => prepararClipes(data.projectId, data.scriptId));

export const editarRoteiroTexto = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        scriptId: z.string().uuid(),
        campos: z.record(z.string(), z.string().max(20000)),
      })
      .parse(i),
  )
  .handler(async ({ data }) => editarRoteiroManual(data.projectId, data.scriptId, data.campos));

export const editarClipeTexto = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z
      .object({
        projectId: z.string().uuid(),
        clipId: z.string().uuid(),
        campos: z.record(z.string(), z.string().max(20000)),
      })
      .parse(i),
  )
  .handler(async ({ data }) => editarClipeManual(data.projectId, data.clipId, data.campos));

export const analisarFotoProjeto = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ projectId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => analisarFotoDaProducao(data.projectId));
