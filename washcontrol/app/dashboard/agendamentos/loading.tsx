import { KpiCardSkeleton } from "@/components/dashboard/KpiCard";

export default function AgendamentosLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-32 bg-zinc-800/60 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-44 bg-zinc-800 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-zinc-800 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex gap-4 animate-pulse">
            <div className="w-16 h-16 rounded-xl bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-zinc-800 rounded" />
              <div className="h-3 w-60 bg-zinc-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
