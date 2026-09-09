"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlayCircle, ClipboardCheck, ArrowLeft, BookOpen, TrendingUp, Award } from "lucide-react";

export type AvailableCourse = {
  id: string;
  slug: string;
  title: string;
  description: string;
  grade: string | null;
  thumbnailUrl: string | null;
  price: number;
  lessonCount: number;
  quizCount: number;
  pendingOrder: boolean;
};

const GRADE_META = [
  { match: "الأول", bar: "from-gold-400 to-gold-500", tint: "bg-gold-400/10 text-gold-400", Icon: BookOpen },
  { match: "الثاني", bar: "from-blue-400 to-blue-500", tint: "bg-blue-400/10 text-blue-400", Icon: TrendingUp },
  { match: "الثالث", bar: "from-emerald-400 to-emerald-500", tint: "bg-emerald-400/10 text-emerald-400", Icon: Award },
] as const;

function gradeMeta(grade: string | null) {
  return (grade && GRADE_META.find((g) => grade.includes(g.match))) || GRADE_META[0];
}

export function AvailableCourseCard({ course }: { course: AvailableCourse }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const g = gradeMeta(course.grade);
  const isPaid = course.price > 0;

  async function enrollFree() {
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      if (res.ok) {
        toast.success(`تم تسجيلك في «${course.title}» 🎉`);
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "تعذّر التسجيل في الكورس.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-card border border-white/10 bg-navy-900/60 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold-400/40 hover:shadow-elevated">
      <div className={`h-1.5 bg-gradient-to-l ${g.bar}`} />

      {course.thumbnailUrl && (
        <div className="relative h-28 w-full overflow-hidden">
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <span className={`flex h-10 w-10 items-center justify-center rounded-control ${g.tint}`}>
          <g.Icon size={20} />
        </span>

        {course.grade && <span className="mt-3 text-xs font-bold text-blue-400">{course.grade}</span>}
        <h3 className="mt-1 font-bold text-white">{course.title}</h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-400">
          {course.description}
        </p>

        {(course.lessonCount > 0 || course.quizCount > 0) && (
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
            {course.lessonCount > 0 && (
              <span className="flex items-center gap-1.5">
                <PlayCircle size={14} />
                {course.lessonCount.toLocaleString("ar-EG")} درس
              </span>
            )}
            {course.quizCount > 0 && (
              <span className="flex items-center gap-1.5">
                <ClipboardCheck size={14} />
                {course.quizCount.toLocaleString("ar-EG")} اختبار
              </span>
            )}
          </div>
        )}

        <div className="mt-3">
          {isPaid ? (
            <span className="text-lg font-extrabold text-white">
              {course.price.toLocaleString("ar-EG")}{" "}
              <span className="text-xs font-normal text-slate-400">ج.م</span>
            </span>
          ) : (
            <span className="w-fit rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-400">
              مجاني
            </span>
          )}
        </div>

        {course.pendingOrder ? (
          <span className="mt-4 rounded-control bg-gold-400/10 px-3 py-2.5 text-center text-sm font-bold text-gold-400">
            طلبك قيد المراجعة
          </span>
        ) : isPaid ? (
          <Link
            href={`/courses/${course.slug}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-control bg-gold-400 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300"
          >
            اطلب الوصول
            <ArrowLeft size={15} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={enrollFree}
            disabled={busy}
            className="mt-4 rounded-control bg-gold-400 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            {busy ? "جارٍ التسجيل..." : "التحاق مجاني"}
          </button>
        )}
      </div>
    </div>
  );
}
