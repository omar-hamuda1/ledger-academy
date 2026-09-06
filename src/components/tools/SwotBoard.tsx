"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Target, ShieldAlert, Check } from "lucide-react";

const quadrants = [
  { key: "strengths", label: "نقاط القوة", icon: TrendingUp, color: "text-emerald-400", placeholder: "مثال: فريق عمل ذو خبرة" },
  { key: "weaknesses", label: "نقاط الضعف", icon: TrendingDown, color: "text-red-400", placeholder: "مثال: ميزانية تسويق محدودة" },
  { key: "opportunities", label: "الفرص", icon: Target, color: "text-blue-400", placeholder: "مثال: سوق جديد لم يُستغل بعد" },
  { key: "threats", label: "التهديدات", icon: ShieldAlert, color: "text-gold-400", placeholder: "مثال: منافس جديد قوي" },
] as const;

type QuadrantKey = (typeof quadrants)[number]["key"];
type SwotState = Record<QuadrantKey, string>;

const STORAGE_KEY = "ledger-academy-swot";

const emptyState: SwotState = {
  strengths: "",
  weaknesses: "",
  opportunities: "",
  threats: "",
};

export function SwotBoard() {
  const [values, setValues] = useState<SwotState>(emptyState);
  const [justSaved, setJustSaved] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setValues(JSON.parse(saved));
    } catch {
      // ignore malformed/missing local storage
    }
  }, []);

  function updateField(key: QuadrantKey, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setJustSaved(true);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setJustSaved(false), 1500);
    } catch {
      // storage may be unavailable (private mode); the in-memory value still works
    }
  }

  return (
    <div className="rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
      <h3 className="mb-1 font-bold text-white">أداة تحليل SWOT</h3>
      <p className="mb-5 text-sm text-slate-400">
        دوّن نقاط القوة والضعف والفرص والتهديدات لأي مشروع تدرسه.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {quadrants.map((quadrant) => (
          <div key={quadrant.key} className="rounded-xl border border-white/10 bg-navy-950/40 p-4">
            <div className="mb-2 flex items-center gap-2">
              <quadrant.icon size={16} className={quadrant.color} />
              <span className={`text-sm font-semibold ${quadrant.color}`}>{quadrant.label}</span>
            </div>
            <textarea
              value={values[quadrant.key]}
              onChange={(e) => updateField(quadrant.key, e.target.value)}
              placeholder={quadrant.placeholder}
              rows={4}
              className="w-full resize-none rounded-lg border border-white/10 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <p className="text-xs text-slate-400">يُحفظ تلقائيًا على هذا الجهاز.</p>
        {justSaved && (
          <span className="flex animate-fade-in items-center gap-1 text-xs font-semibold text-emerald-400">
            <Check size={13} />
            تم الحفظ
          </span>
        )}
      </div>
    </div>
  );
}
