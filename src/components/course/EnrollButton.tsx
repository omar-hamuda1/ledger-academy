"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlayCircle, KeyRound } from "lucide-react";

export function EnrollButton({
  courseId,
  isEnrolled,
  firstLessonHref,
  price,
}: {
  courseId: string;
  isEnrolled: boolean;
  firstLessonHref: string | null;
  price: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(isEnrolled);
  const [error, setError] = useState<string | null>(null);

  if (status === "unauthenticated") {
    return (
      <Link
        href="/login"
        className="flex w-fit items-center gap-2 rounded-lg bg-gold-400 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-300"
      >
        سجّل الدخول للاشتراك في الكورس
      </Link>
    );
  }

  if (enrolled) {
    return (
      <Link
        href={firstLessonHref ?? "#"}
        className="flex w-fit items-center gap-2 rounded-lg bg-gold-400 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-300"
      >
        <PlayCircle size={18} />
        متابعة التعلم
      </Link>
    );
  }

  // Paid course, not enrolled: access comes from a prepaid code or an
  // approved code request — both live in the section directly below this
  // button on the course page. No online card payment.
  if (price > 0) {
    return (
      <div className="flex w-fit items-center gap-2 rounded-lg border border-gold-400/30 bg-gold-400/10 px-5 py-3 text-sm font-semibold text-gold-400">
        <KeyRound size={16} />
        كورس مدفوع — فعّل كودك أو اطلب كودًا بالأسفل
      </div>
    );
  }

  async function handleEnroll() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "حدث خطأ ما، حاول مرة أخرى.");
      return;
    }

    setLoading(false);
    setEnrolled(true);
    if (firstLessonHref) router.push(firstLessonHref);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleEnroll}
        disabled={loading || status === "loading"}
        className="flex w-fit items-center gap-2 rounded-lg bg-gold-400 px-6 py-3 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        {loading ? "جارٍ التحميل..." : "التسجيل في الكورس"}
        {!loading && <ArrowLeft size={18} />}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
