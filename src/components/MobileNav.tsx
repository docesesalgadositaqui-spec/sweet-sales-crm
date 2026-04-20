import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, ShoppingBag, ShoppingCart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/compras", label: "Compras", icon: ShoppingCart },
  { to: "/configuracoes", label: "Config", icon: Settings },
] as const;

export function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
