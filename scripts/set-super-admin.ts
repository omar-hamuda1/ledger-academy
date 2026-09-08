import { PrismaClient, Role } from "@prisma/client";

/**
 * Grant or revoke the `superAdmin` flag on an account. A super-admin is a
 * normal ADMIN whose account cannot be modified (role change / disable /
 * password reset) by any *other* admin through the app — only by another
 * super-admin, or by direct DB access like this script.
 *
 * There is deliberately NO API or UI path to set this flag: the only way to
 * create a super-admin is to already have DB/filesystem access, which is the
 * same bar as `prisma studio` or a raw SQL client. That's what makes the
 * protection meaningful.
 *
 * Granting also forces the account to `role: ADMIN` (a super-admin who wasn't
 * an admin makes no sense). Revoking leaves the account as a plain ADMIN.
 *
 * Usage:
 *   npm run admin:super -- --email you@example.com            # grant
 *   npm run admin:super -- --email you@example.com --revoke   # revoke
 *   npm run admin:super -- --list                             # show current super-admins
 */

function parseArgs(): { email?: string; revoke: boolean; list: boolean } {
  const args = process.argv.slice(2);
  const out: { email?: string; revoke: boolean; list: boolean } = { revoke: false, list: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--revoke") out.revoke = true;
    else if (args[i] === "--list") out.list = true;
    else if (args[i] === "--email") {
      out.email = args[i + 1];
      i++;
    }
  }
  return out;
}

async function main() {
  const { email, revoke, list } = parseArgs();
  const db = new PrismaClient();

  if (list) {
    const supers = await db.user.findMany({
      where: { superAdmin: true },
      select: { email: true, name: true, disabledAt: true },
      orderBy: { createdAt: "asc" },
    });
    if (supers.length === 0) {
      console.log("No super-admins.");
    } else {
      console.log(`Super-admins (${supers.length}):`);
      for (const s of supers) {
        console.log(`  - ${s.email}  (${s.name})${s.disabledAt ? "  [disabled]" : ""}`);
      }
    }
    await db.$disconnect();
    return;
  }

  if (!email) {
    console.error(
      "Usage:\n" +
        "  npm run admin:super -- --email you@example.com            # grant\n" +
        "  npm run admin:super -- --email you@example.com --revoke   # revoke\n" +
        "  npm run admin:super -- --list",
    );
    process.exit(1);
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    console.error(`No account with email ${email}. Create it first (signup, or npm run admin:recover).`);
    await db.$disconnect();
    process.exit(1);
  }

  if (revoke) {
    const user = await db.user.update({ where: { email }, data: { superAdmin: false } });
    console.log(`✓ ${user.email} is no longer a super-admin (still role: ${user.role}).`);
  } else {
    const user = await db.user.update({
      where: { email },
      data: { superAdmin: true, role: Role.ADMIN },
    });
    console.log(`✓ ${user.email} is now a super-admin — other admins can no longer change or disable this account.`);
  }

  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
