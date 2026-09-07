import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, TrendingUp, Award, CheckCircle2, PlayCircle, ClipboardCheck } from "lucide-react";

const GRADE_META = [
  { match: "الأول", bar: "from-gold-400 to-gold-500", tint: "bg-gold-400/10 text-gold-400", Icon: BookOpen },
  { match: "الثاني", bar: "from-blue-400 to-blue-500", tint: "bg-blue-400/10 text-blue-400", Icon: TrendingUp },
  { match: "الثالث", bar: "from-emerald-400 to-emerald-500", tint: "bg-emerald-400/10 text-emerald-400", Icon: Award },
] as const;

function gradeMeta(grade: string | null) {
  return (grade && GRADE_META.find((g) => grade.includes(g.match))) || GRADE_META[0];
}

export function CourseCard({
  course,
  meta,
  highlights,
  featured = false,
}: {
  course: {
    slug: string;
    title: string;
    description: string;
    grade: string | null;
    thumbnailUrl?: string | null;
    price: number;
  };
  meta?: { lessonCount: number; quizCount: number };
  highlights?: string[];
  featured?: boolean;
}) {
  const g = gradeMeta(course.grade);
  const isPaid = course.price > 0;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-card border bg-navy-900/60 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated ${
        featured ? "border-gold-400/40 shadow-glow-gold" : "border-white/10 hover:border-gold-400/40"
      }`}
    >
      <div className={`h-2 bg-gradient-to-l ${g.bar}`} />

      {course.thumbnailUrl ? (
        <div className="relative h-32 w-full overflow-hidden">
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-start justify-between">
          <span className={`flex h-11 w-11 items-center justify-center rounded-control ${g.tint}`}>
            <g.Icon size={22} />
          </span>
          {featured && (
            <span className="rounded-full bg-gold-400 px-2.5 py-1 text-[11px] font-bold text-navy-950">
              الأكثر طلبًا
            </span>
          )}
        </div>

        {course.grade && (
          <span className="mt-4 text-xs font-bold text-blue-400">{course.grade}</span>
        )}
        <h3 className="mt-1.5 text-lg font-bold text-white">{course.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{course.description}</p>

        {highlights && highlights.length > 0 && (
          <ul className="mt-4 space-y-2">
            {highlights.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={16} className="shrink-0 text-gold-400" />
                {point}
              </li>
            ))}
          </ul>
        )}

        {meta && (meta.lessonCount > 0 || meta.quizCount > 0) && (
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
            {meta.lessonCount > 0 && (
              <span className="flex items-center gap-1.5">
                <PlayCircle size={14} />
                {meta.lessonCount.toLocaleString("ar-EG")} درس
              </span>
            )}
            {meta.quizCount > 0 && (
              <span className="flex items-center gap-1.5">
                <ClipboardCheck size={14} />
                {meta.quizCount.toLocaleString("ar-EG")} اختبار
              </span>
            )}
          </div>
        )}

        {isPaid && (
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white">
              {course.price.toLocaleString("ar-EG")}
            </span>
            <span className="text-xs text-slate-400">ج.م — الكورس كامل</span>
          </div>
        )}
        {!isPaid && (
          <span className="mt-4 w-fit rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
            مجاني
          </span>
        )}

        <Link
          href={`/courses/${course.slug}`}
          className="mt-5 flex items-center justify-center gap-2 rounded-control bg-gold-400 py-3 font-bold text-navy-950 transition hover:bg-gold-300"
        >
          تفاصيل الكورس
          <ArrowLeft size={16} />
        </Link>
      </div>
    </div>
  );
}
