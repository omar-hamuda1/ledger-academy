import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-admin";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  // Fresh read (not the possibly-stale JWT) so the sidebar reflects a
  // permission change on the next page load.
  const admin = await requireAdmin();

  return (
    <DashboardShell
      role="admin"
      userName={session?.user?.name}
      superAdmin={admin?.superAdmin ?? false}
      restrictedScopes={admin?.restrictedScopes ?? []}
    >
      {children}
    </DashboardShell>
  );
}
