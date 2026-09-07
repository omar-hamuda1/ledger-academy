// Lesson / quiz / module counts for a course, derived from a loaded
// `modules -> lessons -> quiz` tree. Used by the marketing pages and the
// course card so the shape only has to be selected once at each call site.

type LoadedModules = {
  lessons: { quiz?: { id: string } | null; durationSec?: number | null }[];
}[];

export type CourseMeta = {
  moduleCount: number;
  lessonCount: number;
  quizCount: number;
  /** Total lesson duration in seconds, 0 when none of the lessons have one. */
  durationSec: number;
};

export function courseMeta(modules: LoadedModules): CourseMeta {
  const lessons = modules.flatMap((m) => m.lessons);
  return {
    moduleCount: modules.length,
    lessonCount: lessons.length,
    quizCount: lessons.filter((l) => l.quiz).length,
    durationSec: lessons.reduce((sum, l) => sum + (l.durationSec ?? 0), 0),
  };
}

/** "٥ س ٢٠ د" / "٤٢ د" — empty string when total is 0. */
export function formatDuration(totalSec: number): string {
  if (totalSec <= 0) return "";
  const mins = Math.round(totalSec / 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h.toLocaleString("ar-EG")} س`);
  if (m > 0) parts.push(`${m.toLocaleString("ar-EG")} د`);
  return parts.join(" ");
}
