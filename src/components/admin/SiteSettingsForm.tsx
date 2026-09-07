"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

export function SiteSettingsForm({
  initialStudentsCount,
  initialSatisfactionRate,
  initialContactEmail,
  initialContactPhone,
  initialShowBreakEvenTool,
  initialShowSwotTool,
  initialAnnouncement,
  initialAnnouncementActive,
  initialPaymentInstructions,
}: {
  initialStudentsCount: number;
  initialSatisfactionRate: number;
  initialContactEmail: string;
  initialContactPhone: string;
  initialShowBreakEvenTool: boolean;
  initialShowSwotTool: boolean;
  initialAnnouncement: string;
  initialAnnouncementActive: boolean;
  initialPaymentInstructions: string;
}) {
  const router = useRouter();
  // Kept in the payload for schema compatibility, but no longer shown anywhere
  // — the homepage stats are computed from real data now, not these.
  const [studentsCount] = useState(initialStudentsCount);
  const [satisfactionRate] = useState(initialSatisfactionRate);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [contactPhone, setContactPhone] = useState(initialContactPhone);
  const [showBreakEvenTool, setShowBreakEvenTool] = useState(initialShowBreakEvenTool);
  const [showSwotTool, setShowSwotTool] = useState(initialShowSwotTool);
  const [announcement, setAnnouncement] = useState(initialAnnouncement);
  const [announcementActive, setAnnouncementActive] = useState(initialAnnouncementActive);
  const [paymentInstructions, setPaymentInstructions] = useState(initialPaymentInstructions);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setError(null);

    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentsCount,
        satisfactionRate,
        contactEmail,
        contactPhone,
        showBreakEvenTool,
        showSwotTool,
        announcement,
        announcementActive,
        paymentInstructions,
      }),
    });
    const data = await res.json().catch(() => ({}));

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "تعذّر حفظ الإعدادات.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="animate-slide-up space-y-6 rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">بيانات التواصل</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">البريد الإلكتروني</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              dir="ltr"
              className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-left text-white focus:border-gold-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">رقم الهاتف</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              dir="ltr"
              className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-left text-white focus:border-gold-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">الأدوات التفاعلية للطلاب</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showBreakEvenTool}
              onChange={(e) => setShowBreakEvenTool(e.target.checked)}
              className="h-4 w-4 accent-gold-400"
            />
            إظهار حاسبة نقطة التعادل للطلاب
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={showSwotTool}
              onChange={(e) => setShowSwotTool(e.target.checked)}
              className="h-4 w-4 accent-gold-400"
            />
            إظهار لوحة تحليل SWOT للطلاب
          </label>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          إعلان للطلاب
        </h3>
        <p className="mb-3 text-xs text-slate-400">
          يظهر هذا النص كشريط في أعلى لوحة تحكم الطالب. كل طالب يمكنه إخفاؤه، وسيظهر
          من جديد تلقائيًا عند تغيير نص الإعلان.
        </p>
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value.slice(0, 500))}
          rows={3}
          placeholder="مثال: حصة مباشرة يوم الخميس الساعة 7 مساءً — لا تنسَ الحضور."
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={announcementActive}
              onChange={(e) => setAnnouncementActive(e.target.checked)}
              className="h-4 w-4 accent-gold-400"
            />
            تفعيل عرض الإعلان
          </label>
          <span className="text-xs text-slate-400">{announcement.length} / 500</span>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">
          تعليمات الدفع
        </h3>
        <p className="mb-3 text-xs text-slate-400">
          تظهر للطالب في نموذج «اطلب كودًا للكورس». اكتب رقم فودافون كاش / انستاباي
          الذي يحوّل إليه الطالب، وأي تفاصيل أخرى.
        </p>
        <textarea
          value={paymentInstructions}
          onChange={(e) => setPaymentInstructions(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="مثال: حوّل قيمة الكورس عبر فودافون كاش إلى 010xxxxxxxx، ثم أرسل رقم العملية في الطلب."
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white focus:border-gold-400 focus:outline-none"
        />
        <span className="mt-1 block text-left text-xs text-slate-400">
          {paymentInstructions.length} / 1000
        </span>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        <Save size={18} />
        {loading ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
