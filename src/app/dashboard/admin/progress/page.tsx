import { db } from "@/lib/db";
import { requireScopePage } from "@/lib/require-admin";
import {
  StudentProgressTable,
  type StudentProgressRow,
} from "@/components/admin/StudentProgressTable";

export const dynamic = "force-dynamic";

// Client-side sort/filter/paginate needs the full set in the browser. The
// student base is small today; this cap keeps a pathological future case from
// shipping a huge payload. If it's ever hit, move search/sort server-side.
const MAX_ROWS = 500;

export default async function AdminProgressPage() {
  await requireScopePage("progress");
  const students = await db.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { enrollments: true } },
      progress: { select: { completed: true, updatedAt: true } },
      quizAttempts: { select: { score: true, takenAt: true } },
    },
  });

  const rows: StudentProgressRow[] = students.map((student) => {
    const completedLessons = student.progress.filter((p) => p.completed).length;
    const quizzesPassed = student.quizAttempts.filter((a) => a.score >= 50).length;

    const activityDates = [
      ...student.progress.map((p) => p.updatedAt.getTime()),
      ...student.quizAttempts.map((a) => a.takenAt.getTime()),
    ];
    const lastActive = activityDates.length ? Math.max(...activityDates) : null;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      joinedAt: student.createdAt.getTime(),
      enrollments: student._count.enrollments,
      completedLessons,
      quizAttempts: student.quizAttempts.length,
      quizzesPassed,
      lastActive,
    };
  });

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">تقدم الطلاب</h1>
      <p className="mt-2 text-slate-400">
        ابحث ورتّب حسب أي عمود لمتابعة اشتراكات كل طالب ودروسه المكتملة ونتائج اختباراته.
      </p>

      <StudentProgressTable rows={rows} capped={rows.length >= MAX_ROWS} />
    </div>
  );
}
