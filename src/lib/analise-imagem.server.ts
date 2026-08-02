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
  product_interaction_mode: string;
  product_state: string;
  product_location: string;
  body_contact: string;
  hands_state: string;
  active_body_parts: string[];
  product_orientation: string;
  product_apparent_size: string;
  packaging_or_brand_visibility: string;
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
  "product_interaction_mode",
  "product_state",
  "product_location",
  "body_contact",
  "hands_state",
  "product_orientation",
  "product_apparent_size",
  "packaging_or_brand_visibility",
  "lighting",
];

const SHAPE = `{"framing":"","camera_position":"","camera_distance":"","body_position":"","initial_pose":"","initial_expression":"","gaze_direction":"","product_interaction_mode":"","product_state":"","product_location":"","body_contact":"","hands_state":"","active_body_parts":[],"product_orientation":"","product_apparent_size":"","packaging_or_brand_visibility":"","lighting":"","visible_elements":[],"safe_movements":[],"continuity_risks":[]}`;

const SISTEMA = `Você descreve APENAS o que está objetivamente visível em uma foto de uma influenciadora apresentando ou demonstrando um produto.

REGRA CENTRAL: não presuma que o produto seja um objeto portátil ou que esteja em uma mão. Ele pode estar vestido, aplicado no rosto/corpo/cabelo, sendo usado, testado, montado, instalado, apoiado em uma superfície, movimentado, aberto, fechado, conectado ou demonstrado de qualquer outra forma visível e coerente. Roupas, maquiagem, perfume, brinquedos e utensílios de cozinha são apenas exemplos; a análise deve aceitar qualquer produto e qualquer modo real de interação.

- Descreva somente o estado visual: enquadramento, câmera, corpo, pose, expressão, olhar, modo de interação com o produto, estado do produto, localização, contato com corpo ou superfície, mãos quando relevantes, partes do corpo ativas, orientação, iluminação e elementos presentes.
- "product_interaction_mode": descreva como o produto aparece na foto, por exemplo vestido, aplicado, segurado, em uso, apoiado, montado ou instalado. Não escolha um exemplo se a imagem mostrar outra forma.
- "product_state": estado objetivo do produto no frame, como aberto/fechado, ligado/desligado, vestido, parcialmente aplicado, em funcionamento ou estático, somente quando visível.
- "product_location": onde o produto está no frame, sem presumir mão.
- "body_contact": relação visível com corpo, cabelo, rosto, mãos, superfície, outro objeto ou ambiente.
- "hands_state": descreva as duas mãos apenas quando estiverem visíveis ou relevantes. Não invente mão livre e não force o produto para uma mão.
- "active_body_parts": partes do corpo realmente envolvidas na demonstração.
- "packaging_or_brand_visibility": embalagem, marca ou rótulo somente quando existirem e estiverem visíveis. Produtos como roupas e utensílios podem não ter embalagem ou rótulo aparente.
- Quando algo não estiver claramente visível, escreva exatamente: "${NAO_DETERMINADO}".
- Proibido inventar: texto, marca, cores escondidas, parte traseira, mecanismo, componentes, textura, quantidade, tamanho real ou conteúdo interno.
- Não descreva benefícios, características comerciais nem finalidade do produto: isso vem da página de vendas.
- "safe_movements": movimentos naturais possíveis a partir do estado real da foto e do modo de interação observado.
- "continuity_risks": mudanças que quebrariam a continuidade, como trocar a peça vestida, remover maquiagem aplicada, mudar o utensílio de lugar sem transição, trocar uma mão quando o produto realmente estiver sendo segurado ou alterar o estado do produto sem ação visível.
- Responda em português do Brasil.`;

function limpar(bruto: any): AnaliseVisual {
  const saida: any = {};
  for (const campo of CAMPOS_TEXTO) {
    const valor = String(bruto?.[campo] ?? "").trim();
    saida[campo] = valor || NAO_DETERMINADO;
  }
  for (const lista of [
    "active_body_parts",
    "visible_elements",
    "safe_movements",
    "continuity_risks",
  ] as const) {
    saida[lista] = Array.isArray(bruto?.[lista])
      ? bruto[lista]
          .map((i: any) => String(i).trim())
          .filter(Boolean)
          .slice(0, 12)
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
            text: "Analise o estado visual inicial desta foto. Identifique como o produto realmente aparece e está sendo usado ou demonstrado, sem presumir que esteja na mão. Só registre o que está visível.",
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
