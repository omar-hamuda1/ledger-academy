// Admin permission scopes. Every `role: ADMIN` account can do everything by
// default; a super-admin can take individual sections away by adding their keys
// to `User.restrictedScopes` (a deny-list — empty means full access). Super-admins
// are never subject to scopes. Written only by the super-admin-only `setPermissions`
// action on PATCH /api/users/[id]; enforced by `requireScope` / `requireScopePage`
// (src/lib/require-admin.ts), the sidebar (DashboardShell), and a middleware backstop.

export const ADMIN_SCOPES = [
  "courses",
  "progress",
  "users",
  "codes",
  "notifications",
  "settings",
  "reviews",
  "audit",
] as const;

export type AdminScope = (typeof ADMIN_SCOPES)[number];

export const SCOPE_LABELS: Record<AdminScope, string> = {
  courses: "الكورسات والدروس",
  progress: "تقدّم الطلاب",
  users: "المستخدمون والمحاضرون",
  codes: "الأكواد والطلبات",
  notifications: "الإشعارات",
  settings: "الإعدادات العامة",
  reviews: "التقييمات",
  audit: "سجل النشاط",
};

export const SCOPE_HINTS: Record<AdminScope, string> = {
  courses: "إنشاء وتعديل الكورسات والوحدات والدروس والاختبارات والمرفقات والأسعار",
  progress: "عرض تقدّم الطلاب في الكورسات",
  users: "ترقية/خفض المحاضرين، تعطيل الحسابات، إعادة تعيين كلمات المرور، الحذف",
  codes: "توليد أكواد الكورسات ومراجعة طلبات الشراء",
  notifications: "إرسال الإشعارات العامة للطلاب",
  settings: "تعديل إعدادات الموقع العامة",
  reviews: "إخفاء أو حذف تقييمات الطلاب",
  audit: "الاطّلاع على سجل نشاط الإدارة",
};

export function isAdminScope(value: string): value is AdminScope {
  return (ADMIN_SCOPES as readonly string[]).includes(value);
}

/** True when the admin may use `scope`. Super-admins always can. */
export function adminHasScope(
  user: { superAdmin?: boolean | null; restrictedScopes?: string[] | null },
  scope: AdminScope,
): boolean {
  if (user.superAdmin) return true;
  return !(user.restrictedScopes ?? []).includes(scope);
}

// URL-prefix → scope, for the middleware backstop and the page guard. Order
// doesn't matter (prefixes don't overlap); `/dashboard/admin` itself (the home)
// maps to nothing and is always allowed.
export const ADMIN_PATH_SCOPES: [prefix: string, scope: AdminScope][] = [
  ["/dashboard/admin/courses", "courses"],
  ["/dashboard/admin/lessons", "courses"],
  ["/dashboard/admin/progress", "progress"],
  ["/dashboard/admin/users", "users"],
  ["/dashboard/admin/prepaid-codes", "codes"],
  ["/dashboard/admin/code-orders", "codes"],
  ["/dashboard/admin/notifications", "notifications"],
  ["/dashboard/admin/settings", "settings"],
  ["/dashboard/admin/audit", "audit"],
];

export function scopeForPath(pathname: string): AdminScope | null {
  for (const [prefix, scope] of ADMIN_PATH_SCOPES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return scope;
  }
  return null;
}
