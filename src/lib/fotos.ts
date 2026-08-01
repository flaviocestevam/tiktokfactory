import {
  confirmarIdentidadePersonagem,
  enviarFotoPersonagem,
  removerFotoPersonagem,
} from "./personagens.functions";

export type TipoFoto =
  "canonica" | "rosto" | "tres_quartos" | "corpo_inteiro" | "expressao" | "referencia";

export const ROTULOS_FOTO: Record<TipoFoto, string> = {
  canonica: "Foto do perfil",
  rosto: "Foto do rosto",
  tres_quartos: "Foto em três quartos",
  corpo_inteiro: "Foto de corpo inteiro",
  expressao: "Foto com expressão natural",
  referencia: "Foto auxiliar",
};

export const TIPOS_AUXILIARES: TipoFoto[] = [
  "rosto",
  "tres_quartos",
  "corpo_inteiro",
  "expressao",
  "referencia",
];

const MIMES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export function validarImagem(arquivo: File) {
  if (!MIMES.includes(arquivo.type.toLowerCase()))
    return "Formato não aceito. Envie uma imagem JPG, JPEG, PNG ou WEBP.";
  if (arquivo.size > MAX_BYTES) return "Imagem maior que 10 MB. Envie um arquivo menor.";
  if (arquivo.size < 100) return "O arquivo enviado não é uma imagem válida.";
  return null;
}

function paraBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.onload = () => {
      const r = String(leitor.result);
      resolve(r.slice(r.indexOf(",") + 1));
    };
    leitor.readAsDataURL(arquivo);
  });
}

export async function enviarFoto(
  characterId: string,
  tipo: TipoFoto,
  arquivo: File,
  rotulo?: string,
) {
  const erro = validarImagem(arquivo);
  if (erro) throw new Error(erro);
  const base64 = await paraBase64(arquivo);
  return enviarFotoPersonagem({
    data: { characterId, tipo, base64, mime: arquivo.type.toLowerCase(), rotulo },
  });
}

export async function removerFoto(characterId: string, tipo: TipoFoto, fotoId?: string) {
  return removerFotoPersonagem({ data: { characterId, tipo, fotoId } });
}

export async function confirmarIdentidade(characterId: string, confirmada: boolean) {
  return confirmarIdentidadePersonagem({ data: { characterId, confirmada } });
}

export type FotoAuxiliar = {
  id: string;
  tipo: TipoFoto;
  rotulo?: string;
  path: string;
  url: string;
};

export function lerAuxiliares(valor: unknown): FotoAuxiliar[] {
  return Array.isArray(valor) ? (valor as FotoAuxiliar[]).filter((f) => f && f.url) : [];
}
