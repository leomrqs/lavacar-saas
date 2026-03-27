export default function PatioLoading() {
  return (
    <div className="flex gap-4 p-6 h-full overflow-x-auto">
      {["Aguardando", "Lavando", "Pronto"].map((col) => (
        <div key={col} className="w-80 min-w-[20rem] rounded-xl border border-zinc-800 bg-zinc-900/50 animate-pulse">
          <div className="px-4 py-3 bg-zinc-800 rounded-t-xl">
            <div className="h-4 w-24 bg-zinc-700 rounded" />
          </div>
          <div className="p-3 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg" />
                  <div className="space-y-1">
                    <div className="h-4 w-20 bg-zinc-800 rounded" />
                    <div className="h-3 w-28 bg-zinc-800 rounded" />
                  </div>
                </div>
                <div className="h-7 bg-zinc-800 rounded-lg" />
                <div className="h-3 w-24 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
