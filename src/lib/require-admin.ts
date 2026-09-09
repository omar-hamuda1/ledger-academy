import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { db } from "./db";
import { adminHasScope, type AdminScope } from "./authz";

/**
 * Gate for admin-only server code. Checks the JWT claims *and* re-reads the
 * account, so demoting or disabling an admin (or changing their permission
 * scopes) takes effect on the next request rather than waiting for the token to
 * expire. One indexed PK lookup — admin routes are low-traffic. Returns the
 * session user widened with the fresh `superAdmin` flag and `restrictedScopes`.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" || !session.user.id) return null;

  const account = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, disabledAt: true, superAdmin: true, restrictedScopes: true },
  });
  if (!account || account.role !== "ADMIN" || account.disabledAt) return null;

  return {
    ...session.user,
    superAdmin: account.superAdmin,
    restrictedScopes: account.restrictedScopes,
  };
}

export type AdminActor = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>;

/**
 * Like `requireAdmin` but also requires the admin not be restricted from
 * `scope`. Returns null (caller sends 403) otherwise. Super-admins always pass.
 */
export async function requireScope(scope: AdminScope) {
  const admin = await requireAdmin();
  if (!admin) return null;
  return adminHasScope(admin, scope) ? admin : null;
}

/**
 * Page-level guard for a scoped admin route (server components). Redirects
 * instead of returning null: non-admins to the student dashboard, a restricted
 * admin to the admin home with a `?denied=` flag the home page can surface.
 */
export async function requireScopePage(scope: AdminScope): Promise<AdminActor> {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard/student");
  if (!adminHasScope(admin, scope)) redirect(`/dashboard/admin?denied=${scope}`);
  return admin;
}
