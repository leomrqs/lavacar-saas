import { KpiCardSkeleton } from "@/components/dashboard/KpiCard";

export default function EquipeLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-36 bg-zinc-800/60 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-44 bg-zinc-800 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 animate-pulse">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-zinc-800 rounded" />
                <div className="h-3 w-20 bg-zinc-800/60 rounded" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 w-40 bg-zinc-800/60 rounded" />
              <div className="h-3 w-48 bg-zinc-800/60 rounded" />
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-800/40 rounded-lg mb-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="text-center space-y-1">
                  <div className="h-3 w-12 bg-zinc-800 rounded mx-auto" />
                  <div className="h-4 w-16 bg-zinc-800 rounded mx-auto" />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-9 bg-zinc-800 rounded-lg" />
              <div className="h-9 w-24 bg-zinc-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
