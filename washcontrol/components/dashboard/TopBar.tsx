import { cn } from "@/lib/utils";

interface TopBarProps {
  userName: string;
  role: string;
  tenantName?: string;
  className?: string;
}

function getRoleLabel(role: string) {
  if (role === "SUPER_ADMIN") return "Super Admin";
  if (role === "MANAGER") return "Gestor";
  return "Lavador";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function TopBar({ userName, role, tenantName, className }: TopBarProps) {
  return (
    <header
      className={cn(
        "h-16 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950 shrink-0 px-6",
        "pl-16 lg:pl-6", // left padding on mobile to clear hamburger button
        className
      )}
    >
      {/* Left: tenant or platform label */}
      <div className="min-w-0">
        {tenantName ? (
          <p className="text-sm font-semibold text-white truncate">{tenantName}</p>
        ) : (
          <p className="text-sm font-semibold text-white">WashControl</p>
        )}
        <p className="text-xs text-zinc-500 mt-0.5">{getRoleLabel(role)}</p>
      </div>

      {/* Right: user avatar + name */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-white leading-none">{userName}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{getRoleLabel(role)}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-600/20 shrink-0">
          {getInitials(userName || "U")}
        </div>
      </div>
    </header>
  );
}
