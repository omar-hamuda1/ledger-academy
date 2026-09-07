import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, TrendingUp, Award, CheckCircle2 } from "lucide-react";

const GRADE_ICON = [
  { match: "الأول", icon: BookOpen },
  { match: "الثاني", icon: TrendingUp },
  { match: "الثالث", icon: Award },
] as const;

function GradeIcon({ grade }: { grade: string | null }) {
  const Icon =
    (grade && GRADE_ICON.find((g) => grade.includes(g.match))?.icon) || BookOpen;
  return <Icon size={24} />;
}

export function CourseCard({
  course,
  highlights,
}: {
  course: { slug: string; title: string; description: string; grade: string | null; thumbnailUrl?: string | null };
  highlights?: string[];
}) {
  return (
    <div className="flex flex-col rounded-card border border-white/10 bg-navy-900/60 p-8 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-elevated">
      {course.thumbnailUrl ? (
        <div className="relative mb-4 h-32 w-full overflow-hidden rounded-control">
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
          <GradeIcon grade={course.grade} />
        </span>
      )}

      {course.grade && (
        <span className="mb-2 text-xs font-bold text-blue-400">{course.grade}</span>
      )}
      <h3 className="mb-3 text-xl font-bold text-white">{course.title}</h3>
      <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-400">{course.description}</p>

      {highlights && highlights.length > 0 && (
        <ul className="mb-6 space-y-2">
          {highlights.map((point) => (
            <li key={point} className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 size={16} className="shrink-0 text-gold-400" />
              {point}
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/courses/${course.slug}`}
        className="flex items-center justify-center gap-2 rounded-control border border-white/15 py-3 font-bold text-white transition hover:bg-gold-400 hover:text-navy-950"
      >
        تفاصيل الكورس
        <ArrowLeft size={16} />
      </Link>
    </div>
  );
}
