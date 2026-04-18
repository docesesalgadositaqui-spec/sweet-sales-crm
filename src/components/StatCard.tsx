import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning";
}

export function StatCard({ label, value, hint, icon: Icon, accent = "primary" }: Props) {
  return (
    <Card className="p-5 border-border/60 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            accent === "primary" && "bg-[var(--gradient-primary)] text-primary-foreground",
            accent === "success" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
            accent === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
