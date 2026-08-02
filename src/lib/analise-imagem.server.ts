/* eslint-disable @typescript-eslint/no-explicit-any */
// Análise multimodal da foto da produção: única fonte visual do vídeo.
import { generateText } from "ai";
import { AI_MODEL, createLovableAiGatewayProvider } from "./ai-gateway.server";
import { parseJson } from "./ai.server";
import { db } from "./generation.server";

export const NAO_DETERMINADO = "não determinado com segurança";

export type AnaliseVisual = {
  framing: string;
  camera_position: string;
  camera_distance: string;
  body_position: string;
  initial_pose: string;
  initial_expression: string;
  gaze_direction: string;
  product_hand: string;
  free_hand: string;
  product_position: string;
  product_orientation: string;
  product_apparent_size: string;
  label_visibility: string;
  lighting: string;
  visible_elements: string[];
  safe_movements: string[];
  continuity_risks: string[];
};

const CAMPOS_TEXTO: Array<keyof AnaliseVisual> = [
  "framing",
  "camera_position",
  "camera_distance",
  "body_position",
  "initial_pose",
  "initial_expression",
  "gaze_direction",
  "product_hand",
  "free_hand",
  "product_position",
  "product_orientation",
  "product_apparent_size",
  "label_visibility",
  "lighting",
];

const SHAPE = `{"framing":"","camera_position":"","camera_distance":"","body_position":"","initial_pose":"","initial_expression":"","gaze_direction":"","product_hand":"","free_hand":"","product_position":"","product_orientation":"","product_apparent_size":"","label_visibility":"","lighting":"","visible_elements":[],"safe_movements":[],"continuity_risks":[]}`;

const SISTEMA = `Você descreve APENAS o que está objetivamente visível em uma foto de influenciadora segurando um produto.
- Descreva somente o estado visual: enquadramento, câmera, corpo, pose, expressão, olhar, mãos, produto, iluminação e elementos presentes.
- Quando algo não estiver claramente visível, escreva exatamente: "${NAO_DETERMINADO}".
- Proibido inventar: texto do rótulo, cores escondidas, parte traseira da embalagem, mecanismo, tampa, aplicador, textura, quantidade, tamanho real ou conteúdo interno.
- Não descreva benefícios, características comerciais nem finalidade do produto: isso vem da página de vendas.
- "safe_movements": movimentos naturais possíveis a partir desta pose.
- "continuity_risks": movimentos que quebrariam a continuidade visual (ex.: trocar a mão que segura o produto).
- Responda em português do Brasil.`;

function limpar(bruto: any): AnaliseVisual {
  const saida: any = {};
  for (const campo of CAMPOS_TEXTO) {
    const valor = String(bruto?.[campo] ?? "").trim();
    saida[campo] = valor || NAO_DETERMINADO;
  }
  for (const lista of ["visible_elements", "safe_movements", "continuity_risks"] as const) {
    saida[lista] = Array.isArray(bruto?.[lista])
      ? bruto[lista].map((i: any) => String(i).trim()).filter(Boolean).slice(0, 12)
      : [];
  }
  return saida as AnaliseVisual;
}

async function baixarImagem(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error("Não foi possível abrir a foto enviada.");
  const tipo = res.headers.get("content-type") ?? "image/jpeg";
  return { bytes: new Uint8Array(await res.arrayBuffer()), tipo };
}

/** Lê a foto com um modelo multimodal e devolve o estado visual inicial. */
export async function lerFoto(url: string): Promise<AnaliseVisual> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("A integração de IA não está configurada.");
  const { bytes, tipo } = await baixarImagem(url);
  const gateway = createLovableAiGatewayProvider(key);

  const { text } = await generateText({
    model: gateway(AI_MODEL),
    system: `${SISTEMA}\n\nResponda EXCLUSIVAMENTE com JSON válido, sem markdown, nesta forma:\n${SHAPE}`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analise o estado visual inicial desta foto. Só registre o que está visível.",
          },
          { type: "image", image: bytes, mediaType: tipo },
        ],
      },
    ],
  });
  return limpar(parseJson<any>(text));
}

/** Analisa a foto da produção e guarda o resultado interno no projeto. */
export async function analisarFotoDaProducao(projectId: string) {
  const supabase = await db();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, reference_image_url")
    .eq("id", projectId)
    .single();
  if (error) throw new Error(error.message);
  const url = (project as any)?.reference_image_url as string | null;
  if (!url) throw new Error("Envie a foto da produção antes de analisar.");

  try {
    const analise = await lerFoto(url);
    await supabase
      .from("projects")
      .update({
        project_image_analysis: analise as any,
        image_analysis_at: new Date().toISOString(),
        image_analysis_status: "ok",
      } as any)
      .eq("id", projectId);
    return { ok: true as const, analise };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Falha ao analisar a foto.";
    await supabase
      .from("projects")
      .update({ image_analysis_status: "falhou" } as any)
      .eq("id", projectId);
    console.error("[foto] análise falhou:", mensagem);
    return { ok: false as const, mensagem };
  }
}
