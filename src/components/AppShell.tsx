import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Settings,
  Sparkles,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/projetos/novo", label: "Criar conteúdo", icon: Plus },
  { to: "/projetos", label: "Projetos", icon: FolderKanban },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/personagens", label: "Personagens", icon: Users },
  { to: "/cenarios", label: "Cenários", icon: Sparkles },
  { to: "/templates", label: "Templates", icon: FileText },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map((item) => {
        const ativo =
          item.to === "/"
            ? pathname === "/"
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setAberto(false)}
            className={cn(
              "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium interactive",
              ativo
                ? "bg-primary/12 text-primary shadow-[inset_0_1px_0_oklch(1_0_0/0.06)]"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary transition-opacity duration-300",
                ativo ? "opacity-100" : "opacity-0",
              )}
            />
            <item.icon className="size-4 transition-transform duration-300 group-hover:scale-110" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/80 px-4 py-6 backdrop-blur-xl lg:flex">
        <Brand />
        <div className="mt-8 flex flex-1 flex-col">{nav}</div>
        <p className="px-3 pt-6 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
          Workspace privado
        </p>
      </aside>

      {aberto ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Fechar menu"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setAberto(false)}
          />
          {/* Drawer nunca ultrapassa a viewport em telas muito estreitas */}
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col overflow-y-auto overscroll-contain border-r border-sidebar-border bg-sidebar px-4 py-6">
            <div className="flex items-center justify-between">
              <Brand />
              <Button variant="ghost" size="icon" onClick={() => setAberto(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="mt-8 flex flex-1 flex-col">{nav}</div>
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-border bg-background/70 px-4 py-2 backdrop-blur-xl lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setAberto(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </Button>
          <Brand compact />
        </header>
        {/* Padding fluido: acompanha a largura entre mobile e ultrawide */}
        <main className="mx-auto w-full max-w-6xl px-[clamp(1rem,4vw,2rem)] py-[clamp(1.5rem,4vw,3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function Brand({ compact }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_6px_18px_-8px_var(--color-primary)]">
        <Wand2 className="size-4" />
      </span>
      <span className={cn("font-display text-base font-bold tracking-[-0.03em]", compact && "text-sm")}>
        Studio<span className="text-primary">IA</span>
      </span>
    </Link>
  );
}

export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-[clamp(1.5rem,4vw,2rem)] flex flex-col gap-4 stagger sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-[clamp(1.5rem,1.1rem+2vw,2.5rem)] font-bold">{titulo}</h1>
        {descricao ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{descricao}</p>
        ) : null}
      </div>
      {acoes ? <div className="flex w-full flex-wrap gap-2 sm:w-auto [&>*]:min-h-11 [&>*]:flex-1 sm:[&>*]:flex-none">{acoes}</div> : null}
    </div>
  );
}