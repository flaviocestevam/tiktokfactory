import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  BUCKETS,
  TABELAS,
  atualizar,
  contar,
  criar,
  enviarArquivo,
  excluir,
  listar,
  obter,
  removerArquivo,
} from "./dados.server";

const tabela = z.enum(TABELAS);
const bucket = z.enum(BUCKETS);
const valores = z.record(z.string(), z.unknown());

export const listarRegistros = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        tabela,
        filtros: z.record(z.string(), z.string()).optional(),
        ordem: z.object({ coluna: z.string(), asc: z.boolean().optional() }).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => listar(data.tabela, data.filtros, data.ordem));

export const obterRegistro = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ tabela, id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => obter(data.tabela, data.id));

export const contarRegistros = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ tabela }).parse(i))
  .handler(async ({ data }) => contar(data.tabela));

export const criarRegistro = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ tabela, valores }).parse(i))
  .handler(async ({ data }) => criar(data.tabela, data.valores));

export const atualizarRegistro = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ tabela, id: z.string().uuid(), valores }).parse(i))
  .handler(async ({ data }) => atualizar(data.tabela, data.id, data.valores));

export const excluirRegistro = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ tabela, id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => excluir(data.tabela, data.id));

export const enviarImagem = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z
      .object({
        bucket,
        nome: z.string().min(1).max(200),
        tipo: z.string().max(120).default("image/jpeg"),
        base64: z.string().min(1).max(14_000_000),
      })
      .parse(i),
  )
  .handler(async ({ data }) => enviarArquivo(data.bucket, data.nome, data.base64, data.tipo));

export const excluirImagem = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ bucket, caminho: z.string().min(1).max(400) }).parse(i))
  .handler(async ({ data }) => removerArquivo(data.bucket, data.caminho));