import { notFound } from "next/navigation";
import { Cairo } from "next/font/google";
import { BookOpen, PlayCircle } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { LedgerHeader } from "@/components/ledger-academy/LedgerHeader";
import { LedgerFooter } from "@/components/ledger-academy/LedgerFooter";
import { EnrollButton } from "@/components/course/EnrollButton";
import { RedeemCodeForm } from "@/components/course/RedeemCodeForm";
import { RequestAccessForm } from "@/components/course/RequestAccessForm";
import { getSiteSettings } from "@/lib/site-settings";

const cairo = Cairo({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700", "800"] });

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });

  if (!course) notFound();

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const enrollment = userId
    ? await db.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } },
      })
    : null;

  const price = Number(course.price);
  const showPaidAccess = !!userId && !enrollment && price > 0;

  const [pendingOrder, settings] = showPaidAccess
    ? await Promise.all([
        db.codeOrder.findFirst({
          where: { userId: userId!, courseId: course.id, status: "PENDING" },
          select: { id: true },
        }),
        getSiteSettings(),
      ])
    : [null, null];

  const firstLesson = course.modules[0]?.lessons[0];
  const firstLessonHref = firstLesson
    ? `/dashboard/student/courses/${course.slug}/${firstLesson.id}`
    : null;

  return (
    <div dir="rtl" lang="ar" className={`${cairo.className} flex min-h-screen flex-col bg-navy-950 text-slate-100`}>
      <LedgerHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
        {course.grade && (
          <span className="mb-3 inline-block text-sm font-bold text-blue-400">{course.grade}</span>
        )}
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{course.title}</h1>
        <p className="mt-4 leading-relaxed text-slate-400">{course.description}</p>

        <div className="mt-6">
          <EnrollButton
            courseId={course.id}
            isEnrolled={!!enrollment}
            firstLessonHref={firstLessonHref}
            price={Number(course.price)}
          />
        </div>

        {showPaidAccess && (
          <div className="mt-4 grid max-w-3xl gap-4 sm:grid-cols-2">
            <RedeemCodeForm courseId={course.id} />
            <RequestAccessForm
              courseId={course.id}
              pending={!!pendingOrder}
              paymentInstructions={settings?.paymentInstructions ?? null}
            />
          </div>
        )}

        <div className="mt-10 space-y-4">
          {course.modules.map((module, index) => (
            <div key={module.id} className="rounded-2xl border border-white/10 bg-navy-900/60 p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-400/10 text-gold-400">
                  <BookOpen size={18} />
                </span>
                <h2 className="font-bold text-white">
                  الوحدة {index + 1}: {module.title}
                </h2>
              </div>
              <ul className="space-y-2">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center gap-2 text-sm text-slate-300">
                    <PlayCircle size={16} className="shrink-0 text-slate-400" />
                    {lesson.title}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <LedgerFooter />
    </div>
  );
}
