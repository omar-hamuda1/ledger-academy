import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Break-glass admin recovery: sets (or creates) a user's password directly
 * in the database and forces their role to ADMIN, bypassing the normal
 * forgot-password email-OTP flow entirely. Exists because this project has
 * only ever had a single ADMIN account, and password reset for that
 * account depends on the same email system that isn't always working —
 * without this, a lockout would be unrecoverable.
 *
 * Requires direct filesystem/DATABASE_URL access already, so it adds no
 * new attack surface: anyone who could run this already has full DB
 * control via `prisma studio` or a raw SQL client anyway.
 *
 * Usage:
 *   npm run admin:recover -- --email you@example.com --password "NewPass123" [--name "اسمك"]
 */

function parseArgs(): { email?: string; password?: string; name?: string } {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      out[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return out;
}

async function main() {
  const { email, password, name } = parseArgs();

  if (!email || !password) {
    console.error(
      'Usage: npm run admin:recover -- --email you@example.com --password "NewPass123" [--name "اسمك"]'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const db = new PrismaClient();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN },
    create: { email, name: name ?? "Admin", passwordHash, role: Role.ADMIN },
  });

  console.log(`✓ ${user.email} now has the given password and ADMIN role.`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
