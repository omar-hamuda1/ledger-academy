import Link from "next/link";
import { CheckCircle2, GraduationCap } from "lucide-react";
import { db } from "@/lib/db";
import { formatEgp } from "@/lib/format";
import { LedgerHeader } from "@/components/ledger-academy/LedgerHeader";
import { LedgerFooter } from "@/components/ledger-academy/LedgerFooter";


export const revalidate = 300;

export default async function PricingPage() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div dir="rtl" lang="ar" className="flex min-h-screen flex-col bg-navy-950 text-slate-100">
      <LedgerHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-blue-400">الأسعار</span>
          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            خطط واضحة لكل مستوى دراسي
          </h1>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {courses.map((course) => {
            const price = Number(course.price);
            return (
              <div
                key={course.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-navy-900/60 p-8"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400/10 text-gold-400">
                  <GraduationCap size={24} />
                </span>
                {course.grade && (
                  <span className="mb-2 text-xs font-bold text-blue-400">{course.grade}</span>
                )}
                <h2 className="mb-3 text-xl font-bold text-white">{course.title}</h2>

                <p className="mb-6 text-3xl font-extrabold text-white">
                  {price > 0 ? formatEgp(price) : "مجاني"}
                </p>

                <ul className="mb-6 flex-1 space-y-2">
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-gold-400" />
                    وصول كامل لجميع دروس الكورس
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-gold-400" />
                    اختبارات قصيرة بعد كل درس
                  </li>
                  <li className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-gold-400" />
                    متابعة تقدمك خطوة بخطوة
                  </li>
                </ul>

                <Link
                  href={`/courses/${course.slug}`}
                  className="rounded-lg bg-gold-400 py-3 text-center font-bold text-navy-950 transition hover:bg-gold-300"
                >
                  {price > 0 ? "اشترك الآن" : "ابدأ مجانًا"}
                </Link>
              </div>
            );
          })}
        </div>
      </main>

      <LedgerFooter />
    </div>
  );
}
