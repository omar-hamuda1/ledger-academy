import { db } from "@/lib/db";

export type QAAnswer = {
  id: string;
  body: string;
  authorName: string;
  byInstructor: boolean;
  createdAt: number;
  authorId: string;
};

export type QAThread = {
  id: string;
  body: string;
  authorName: string;
  createdAt: number;
  authorId: string;
  answers: QAAnswer[];
};

/** Every question for a lesson (newest first) with its answers (oldest first). */
export async function getLessonQA(lessonId: string): Promise<QAThread[]> {
  const rows = await db.lessonQuestion.findMany({
    where: { lessonId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true } },
      answers: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });

  const first = (name: string) => name.split(/\s+/)[0] || name;

  return rows.map((q) => ({
    id: q.id,
    body: q.body,
    authorName: first(q.user.name),
    authorId: q.user.id,
    createdAt: q.createdAt.getTime(),
    answers: q.answers.map((a) => ({
      id: a.id,
      body: a.body,
      authorName: a.byInstructor ? "المحاضر" : first(a.user.name),
      byInstructor: a.byInstructor,
      authorId: a.user.id,
      createdAt: a.createdAt.getTime(),
    })),
  }));
}

/**
 * The lesson's course id + whether `userId` may participate in its Q&A
 * (enrolled student, or an admin). Returns null if the lesson doesn't exist.
 */
export async function lessonQAAccess(
  lessonId: string,
  userId: string,
  isAdmin: boolean,
): Promise<{ courseId: string; courseSlug: string; allowed: boolean; lessonTitle: string } | null> {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { title: true, module: { select: { course: { select: { id: true, slug: true } } } } },
  });
  if (!lesson) return null;
  const { id: courseId, slug: courseSlug } = lesson.module.course;
  const base = { courseId, courseSlug, lessonTitle: lesson.title };
  if (isAdmin) return { ...base, allowed: true };

  const enrolled = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return { ...base, allowed: !!enrolled };
}
