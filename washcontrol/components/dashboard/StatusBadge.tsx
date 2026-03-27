import { cn, ORDER_STATUS_CLASSES, ORDER_STATUS_LABELS } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const classes = ORDER_STATUS_CLASSES[status] ?? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
  const label = ORDER_STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        classes,
        className
      )}
    >
      {label}
    </span>
  );
}
