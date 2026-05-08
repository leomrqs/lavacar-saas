"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Car,
  ClipboardList,
  Users,
  Package,
  DollarSign,
  UserCog,
  Settings,
  CreditCard,
  Building2,
  LogOut,
  Droplets,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "MANAGER"],
    group: "principal",
  },
  {
    href: "/dashboard/agendamentos",
    label: "Agendamentos",
    icon: Calendar,
    roles: ["MANAGER"],
    group: "operacao",
  },
  {
    href: "/dashboard/patio",
    label: "Pátio",
    icon: Car,
    roles: ["MANAGER", "WASHER"],
    group: "operacao",
  },
  {
    href: "/dashboard/os",
    label: "Ordens de Serviço",
    icon: ClipboardList,
    roles: ["MANAGER"],
    group: "operacao",
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: Users,
    roles: ["MANAGER"],
    group: "cadastro",
  },
  {
    href: "/dashboard/insumos",
    label: "Insumos",
    icon: Package,
    roles: ["MANAGER"],
    group: "cadastro",
  },
  {
    href: "/dashboard/financeiro",
    label: "Financeiro",
    icon: DollarSign,
    roles: ["MANAGER"],
    group: "gestao",
  },
  {
    href: "/dashboard/equipe",
    label: "Equipe",
    icon: UserCog,
    roles: ["MANAGER"],
    group: "gestao",
  },
  {
    href: "/dashboard/configuracoes",
    label: "Configurações",
    icon: Settings,
    roles: ["MANAGER"],
    group: "sistema",
  },
  // SUPER_ADMIN
  {
    href: "/dashboard/lavacarros",
    label: "Lava-Jatos",
    icon: Building2,
    roles: ["SUPER_ADMIN"],
    group: "admin",
  },
  {
    href: "/dashboard/faturamento",
    label: "Faturamento SaaS",
    icon: CreditCard,
    roles: ["SUPER_ADMIN"],
    group: "admin",
  },
];

const GROUP_LABELS: Record<string, string> = {
  principal: "",
  operacao: "Operação",
  cadastro: "Cadastros",
  gestao: "Gestão",
  sistema: "Sistema",
  admin: "Administração",
};

interface SidebarProps {
  role: string;
  tenantName?: string;
  userName?: string;
}

export function Sidebar({ role, tenantName, userName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const groups: { label: string; items: NavItem[] }[] = [];
  const seen = new Set<string>();
  for (const item of visibleItems) {
    const g = item.group ?? "principal";
    if (!seen.has(g)) {
      seen.add(g);
      groups.push({
        label: GROUP_LABELS[g] ?? "",
        items: visibleItems.filter((i) => (i.group ?? "principal") === g),
      });
    }
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 border-b border-zinc-800/80 shrink-0",
        collapsed ? "justify-center px-3" : "gap-3 px-4"
      )}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
          <Droplets className="w-4.5 h-4.5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-base tracking-tight truncate flex-1">
            WashControl
          </span>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
            title="Recolher menu"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden shrink-0 text-zinc-500 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Expand button when collapsed (desktop only) */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="hidden lg:flex items-center justify-center h-9 w-full border-b border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-all"
          title="Expandir menu"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Tenant info */}
      {!collapsed && tenantName && (
        <div className="px-4 py-3 border-b border-zinc-800/80 shrink-0">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Lava-Jato</p>
          <p className="text-sm text-white font-semibold truncate mt-0.5">{tenantName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {groups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "pt-2" : ""}>
            {group.label && !collapsed && (
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold px-3 pb-1.5 pt-3">
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="my-2 mx-2 border-t border-zinc-800/60" />
            )}
            {group.items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-150 relative",
                    isActive
                      ? "bg-blue-600/10 text-blue-400 font-semibold"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60",
                    collapsed && "justify-center px-2.5"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-500" />
                  )}
                  <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "drop-shadow-sm")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800/80 p-3 shrink-0">
        {!collapsed && (
          <div className="px-3 py-2 mb-2 rounded-lg bg-zinc-800/40">
            <p className="text-xs text-zinc-300 font-medium truncate">{userName}</p>
            <p className="text-[10px] text-zinc-500 capitalize mt-0.5">
              {role === "SUPER_ADMIN"
                ? "Super Admin"
                : role === "MANAGER"
                ? "Gestor"
                : "Lavador"}
            </p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            "flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] text-zinc-400 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150",
            collapsed && "justify-center px-2.5"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-xl"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-zinc-950 border-r border-zinc-800/80 transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-full bg-zinc-950 border-r border-zinc-800/80 transition-all duration-300 shrink-0",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
