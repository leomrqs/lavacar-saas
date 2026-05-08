import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { Car, BarChart3, Calendar, Droplets, Shield, Zap } from "lucide-react";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex">
      {/* Left — brand visual */}
      <div className="hidden lg:flex lg:w-[55%] bg-zinc-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_oklch(0.6_0.18_250_/_0.12),_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_oklch(0.6_0.15_280_/_0.08),_transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: "linear-gradient(oklch(0.985 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.985 0 0) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/25">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">WashControl</span>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="space-y-3">
            <p className="text-blue-400/80 text-sm font-medium tracking-wide uppercase">Plataforma SaaS</p>
            <h2 className="text-4xl font-bold text-white leading-[1.15]">
              Gestao inteligente para{" "}
              <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
                seu lava-jato
              </span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Do agendamento ao financeiro, controle tudo em um unico lugar. Simples, rapido e profissional.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Calendar, label: "Agendamentos", desc: "Organize sua agenda" },
              { icon: Car, label: "Patio Kanban", desc: "Fila em tempo real" },
              { icon: BarChart3, label: "Financeiro", desc: "DRE e fluxo de caixa" },
              { icon: Shield, label: "Multi-tenant", desc: "Dados isolados e seguros" },
            ].map((item) => (
              <div
                key={item.label}
                className="group bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center mb-3 group-hover:bg-blue-600/15 transition-colors">
                  <item.icon className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <p className="text-white text-sm font-semibold">{item.label}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-400 text-sm">Sistema ativo e seguro</span>
          </div>
          <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400 text-sm">Resposta em &lt; 2s</span>
          </div>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 sm:p-8">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/25">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">WashControl</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Entrar na sua conta</h1>
            <p className="text-zinc-500 mt-2 text-[15px]">
              Acesse o painel de gestao do seu lava-jato.
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-zinc-600 text-xs">
            &copy; {new Date().getFullYear()} WashControl. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
