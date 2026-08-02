import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analisarProdutoTikTokShop } from "./tiktok.server";

/** Motor único: qualquer link de produto do TikTok Shop, de qualquer país. */
export const analisarProduto = createServerFn({ method: "POST" })
  .validator((i: unknown) => z.object({ url: z.string().min(8).max(2000) }).parse(i))
  .handler(async ({ data }) => analisarProdutoTikTokShop(data.url));
