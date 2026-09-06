"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:border-red-400/40 hover:text-red-400"
    >
      <LogOut size={16} />
      تسجيل الخروج
    </button>
  );
}
