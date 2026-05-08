import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-blue-400",
  iconBg = "bg-zinc-800/80",
  trend,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-200 group",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl", iconBg, iconColor)}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              trend.positive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-2">{subtitle}</p>}
    </div>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-9 h-9 rounded-xl bg-zinc-800" />
      </div>
      <div className="h-2.5 w-20 bg-zinc-800 rounded mb-3" />
      <div className="h-7 w-28 bg-zinc-800 rounded" />
    </div>
  );
}
