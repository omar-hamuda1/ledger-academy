import Link from "next/link";
import { requireScopePage } from "@/lib/require-admin";
import { notFound } from "next/navigation";
import { ArrowRight, Users, UserX, Trophy } from "lucide-react";
import { getCourseInsights } from "@/lib/course-insights";

export const dynamic = "force-dynamic";

export default async function CourseInsightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireScopePage("courses");
  const { id } = await params;
  const data = await getCourseInsights(id);
  if (!data) notFound();

  const cards = [
    { icon: Users, label: "طالب مسجّل", value: data.enrolledCount },
    { icon: UserX, label: "لم يبدأ أي درس", value: data.neverStarted },
    { icon: Trophy, label: "أكمل كل الدروس", value: data.completedAll },
  ];

  // The biggest single drop between consecutive lessons — the "cliff".
  let cliffIndex = -1;
  let cliffDrop = 0;
  for (let i = 1; i < data.funnel.length; i++) {
    const drop = data.funnel[i - 1].completed - data.funnel[i].completed;
    if (drop > cliffDrop) {
      cliffDrop = drop;
      cliffIndex = i;
    }
  }

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <Link
        href={`/dashboard/admin/courses/${id}/edit`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-gold-400"
      >
        <ArrowRight size={16} />
        العودة إلى تعديل الكورس
      </Link>

      <h1 className="text-2xl font-extrabold text-white">تحليل تقدّم الطلاب</h1>
      <p className="mt-2 text-slate-400">{data.courseTitle}</p>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
        {cards.map((c) => (
          <div
            key={c.label}
            className="flex flex-col items-center gap-1 rounded-control border border-white/10 bg-navy-900/60 p-4 text-center shadow-card"
          >
            <c.icon size={18} className="text-gold-400" />
            <p className="text-xl font-extrabold text-white">{c.value.toLocaleString("ar-EG")}</p>
            <p className="text-[11px] text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 mb-1 text-lg font-bold text-white">اكتمال الدروس بالترتيب</h2>
      <p className="mb-4 text-xs text-slate-400">
        نسبة من أكمل كل درس من إجمالي المسجّلين ({data.enrolledCount}). الانخفاض الحاد بين درسين
        يعني أن الطلاب يتوقفون هناك.
      </p>

      {data.funnel.length === 0 ? (
        <p className="rounded-card border border-dashed border-white/15 bg-navy-900/40 p-8 text-center text-sm text-slate-400">
          لا توجد دروس في هذا الكورس بعد.
        </p>
      ) : (
        <ol className="space-y-2">
          {data.funnel.map((row, i) => (
            <li
              key={`${row.lessonTitle}-${i}`}
              className={`rounded-control border bg-navy-900/60 p-3 shadow-card ${
                i === cliffIndex ? "border-red-500/40" : "border-white/10"
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-white">
                  <span className="text-slate-500">{i + 1}.</span> {row.lessonTitle}
                  <span className="mr-2 text-[11px] text-slate-500">— {row.moduleTitle}</span>
                </p>
                <p className="shrink-0 text-xs text-slate-400">
                  {row.completed} ({row.pct}%)
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${i === cliffIndex ? "bg-red-400" : "bg-gold-400"}`}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
              {i === cliffIndex && cliffDrop > 0 && (
                <p className="mt-1.5 text-[11px] text-red-400">
                  أكبر انخفاض: {cliffDrop} طالب توقفوا قبل هذا الدرس
                </p>
              )}
            </li>
          ))}
        </ol>
      )}

      {data.quizzes.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 text-lg font-bold text-white">أداء الاختبارات</h2>
          <div className="overflow-x-auto rounded-card border border-white/10 bg-navy-900/60 shadow-card">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-4 py-3 font-semibold">الدرس</th>
                  <th className="px-4 py-3 font-semibold">محاولات</th>
                  <th className="px-4 py-3 font-semibold">متوسط الدرجة</th>
                  <th className="px-4 py-3 font-semibold">نسبة النجاح</th>
                </tr>
              </thead>
              <tbody>
                {data.quizzes.map((q, i) => (
                  <tr
                    key={`${q.lessonTitle}-${i}`}
                    className="border-b border-white/5 text-slate-200 last:border-0"
                  >
                    <td className="px-4 py-3">{q.lessonTitle}</td>
                    <td className="px-4 py-3 text-slate-400">{q.attempts}</td>
                    <td
                      className={`px-4 py-3 font-bold ${
                        q.avgScore < 50 ? "text-red-400" : "text-white"
                      }`}
                    >
                      {q.avgScore}%
                    </td>
                    <td
                      className={`px-4 py-3 ${
                        q.passRate < 50 ? "text-red-400" : "text-slate-300"
                      }`}
                    >
                      {q.passRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
