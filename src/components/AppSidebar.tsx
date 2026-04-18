import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, Cookie, ShoppingBag, Settings, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/produtos", label: "Produtos", icon: Cookie },
  { to: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-6 py-6 border-b">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-soft)]">
          <Heart className="h-5 w-5" fill="currentColor" />
        </div>
        <div>
          <div className="text-lg font-semibold leading-none">Doçura</div>
          <div className="text-xs text-muted-foreground mt-1">CRM Artesanal</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[var(--shadow-soft)]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 border-t text-xs text-muted-foreground">
        Feito com <Heart className="inline h-3 w-3 text-primary" fill="currentColor" /> para confeiteiras
      </div>
    </aside>
  );
}
