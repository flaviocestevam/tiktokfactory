/* eslint-disable @typescript-eslint/no-explicit-any */
// Gerenciamento das fotos canônicas das personagens (armazenamento + banco).

const BUCKET = "personagens";
const UM_ANO = 60 * 60 * 24 * 365;
const MAX_BYTES = 10 * 1024 * 1024;

export const TIPOS_FOTO = [
  "canonica",
  "rosto",
  "tres_quartos",
  "corpo_inteiro",
  "expressao",
  "referencia",
] as const;
export type TipoFoto = (typeof TIPOS_FOTO)[number];

export const ROTULOS_FOTO: Record<TipoFoto, string> = {
  canonica: "Foto canônica principal",
  rosto: "Foto do rosto",
  tres_quartos: "Foto em três quartos",
  corpo_inteiro: "Foto de corpo inteiro",
  expressao: "Foto com expressão natural",
  referencia: "Foto canônica auxiliar",
};

const CAMPO_POR_TIPO: Partial<Record<TipoFoto, string>> = {
  canonica: "foto_canonica_principal",
  rosto: "foto_rosto",
  tres_quartos: "foto_tres_quartos",
  corpo_inteiro: "foto_corpo_inteiro",
  expressao: "foto_expressao",
};

const MIMES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

async function garantirBucket(db: any) {
  const { data } = await db.storage.getBucket(BUCKET);
  if (!data) await db.storage.createBucket(BUCKET, { public: false });
}

function decodificar(base64: string) {
  const binario = atob(base64);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

// Assinatura binária real do arquivo — impede enviar um arquivo qualquer renomeado.
function ehImagem(bytes: Uint8Array) {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return true; // jpg
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return true; // png
  const riff = String.fromCharCode(b[0], b[1], b[2], b[3]);
  const webp = String.fromCharCode(b[8], b[9], b[10], b[11]);
  if (riff === "RIFF" && webp === "WEBP") return true;
  return false;
}

async function urlAssinada(db: any, caminho: string) {
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(caminho, UM_ANO);
  if (error) throw new Error(error.message);
  return (data?.signedUrl ?? "") as string;
}

async function personagem(db: any, id: string) {
  const { data, error } = await db.from("characters").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Personagem não encontrada.");
  return data as Record<string, any>;
}

async function salvar(db: any, id: string, valores: Record<string, unknown>) {
  const { data, error } = await db
    .from("characters")
    .update(valores)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Record<string, any>;
}

function auxiliares(registro: Record<string, any>) {
  const bruto = registro.fotos_canonicas_auxiliares;
  return Array.isArray(bruto) ? (bruto as any[]) : [];
}

export async function enviarFoto(input: {
  characterId: string;
  tipo: TipoFoto;
  base64: string;
  mime: string;
  rotulo?: string;
}) {
  const extensao = MIMES[input.mime.toLowerCase()];
  if (!extensao) throw new Error("Formato não aceito. Envie uma imagem JPG, JPEG, PNG ou WEBP.");

  const bytes = decodificar(input.base64);
  if (bytes.byteLength > MAX_BYTES)
    throw new Error("Imagem maior que 10 MB. Envie um arquivo menor.");
  if (bytes.byteLength < 100 || !ehImagem(bytes))
    throw new Error("O arquivo enviado não é uma imagem válida.");

  const db = await admin();
  await garantirBucket(db);
  const registro = await personagem(db, input.characterId);

  const uuid = crypto.randomUUID();
  const caminho =
    input.tipo === "canonica"
      ? `${input.characterId}/canonica-principal-${uuid}.${extensao}`
      : `${input.characterId}/referencias/${uuid}.${extensao}`;

  const { error } = await db.storage
    .from(BUCKET)
    .upload(caminho, bytes, { contentType: input.mime, upsert: false });
  if (error) throw new Error(error.message);

  const url = await urlAssinada(db, caminho);
  const agora = new Date().toISOString();
  const lista = auxiliares(registro);

  if (input.tipo === "canonica") {
    const anterior = registro.foto_canonica_path as string | null;
    const atualizado = await salvar(db, input.characterId, {
      foto_canonica_principal: url,
      foto_canonica_path: caminho,
      foto_atualizada_em: agora,
      identidade_visual_confirmada: false,
    });
    if (anterior && anterior !== caminho) await db.storage.from(BUCKET).remove([anterior]);
    return atualizado;
  }

  const item = {
    id: uuid,
    tipo: input.tipo,
    rotulo: input.rotulo || ROTULOS_FOTO[input.tipo],
    path: caminho,
    url,
    criado_em: agora,
  };

  const campo = CAMPO_POR_TIPO[input.tipo];
  const anteriorMesmoTipo = campo != null ? lista.find((f) => f?.tipo === input.tipo) : undefined;
  const novaLista = campo
    ? [...lista.filter((f) => f?.tipo !== input.tipo), item]
    : [...lista, item];

  const valores: Record<string, unknown> = {
    fotos_canonicas_auxiliares: novaLista,
    arquivos_referencia: novaLista.map((f) => f.path),
    foto_atualizada_em: agora,
  };
  if (campo) valores[campo] = url;

  const atualizado = await salvar(db, input.characterId, valores);
  if (anteriorMesmoTipo?.path) await db.storage.from(BUCKET).remove([anteriorMesmoTipo.path]);
  return atualizado;
}

export async function removerFoto(input: { characterId: string; tipo: TipoFoto; fotoId?: string }) {
  const db = await admin();
  const registro = await personagem(db, input.characterId);

  if (input.tipo === "canonica") {
    const caminho = registro.foto_canonica_path as string | null;
    const atualizado = await salvar(db, input.characterId, {
      foto_canonica_principal: null,
      foto_canonica_path: null,
      identidade_visual_confirmada: false,
      foto_atualizada_em: new Date().toISOString(),
    });
    if (caminho) await db.storage.from(BUCKET).remove([caminho]);
    return atualizado;
  }

  const lista = auxiliares(registro);
  const alvo = lista.find((f) => f?.id === input.fotoId);
  const novaLista = lista.filter((f) => f?.id !== input.fotoId);
  const valores: Record<string, unknown> = {
    fotos_canonicas_auxiliares: novaLista,
    arquivos_referencia: novaLista.map((f) => f.path),
    foto_atualizada_em: new Date().toISOString(),
  };
  const campo = alvo?.tipo ? CAMPO_POR_TIPO[alvo.tipo as TipoFoto] : undefined;
  if (campo && !novaLista.some((f) => f?.tipo === alvo?.tipo)) valores[campo] = null;

  const atualizado = await salvar(db, input.characterId, valores);
  if (alvo?.path) await db.storage.from(BUCKET).remove([alvo.path]);
  return atualizado;
}

export async function confirmarIdentidade(characterId: string, confirmada: boolean) {
  const db = await admin();
  const registro = await personagem(db, characterId);
  if (confirmada && !registro.foto_canonica_principal)
    throw new Error("Envie a foto canônica principal antes de confirmar a identidade visual.");
  return salvar(db, characterId, { identidade_visual_confirmada: confirmada });
}
