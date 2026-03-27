import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-400",
  trend,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg bg-zinc-800", iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trend.positive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-zinc-400 text-xs mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-800" />
      </div>
      <div className="h-3 w-24 bg-zinc-800 rounded mb-2" />
      <div className="h-7 w-32 bg-zinc-800 rounded" />
    </div>
  );
}
