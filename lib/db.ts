import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { env } from "@/lib/env";

const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,                          
    idleTimeoutMillis: 30000,         
    connectionTimeoutMillis: 5000,   
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

declare global {
  var prisma: ReturnType<typeof prismaClientSingleton> | undefined;
}

export const db = globalThis.prisma ?? prismaClientSingleton();

if (env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}