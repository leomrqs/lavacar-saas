export default function LavacarrosLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-28 bg-zinc-800/60 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-zinc-800 rounded-xl animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 flex-1 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
        <div className="h-10 w-36 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="border-b border-zinc-800 h-10 bg-zinc-800/30" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-zinc-800/50 animate-pulse">
            <div className="h-4 w-36 bg-zinc-800 rounded" />
            <div className="h-3 w-24 bg-zinc-800/60 rounded" />
            <div className="h-5 w-16 bg-zinc-800 rounded-full" />
            <div className="h-4 w-20 bg-zinc-800 rounded ml-auto" />
            <div className="h-4 w-10 bg-zinc-800 rounded" />
            <div className="h-4 w-12 bg-zinc-800 rounded" />
            <div className="h-5 w-16 bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
