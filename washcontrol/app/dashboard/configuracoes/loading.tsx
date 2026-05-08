export default function ConfiguracoesLoading() {
  return (
    <div className="p-6 space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <div className="h-6 w-36 bg-zinc-800 rounded animate-pulse" />
        <div className="h-3 w-56 bg-zinc-800/60 rounded mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-lg bg-zinc-800" />
            <div className="space-y-1">
              <div className="h-5 w-8 bg-zinc-800 rounded" />
              <div className="h-2 w-16 bg-zinc-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
          <div className="px-6 py-4 border-b border-zinc-800">
            <div className="h-4 w-36 bg-zinc-800 rounded" />
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-3 w-28 bg-zinc-800/60 rounded" />
                <div className="h-10 bg-zinc-800 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-zinc-800/60 rounded" />
                <div className="h-10 bg-zinc-800 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
