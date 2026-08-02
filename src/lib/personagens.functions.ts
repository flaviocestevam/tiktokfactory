import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { TIPOS_FOTO, confirmarIdentidade, enviarFoto, removerFoto } from "./personagens.server";

const tipo = z.enum(TIPOS_FOTO);

export const enviarFotoPersonagem = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z
      .object({
        characterId: z.string().uuid(),
        tipo,
        mime: z.string().min(3).max(80),
        base64: z.string().min(1).max(15_000_000),
        rotulo: z.string().max(120).optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => enviarFoto(data));

export const removerFotoPersonagem = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({ characterId: z.string().uuid(), tipo, fotoId: z.string().optional() }).parse(i),
  )
  .handler(async ({ data }) => removerFoto(data));

export const confirmarIdentidadePersonagem = createServerFn({ method: "POST" })
  .validator((i: unknown) =>
    z.object({ characterId: z.string().uuid(), confirmada: z.boolean() }).parse(i),
  )
  .handler(async ({ data }) => confirmarIdentidade(data.characterId, data.confirmada));
