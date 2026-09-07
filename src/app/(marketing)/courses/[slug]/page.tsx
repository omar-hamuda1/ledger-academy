import { notFound } from "next/navigation";
import { Cairo } from "next/font/google";
import Link from "next/link";
import {
  BookOpen,
  PlayCircle,
  ClipboardCheck,
  ChevronDown,
  User,
  FileText,
  LayoutGrid,
  Clock,
  Infinity as InfinityIcon,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { courseMeta, formatDuration } from "@/lib/course-meta";
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
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: { quiz: { select: { id: true } } },
          },
        },
      },
    },
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

  const meta = courseMeta(course.modules);
  const durationText = formatDuration(meta.durationSec);
  const firstLesson = course.modules[0]?.lessons[0];
  const firstLessonHref = firstLesson
    ? `/dashboard/student/courses/${course.slug}/${firstLesson.id}`
    : null;

  const includes = [
    { icon: PlayCircle, label: `${meta.lessonCount.toLocaleString("ar-EG")} درس فيديو` },
    { icon: ClipboardCheck, label: `${meta.quizCount.toLocaleString("ar-EG")} اختبار تفاعلي` },
    { icon: FileText, label: "ملفات ومراجعات قابلة للتحميل" },
    { icon: LayoutGrid, label: "أدوات: نقطة التعادل و SWOT" },
    { icon: InfinityIcon, label: "وصول دائم بدون اشتراك شهري" },
  ];

  return (
    <div dir="rtl" lang="ar" className={`${cairo.className} flex min-h-screen flex-col bg-navy-950 text-slate-100`}>
      <LedgerHeader />

      {/* hero band */}
      <div className="border-b border-white/10 bg-navy-900/40">
        <div className="mx-auto max-w-6xl px-6 pt-6">
          <p className="text-xs text-slate-500">
            <Link href="/courses" className="transition hover:text-gold-400">
              الكورسات
            </Link>
            {course.grade && <span className="mx-2">/</span>}
            {course.grade}
          </p>
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-9 pt-5">
          {course.grade && (
            <span className="text-sm font-bold text-blue-400">{course.grade}</span>
          )}
          <h1 className="mt-2.5 text-3xl font-extrabold text-white sm:text-4xl">{course.title}</h1>
          <p className="mt-3.5 max-w-2xl leading-relaxed text-slate-400">{course.description}</p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <BookOpen size={15} className="text-gold-400" />
              {meta.moduleCount.toLocaleString("ar-EG")} وحدات
            </span>
            <span className="flex items-center gap-1.5">
              <PlayCircle size={15} className="text-gold-400" />
              {meta.lessonCount.toLocaleString("ar-EG")} درس فيديو
            </span>
            <span className="flex items-center gap-1.5">
              <ClipboardCheck size={15} className="text-gold-400" />
              {meta.quizCount.toLocaleString("ar-EG")} اختبار
            </span>
            <span className="flex items-center gap-1.5">
              <User size={15} className="text-gold-400" />
              المحاضر: محمد حسين
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-6 py-12 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* main column */}
        <div>
          <h2 className="text-xl font-extrabold text-white">محتوى الكورس</h2>
          <p className="mt-1 text-sm text-slate-400">
            {meta.moduleCount.toLocaleString("ar-EG")} وحدات · {meta.lessonCount.toLocaleString("ar-EG")} درسًا
            {durationText && ` · إجمالي ${durationText}`}
          </p>

          {course.modules.length === 0 ? (
            <div className="mt-5 rounded-card border border-dashed border-white/15 bg-navy-900/40 p-10 text-center text-sm text-slate-400">
              محتوى هذا الكورس قيد الإعداد.
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {course.modules.map((module, index) => (
                <details
                  key={module.id}
                  open={index === 0}
                  className="group overflow-hidden rounded-card border border-white/10 bg-navy-900/60 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        size={18}
                        className="shrink-0 text-slate-400 transition group-open:-rotate-180 group-open:text-gold-400"
                      />
                      <h3 className="text-sm font-bold text-white">
                        الوحدة {index + 1}: {module.title}
                      </h3>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {module.lessons.length.toLocaleString("ar-EG")} دروس
                    </span>
                  </summary>
                  <ul className="border-t border-white/[0.06]">
                    {module.lessons.map((lesson, li) => (
                      <li
                        key={lesson.id}
                        className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-3 last:border-0"
                      >
                        <PlayCircle size={15} className="shrink-0 text-slate-500" />
                        <span className="text-sm text-slate-300">{lesson.title}</span>
                        {index === 0 && li === 0 && (
                          <span className="mr-auto shrink-0 text-xs text-gold-400">معاينة</span>
                        )}
                        {lesson.quiz && (
                          <ClipboardCheck size={14} className="mr-auto shrink-0 text-slate-500" />
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}

          {showPaidAccess && (
            <div className="mt-10">
              <h2 className="text-xl font-extrabold text-white">لم تحصل على كود؟ اطلب واحدًا</h2>
              <p className="mt-1 text-sm text-slate-400">
                حوّل قيمة الكورس بإحدى الطرق المتاحة وارفع صورة الإيصال — سنراجع الطلب ونفتح
                لك الكورس.
              </p>
              <div className="mt-4">
                <RequestAccessForm
                  courseId={course.id}
                  pending={!!pendingOrder}
                  paymentInstructions={settings?.paymentInstructions ?? null}
                />
              </div>
            </div>
          )}
        </div>

        {/* sticky purchase sidebar */}
        <aside className="rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card lg:sticky lg:top-24">
          {price > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                {price.toLocaleString("ar-EG")}
              </span>
              <span className="text-sm text-slate-400">ج.م — الكورس كامل</span>
            </div>
          ) : (
            <span className="inline-block rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-400">
              كورس مجاني
            </span>
          )}
          {price > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={13} />
              دفعة واحدة · وصول دائم للمحتوى
            </p>
          )}

          <div className="mt-5">
            <EnrollButton
              courseId={course.id}
              isEnrolled={!!enrollment}
              firstLessonHref={firstLessonHref}
              price={price}
            />
          </div>

          {showPaidAccess && (
            <div className="mt-5">
              <RedeemCodeForm courseId={course.id} />
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5">
            <p className="text-xs font-bold text-slate-300">هذا الكورس يشمل</p>
            {includes.map((item) => (
              <span key={item.label} className="flex items-center gap-2.5 text-sm text-slate-400">
                <item.icon size={15} className="shrink-0 text-gold-400" />
                {item.label}
              </span>
            ))}
          </div>
        </aside>
      </main>

      <LedgerFooter />
    </div>
  );
}
