"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";

type Audience = "CURRENT_STUDENTS" | "ALL_STUDENTS";

const AUDIENCE_OPTIONS: { value: Audience; label: string; hint: string }[] = [
  {
    value: "CURRENT_STUDENTS",
    label: "الطلاب الحاليون فقط",
    hint: "لن يظهر لمن ينضم إلى المنصة بعد الآن",
  },
  {
    value: "ALL_STUDENTS",
    label: "كل الطلاب، حتى من ينضم لاحقًا",
    hint: "مناسب للإرشادات الدائمة التي يجب أن يراها كل طالب جديد",
  },
];

export function ComposeNotificationForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<Audience>("CURRENT_STUDENTS");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !title.trim() || !message.trim()) return;
    setLoading(true);

    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, audience }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "تعذّر إرسال الإشعار.");
      return;
    }

    toast.success(
      audience === "ALL_STUDENTS"
        ? "تم إرسال الإشعار لكل الطلاب، بمن فيهم من ينضم لاحقًا."
        : "تم إرسال الإشعار للطلاب الحاليين.",
    );
    setTitle("");
    setMessage("");
    setAudience("CURRENT_STUDENTS");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card"
    >
      <div className="flex items-center gap-2 font-bold text-white">
        <Send size={18} className="text-gold-400" />
        إشعار جديد لجميع الطلاب
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-slate-300">العنوان</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          placeholder="مثال: موعد الاختبار الشهري"
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm text-slate-300">نص الرسالة</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
          rows={4}
          placeholder="اكتب تفاصيل الإشعار الذي سيظهر لكل طالب في جرس الإشعارات."
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
        />
        <span className="mt-1 block text-left text-xs text-slate-400">
          {message.length} / 2000
        </span>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm text-slate-300">من يرى هذا الإشعار؟</legend>
        {AUDIENCE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition ${
              audience === opt.value
                ? "border-gold-400/60 bg-gold-400/5"
                : "border-white/15 hover:border-white/25"
            }`}
          >
            <input
              type="radio"
              name="audience"
              value={opt.value}
              checked={audience === opt.value}
              onChange={() => setAudience(opt.value)}
              className="mt-0.5 accent-gold-400"
            />
            <span>
              <span className="block text-sm font-medium text-white">{opt.label}</span>
              <span className="block text-xs text-slate-400">{opt.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={loading || !title.trim() || !message.trim()}
        className="flex items-center gap-2 rounded-lg bg-gold-400 px-5 py-2.5 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
      >
        <Send size={16} />
        {loading ? "جارٍ الإرسال..." : "إرسال الإشعار"}
      </button>
    </form>
  );
}
