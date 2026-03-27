"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error === "CredentialsSignin"
          ? "Email ou senha incorretos."
          : result.error
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-300">
          Email
        </label>
        <input
          {...register("email")}
          type="email"
          placeholder="gestor@lavaJato.com.br"
          autoComplete="email"
          className="w-full h-11 rounded-lg bg-zinc-800 border border-zinc-700 px-4 text-white placeholder-zinc-500 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
        />
        {errors.email && (
          <p className="text-red-400 text-xs">{errors.email.message}</p>
        )}
      </div>

      {/* Senha */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-300">
          Senha
        </label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full h-11 rounded-lg bg-zinc-800 border border-zinc-700 px-4 pr-11 text-white placeholder-zinc-500 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-400 text-xs">{errors.password.message}</p>
        )}
      </div>

      {/* Botão */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSubmitting ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
