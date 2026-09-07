import Link from "next/link";
import type { Course, Module, Lesson } from "@prisma/client";
import { CheckCircle2, Circle, PlayCircle, ListTree } from "lucide-react";

type CourseWithModules = Course & {
  modules: (Module & { lessons: Lesson[] })[];
};

type NavProps = {
  course: CourseWithModules;
  activeLessonId: string;
  completedLessonIds: Set<string>;
};

function NavTree({ course, activeLessonId, completedLessonIds }: NavProps) {
  return (
    <>
      {course.modules.map((module) => (
        <div key={module.id} className="mb-4">
          <p className="mb-1 text-sm font-semibold text-slate-400">{module.title}</p>
          <ul className="space-y-1">
            {module.lessons.map((lesson) => {
              const isActive = lesson.id === activeLessonId;
              const isCompleted = completedLessonIds.has(lesson.id);
              return (
                <li key={lesson.id}>
                  <Link
                    href={`/dashboard/student/courses/${course.slug}/${lesson.id}`}
                    className={`flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
                      isActive
                        ? "bg-gold-400/10 font-medium text-gold-400"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                    ) : isActive ? (
                      <PlayCircle size={16} className="shrink-0" />
                    ) : (
                      <Circle size={16} className="shrink-0 text-slate-600" />
                    )}
                    {lesson.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

/** Desktop: a persistent column. Hidden below `lg` — see `MobileLessonNav`. */
export function LessonSidebar(props: NavProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-l border-white/10 bg-navy-900/40 p-4 lg:block">
      <h2 className="mb-4 font-bold text-white">{props.course.title}</h2>
      <NavTree {...props} />
    </aside>
  );
}

/** Mobile: a collapsible disclosure above the lesson content. */
export function MobileLessonNav(props: NavProps) {
  return (
    <details className="mb-4 rounded-card border border-white/10 bg-navy-900/40 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-bold text-white [&::-webkit-details-marker]:hidden">
        <ListTree size={16} className="text-gold-400" />
        دروس الكورس
      </summary>
      <div className="border-t border-white/10 p-4">
        <NavTree {...props} />
      </div>
    </details>
  );
}
