import Link from "next/link";
import { BookOpen, Pencil, PlayCircle } from "lucide-react";
import { db } from "@/lib/db";
import { AddLessonForm } from "@/components/admin/AddLessonForm";
import { DeleteLessonButton } from "@/components/admin/DeleteLessonButton";
import { AddModuleForm } from "@/components/admin/AddModuleForm";
import { DeleteModuleButton } from "@/components/admin/DeleteModuleButton";
import { ReorderButtons } from "@/components/admin/ReorderButtons";

export const dynamic = "force-dynamic";

export default async function AdminLessonsPage() {
  const courses = await db.course.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });

  return (
    <div className="animate-fade-in p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-white">إدارة الدروس</h1>
      <p className="mt-2 text-slate-400">
        أضف وحدات ودروسًا جديدة أو احذفها داخل كورسات إدارة الأعمال.
      </p>

      <div className="mt-8 space-y-8">
        {courses.map((course) => (
          <div key={course.id} className="rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
            <h2 className="mb-4 text-lg font-bold text-white">{course.title}</h2>

            <div className="space-y-6">
              {course.modules.map((module, mi) => (
                <div key={module.id} className="rounded-control border border-white/10 bg-navy-950/40 p-5">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ReorderButtons
                        kind="modules"
                        id={module.id}
                        isFirst={mi === 0}
                        isLast={mi === course.modules.length - 1}
                      />
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/10 text-gold-400">
                        <BookOpen size={16} />
                      </span>
                      <h3 className="font-semibold text-white">{module.title}</h3>
                    </div>
                    <DeleteModuleButton moduleId={module.id} />
                  </div>

                  <ul className="space-y-1">
                    {module.lessons.map((lesson, li) => (
                      <li
                        key={lesson.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-white/5"
                      >
                        <span className="flex items-center gap-2 text-sm text-slate-200">
                          <ReorderButtons
                            kind="lessons"
                            id={lesson.id}
                            isFirst={li === 0}
                            isLast={li === module.lessons.length - 1}
                          />
                          <PlayCircle size={15} className="shrink-0 text-slate-400" />
                          {lesson.title}
                        </span>
                        <span className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/admin/lessons/${lesson.id}`}
                            aria-label="تعديل الدرس"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-gold-400"
                          >
                            <Pencil size={15} />
                          </Link>
                          <DeleteLessonButton lessonId={lesson.id} />
                        </span>
                      </li>
                    ))}
                  </ul>

                  <AddLessonForm moduleId={module.id} />
                </div>
              ))}

              <div className="rounded-control border border-dashed border-white/15 p-4">
                <AddModuleForm courseId={course.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
