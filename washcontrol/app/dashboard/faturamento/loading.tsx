import { KpiCardSkeleton } from "@/components/dashboard/KpiCard";

export default function FaturamentoLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="h-6 w-44 bg-zinc-800 rounded animate-pulse" />
        <div className="h-3 w-48 bg-zinc-800/60 rounded mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-64 animate-pulse">
        <div className="h-4 w-52 bg-zinc-800 rounded mb-6" />
        <div className="h-full bg-zinc-800/40 rounded-lg" />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-zinc-800/50 animate-pulse">
            <div className="flex-1 space-y-1">
              <div className="h-4 w-36 bg-zinc-800 rounded" />
              <div className="h-2 w-20 bg-zinc-800/60 rounded" />
            </div>
            <div className="h-5 w-16 bg-zinc-800 rounded-full" />
            <div className="h-4 w-20 bg-zinc-800 rounded" />
            <div className="h-3 w-24 bg-zinc-800/60 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
