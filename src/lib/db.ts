import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Query logging is dev-only — on serverless it floods the function logs
    // and every query round-trips through the log transport.
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "error", "warn"],
  });

// Cache on the global in every environment: in dev it survives HMR (one
// client, not one per reload); on a warm serverless instance it's reused
// across invocations. Connection count is bounded by the pooled DATABASE_URL.
globalForPrisma.prisma = db;
