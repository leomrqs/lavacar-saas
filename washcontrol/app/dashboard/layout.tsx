import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Toaster } from "sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // REGRA 7 — Bloquear inadimplentes em tempo real (enquanto estão logados)
  if (session.user.role !== "SUPER_ADMIN" && session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { isActive: true, name: true },
    });

    if (!tenant?.isActive) {
      redirect("/login?error=blocked");
    }
  }

  // Buscar nome do tenant para exibir na sidebar
  let tenantName: string | undefined;
  if (session.user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    });
    tenantName = tenant?.name;
  }

  return (
    <div className="flex h-screen bg-zinc-900 overflow-hidden">
      <Sidebar
        role={session.user.role}
        tenantName={tenantName}
        userName={session.user.name ?? session.user.email ?? ""}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        closeButton
      />
    </div>
  );
}
