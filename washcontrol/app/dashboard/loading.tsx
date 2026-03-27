import { KpiCardSkeleton } from "@/components/dashboard/KpiCard";

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 h-60 animate-pulse">
            <div className="h-4 w-40 bg-zinc-800 rounded mb-4" />
            <div className="h-full bg-zinc-800/50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
