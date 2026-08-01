import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label = "Copiar",
  className,
  variant = "outline",
  size = "sm",
}: {
  value: string | null | undefined;
  label?: string;
  className?: string;
  variant?: "outline" | "ghost" | "secondary" | "default";
  size?: "sm" | "default" | "icon";
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    const texto = (value ?? "").toString();
    if (!texto.trim()) {
      toast.error("Não há conteúdo para copiar.");
      return;
    }
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success("Copiado!");
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      toast.error("Seu navegador bloqueou a cópia automática.");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={copiar}
      className={cn("gap-1.5", className)}
    >
      {copiado ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {size !== "icon" && label}
    </Button>
  );
}
