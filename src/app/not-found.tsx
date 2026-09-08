import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-screen flex-col items-center justify-center gap-5 bg-navy-950 px-6 text-center text-slate-100"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-400/10 text-gold-400">
        <Compass size={28} />
      </span>
      <div>
        <p className="text-4xl font-extrabold text-white">٤٠٤</p>
        <h1 className="mt-2 text-lg font-bold text-white">الصفحة غير موجودة</h1>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          الرابط الذي طلبته غير صحيح أو تم نقله.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-control bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
        >
          الصفحة الرئيسية
        </Link>
        <Link
          href="/courses"
          className="rounded-control border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition hover:border-blue-400 hover:text-blue-300"
        >
          تصفّح الكورسات
        </Link>
      </div>
    </div>
  );
}
