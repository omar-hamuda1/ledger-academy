import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClipboardList, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentQuizzesPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const enrollments = userId
    ? await db.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              modules: {
                orderBy: { order: "asc" },
                include: {
                  lessons: {
                    orderBy: { order: "asc" },
                    include: { quiz: { include: { questions: true } } },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  const quizEntries = enrollments.flatMap((enrollment) =>
    enrollment.course.modules.flatMap((module) =>
      module.lessons
        .filter((lesson) => lesson.quiz && lesson.quiz.questions.length > 0)
        .map((lesson) => ({
          courseTitle: enrollment.course.title,
          courseSlug: enrollment.course.slug,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          quizId: lesson.quiz!.id,
          questionCount: lesson.quiz!.questions.length,
        }))
    )
  );

  const attempts = userId
    ? await db.quizAttempt.findMany({
        where: { userId, quizId: { in: quizEntries.map((q) => q.quizId) } },
      })
    : [];

  const bestScoreByQuiz = new Map<string, number>();
  for (const attempt of attempts) {
    const current = bestScoreByQuiz.get(attempt.quizId) ?? -1;
    if (attempt.score > current) bestScoreByQuiz.set(attempt.quizId, attempt.score);
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">اختباراتي</h1>
      <p className="mt-2 text-slate-400">
        تابع نتائج الاختبارات القصيرة بعد كل درس في كورساتك.
      </p>

      {quizEntries.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-navy-900/40 p-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400/10 text-gold-400">
            <ClipboardList size={22} />
          </span>
          <p className="font-semibold text-white">لا توجد اختبارات متاحة بعد</p>
          <p className="max-w-sm text-sm text-slate-400">
            ستظهر هنا اختبارات كل درس بمجرد أن يضيفها المحاضر، أو اشترك في كورس يحتوي على اختبارات.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {quizEntries.map((entry) => {
            const bestScore = bestScoreByQuiz.get(entry.quizId);
            return (
              <li
                key={entry.quizId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-navy-900/60 p-5"
              >
                <div>
                  <p className="text-xs text-blue-400">{entry.courseTitle}</p>
                  <h2 className="font-bold text-white">{entry.lessonTitle}</h2>
                  <p className="mt-1 text-sm text-slate-400">{entry.questionCount} أسئلة</p>
                </div>

                <div className="flex items-center gap-4">
                  {bestScore !== undefined && (
                    <span
                      className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                        bestScore >= 50
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      أفضل نتيجة: {bestScore}%
                    </span>
                  )}
                  <Link
                    href={`/dashboard/student/quizzes/${entry.quizId}`}
                    className="flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 text-sm font-bold text-navy-950 transition hover:bg-gold-300"
                  >
                    {bestScore !== undefined ? "إعادة المحاولة" : "بدء الاختبار"}
                    <ArrowLeft size={16} />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
