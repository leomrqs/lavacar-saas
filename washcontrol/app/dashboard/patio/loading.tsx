export default function PatioLoading() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <div className="h-6 w-20 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-32 bg-zinc-800/60 rounded mt-1.5 animate-pulse" />
        </div>
        <div className="h-9 w-28 bg-zinc-800 rounded-lg animate-pulse" />
      </div>
      <div className="flex gap-4 h-full p-6 overflow-x-auto">
        {[1, 2, 3].map((col) => (
          <div key={col} className="flex flex-col w-80 min-w-[20rem] rounded-xl border border-zinc-800 bg-zinc-900/50">
            <div className="px-4 py-3 rounded-t-xl bg-zinc-800/30 animate-pulse">
              <div className="h-4 w-24 bg-zinc-800 rounded" />
            </div>
            <div className="flex-1 p-3 space-y-3">
              {[1, 2].map((card) => (
                <div key={card} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800" />
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-zinc-800 rounded" />
                        <div className="h-3 w-28 bg-zinc-800/60 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="h-7 bg-zinc-800/60 rounded-lg" />
                  <div className="h-3 w-24 bg-zinc-800/60 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
