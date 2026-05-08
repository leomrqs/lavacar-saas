import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // REGRA 7 — Bloquear inadimplentes em tempo real
  if (session.user.role !== "SUPER_ADMIN" && session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { isActive: true },
    });
    if (!tenant?.isActive) redirect("/login?error=blocked");
  }

  let tenantName: string | undefined;
  if (session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    });
    tenantName = tenant?.name;
  }

  const userName = session.user.name ?? session.user.email ?? "";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        role={session.user.role}
        tenantName={tenantName}
        userName={userName}
      />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar
          userName={userName}
          role={session.user.role}
          tenantName={tenantName}
        />
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {children}
        </div>
      </main>
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
        toastOptions={{
          className: "!bg-zinc-900 !border-zinc-800 !text-white",
        }}
      />
    </div>
  );
}
