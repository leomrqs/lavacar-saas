import { withAuth } from "next-auth/middleware";

// Exporta a função explicitamente para o Turbopack reconhecer
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*", // Protege tudo dentro de /dashboard
  ],
};