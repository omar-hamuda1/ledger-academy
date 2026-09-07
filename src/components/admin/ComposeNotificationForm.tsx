"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";

export function ComposeNotificationForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !title.trim() || !message.trim()) return;
    setLoading(true);

    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "تعذّر إرسال الإشعار.");
      return;
    }

    toast.success("تم إرسال الإشعار إلى جميع الطلاب.");
    setTitle("");
    setMessage("");
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
