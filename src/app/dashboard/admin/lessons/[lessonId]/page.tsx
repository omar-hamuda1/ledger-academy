import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight, FileText, HelpCircle } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLessonQA } from "@/lib/lesson-qa";
import { LessonQA } from "@/components/course/LessonQA";
import { EditLessonForm } from "@/components/admin/EditLessonForm";
import { AddResourceForm } from "@/components/admin/AddResourceForm";
import { DeleteResourceButton } from "@/components/admin/DeleteResourceButton";
import { CreateQuizButton } from "@/components/admin/CreateQuizButton";
import { AddQuestionForm } from "@/components/admin/AddQuestionForm";
import { QuizSettingsForm } from "@/components/admin/QuizSettingsForm";
import { BulkQuestionsUpload } from "@/components/admin/BulkQuestionsUpload";
import { DeleteQuestionButton } from "@/components/admin/DeleteQuestionButton";
import { DeleteQuizButton } from "@/components/admin/DeleteQuizButton";

export const dynamic = "force-dynamic";

type QuestionOption = { id: string; text: string };

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      resources: true,
      module: { include: { course: true } },
      quiz: { include: { questions: true } },
    },
  });
  if (!lesson) notFound();

  const [session, qaThreads] = await Promise.all([
    getServerSession(authOptions),
    getLessonQA(lessonId),
  ]);

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/dashboard/admin/lessons"
        className="mb-6 flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-gold-400"
      >
        <ArrowRight size={16} />
        العودة إلى إدارة الدروس
      </Link>

      <p className="mb-1 text-sm text-blue-400">
        {lesson.module.course.title} / {lesson.module.title}
      </p>
      <h1 className="mb-6 text-2xl font-extrabold text-white">تعديل الدرس</h1>

      <EditLessonForm
        lessonId={lesson.id}
        initialTitle={lesson.title}
        initialVideoUrl={lesson.videoUrl ?? ""}
        initialContentHtml={lesson.contentHtml ?? ""}
      />

      <div className="mt-6 rounded-2xl border border-white/10 bg-navy-900/60 p-6">
        <h2 className="mb-4 font-bold text-white">الملفات المرفقة</h2>

        {lesson.resources.length === 0 ? (
          <p className="text-sm text-slate-400">لا توجد ملفات مرفقة بعد.</p>
        ) : (
          <ul className="space-y-2">
            {lesson.resources.map((resource) => (
              <li
                key={resource.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-navy-950/40 px-3 py-2"
              >
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <FileText size={15} className="text-gold-400" />
                  {resource.label} ({resource.fileType})
                </span>
                <DeleteResourceButton resourceId={resource.id} />
              </li>
            ))}
          </ul>
        )}

        <AddResourceForm lessonId={lesson.id} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-navy-900/60 p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="font-bold text-white">الاختبار القصير</h2>
          {lesson.quiz && <DeleteQuizButton quizId={lesson.quiz.id} />}
        </div>

        {!lesson.quiz ? (
          <p className="text-sm text-slate-400">
            لا يوجد اختبار لهذا الدرس بعد. أنشئه بزر بالأسفل، أو ارفع ملف أسئلة مباشرة.
          </p>
        ) : lesson.quiz.questions.length === 0 ? (
          <p className="text-sm text-slate-400">لم تُضَف أي أسئلة بعد.</p>
        ) : (
          <ul className="space-y-3">
            {lesson.quiz.questions.map((question) => {
              const options = question.options as QuestionOption[];
              return (
                <li key={question.id} className="rounded-xl border border-white/10 bg-navy-950/40 p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="flex items-start gap-2 text-sm font-medium text-white">
                      <HelpCircle size={16} className="mt-0.5 shrink-0 text-gold-400" />
                      {question.text}
                    </span>
                    <DeleteQuestionButton questionId={question.id} />
                  </div>
                  <ul className="space-y-1 pr-6">
                    {options.map((option) => (
                      <li
                        key={option.id}
                        className={`text-sm ${
                          option.id === question.correctId
                            ? "font-semibold text-emerald-400"
                            : "text-slate-400"
                        }`}
                      >
                        {option.id === question.correctId ? "✓ " : "• "}
                        {option.text}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}

        {!lesson.quiz ? (
          <div className="mt-4">
            <CreateQuizButton lessonId={lesson.id} />
          </div>
        ) : (
          <AddQuestionForm quizId={lesson.quiz.id} />
        )}

        {lesson.quiz && (
          <QuizSettingsForm quizId={lesson.quiz.id} timeLimitSec={lesson.quiz.timeLimitSec} />
        )}

        <BulkQuestionsUpload lessonId={lesson.id} />
      </div>

      {session?.user?.id && (
        <LessonQA
          lessonId={lesson.id}
          currentUserId={session.user.id}
          isAdmin
          threads={qaThreads}
        />
      )}
    </div>
  );
}
