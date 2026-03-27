import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
// Alterado de 'pool' para 'Pool'
import { Pool } from "@neondatabase/serverless"; 

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Alterado para 'new Pool' (P maiúsculo)
const neonPool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(neonPool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;