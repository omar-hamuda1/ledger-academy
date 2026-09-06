"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlayCircle, CreditCard } from "lucide-react";
import { formatEgp } from "@/lib/format";

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

    if (data.url) {
      window.location.href = data.url;
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
        {price > 0 ? <CreditCard size={18} /> : null}
        {loading
          ? "جارٍ التحميل..."
          : price > 0
          ? `الاشتراك مقابل ${formatEgp(price)}`
          : "التسجيل في الكورس"}
        {price <= 0 && <ArrowLeft size={18} />}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
