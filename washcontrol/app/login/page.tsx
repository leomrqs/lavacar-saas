import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { Car, BarChart3, Calendar, Droplets } from "lucide-react";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex">
      {/* Esquerda — visual do sistema */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/10 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl">WashControl</span>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Gestão completa para<br />
            <span className="text-blue-400">seu lava-jato</span>
          </h2>
          <p className="text-zinc-400 text-lg">
            Do agendamento ao financeiro, tudo em um só lugar.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { icon: Calendar, label: "Agendamentos", desc: "Controle sua agenda" },
              { icon: Car, label: "Pátio Kanban", desc: "Fila em tempo real" },
              { icon: BarChart3, label: "Financeiro", desc: "DRE e fluxo de caixa" },
              { icon: Droplets, label: "Insumos", desc: "Estoque controlado" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm"
              >
                <item.icon className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-zinc-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-zinc-300 text-sm">Sistema ativo e seguro</span>
          </div>
        </div>
      </div>

      {/* Direita — formulário */}
      <div className="flex-1 flex items-center justify-center bg-zinc-900 p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">WashControl</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Entrar na sua conta</h1>
            <p className="text-zinc-400 mt-2">
              Acesse o painel de gestão do seu lava-jato.
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-zinc-600 text-xs">
            © {new Date().getFullYear()} WashControl. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
