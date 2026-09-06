import { Cairo } from "next/font/google";
import { db } from "@/lib/db";
import { LedgerHeader } from "@/components/ledger-academy/LedgerHeader";
import { LedgerFooter } from "@/components/ledger-academy/LedgerFooter";
import { CourseCard } from "@/components/ledger-academy/CourseCard";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"] });

export const revalidate = 300;

export default async function CourseCatalogPage() {
  const courses = await db.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div dir="rtl" lang="ar" className={`${cairo.className} flex min-h-screen flex-col bg-navy-950 text-slate-100`}>
      <LedgerHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-16">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-blue-400">الكورسات</span>
          <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            كل كورسات إدارة الأعمال
          </h1>
          <p className="mt-4 text-slate-400">
            اختر مستواك الدراسي وابدأ رحلتك التعليمية في إدارة الأعمال.
          </p>
        </div>

        {courses.length === 0 ? (
          <p className="text-center text-slate-400">لا توجد كورسات منشورة حاليًا.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>

      <LedgerFooter />
    </div>
  );
}
