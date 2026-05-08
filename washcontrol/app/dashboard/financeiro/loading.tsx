import { KpiCardSkeleton } from "@/components/dashboard/KpiCard";

export default function FinanceiroLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-40 bg-zinc-800/60 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-44 bg-zinc-800 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
      <div className="flex gap-2 border-b border-zinc-800">
        <div className="h-10 w-32 bg-zinc-800 rounded-t-lg animate-pulse" />
        <div className="h-10 w-36 bg-zinc-800 rounded-t-lg animate-pulse" />
        <div className="h-10 w-28 bg-zinc-800 rounded-t-lg animate-pulse" />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-zinc-800/50 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-zinc-800" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 bg-zinc-800 rounded" />
              <div className="h-3 w-24 bg-zinc-800/60 rounded" />
            </div>
            <div className="h-5 w-20 bg-zinc-800 rounded" />
            <div className="h-5 w-16 bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
