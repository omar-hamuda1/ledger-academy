import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ArrowRight } from "lucide-react";
import { QuizTakerForm } from "@/components/course/QuizTakerForm";

export const dynamic = "force-dynamic";

type QuestionOption = { id: string; text: string };

export default async function QuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: true,
      lesson: { include: { module: { include: { course: true } } } },
    },
  });
  if (!quiz) notFound();

  const course = quiz.lesson.module.course;
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });
  if (!enrollment) redirect(`/courses/${course.slug}`);

  const questions = quiz.questions.map((question) => ({
    id: question.id,
    text: question.text,
    options: question.options as QuestionOption[],
  }));

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/dashboard/student/quizzes"
        className="mb-6 flex w-fit items-center gap-2 text-sm text-slate-400 hover:text-gold-400"
      >
        <ArrowRight size={16} />
        العودة إلى اختباراتي
      </Link>

      <p className="mb-1 text-sm text-blue-400">{course.title}</p>
      <h1 className="mb-6 text-2xl font-extrabold text-white">
        اختبار: {quiz.lesson.title}
      </h1>

      <QuizTakerForm quizId={quiz.id} questions={questions} timeLimitSec={quiz.timeLimitSec} />
    </div>
  );
}
