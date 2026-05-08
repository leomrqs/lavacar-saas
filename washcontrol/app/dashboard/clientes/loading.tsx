export default function ClientesLoading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-48 bg-zinc-800/60 rounded mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-zinc-800 rounded-xl animate-pulse" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
            <div className="h-3 w-24 bg-zinc-800 rounded mb-2" />
            <div className="h-7 w-12 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>
      <div className="h-10 w-80 bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse" />
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-zinc-800/50 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-zinc-800 rounded" />
              <div className="h-3 w-56 bg-zinc-800/60 rounded" />
            </div>
            <div className="hidden sm:flex gap-6">
              <div className="h-8 w-12 bg-zinc-800 rounded" />
              <div className="h-8 w-12 bg-zinc-800 rounded" />
              <div className="h-8 w-12 bg-zinc-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
