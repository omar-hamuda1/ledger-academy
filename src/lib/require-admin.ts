import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";

/**
 * Gate for admin-only server code. Checks the JWT claims *and* re-reads the
 * account, so demoting or disabling an admin takes effect on the next request
 * rather than waiting for the token to expire. One indexed PK lookup — admin
 * routes are low-traffic.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" || !session.user.id) return null;

  const account = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, disabledAt: true },
  });
  if (!account || account.role !== "ADMIN" || account.disabledAt) return null;

  return session.user;
}
