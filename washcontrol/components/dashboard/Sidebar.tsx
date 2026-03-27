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
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["SUPER_ADMIN", "MANAGER"],
  },
  {
    href: "/dashboard/agendamentos",
    label: "Agendamentos",
    icon: Calendar,
    roles: ["MANAGER"],
  },
  {
    href: "/dashboard/patio",
    label: "Pátio",
    icon: Car,
    roles: ["SUPER_ADMIN", "MANAGER", "WASHER"],
  },
  {
    href: "/dashboard/os",
    label: "Ordens de Serviço",
    icon: ClipboardList,
    roles: ["MANAGER"],
  },
  {
    href: "/dashboard/clientes",
    label: "Clientes",
    icon: Users,
    roles: ["MANAGER"],
  },
  {
    href: "/dashboard/insumos",
    label: "Insumos",
    icon: Package,
    roles: ["MANAGER"],
  },
  {
    href: "/dashboard/financeiro",
    label: "Financeiro",
    icon: DollarSign,
    roles: ["MANAGER"],
  },
  {
    href: "/dashboard/equipe",
    label: "Equipe",
    icon: UserCog,
    roles: ["MANAGER"],
  },
  {
    href: "/dashboard/configuracoes",
    label: "Configurações",
    icon: Settings,
    roles: ["MANAGER"],
  },
  // SUPER_ADMIN exclusivo
  {
    href: "/dashboard/lavacarros",
    label: "Lava-Jatos",
    icon: Building2,
    roles: ["SUPER_ADMIN"],
  },
  {
    href: "/dashboard/faturamento",
    label: "Faturamento SaaS",
    icon: CreditCard,
    roles: ["SUPER_ADMIN"],
  },
];

interface SidebarProps {
  role: string;
  tenantName?: string;
  userName?: string;
}

export function Sidebar({ role, tenantName, userName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-zinc-950 border-r border-zinc-800 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <Droplets className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-base truncate">
            WashControl
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "ml-auto text-zinc-500 hover:text-zinc-300 transition-colors",
            collapsed && "ml-0 mx-auto"
          )}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>

      {/* Tenant info */}
      {!collapsed && tenantName && (
        <div className="px-4 py-3 border-b border-zinc-800">
          <p className="text-xs text-zinc-500 uppercase tracking-wider">Lava-Jato</p>
          <p className="text-sm text-white font-medium truncate">{tenantName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {visibleItems.map((item) => {
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "bg-blue-600/15 text-blue-400 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-3">
        {!collapsed && (
          <div className="px-2 py-1 mb-2">
            <p className="text-xs text-zinc-500 truncate">{userName}</p>
            <p className="text-xs text-zinc-600 capitalize">
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
            "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}
