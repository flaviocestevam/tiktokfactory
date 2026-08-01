import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { extrairPagina } from "./generation.server";

/** Le uma pagina de venda e devolve os dados encontrados, sem inventar nada. */
export const extrairProduto = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ url: z.string().url("Informe um link válido.") }).parse(i),
  )
  .handler(async ({ data }) => extrairPagina(data.url));
