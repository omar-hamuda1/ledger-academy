"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";

export function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState(10000);
  const [pricePerUnit, setPricePerUnit] = useState(50);
  const [variableCostPerUnit, setVariableCostPerUnit] = useState(30);

  const contributionMargin = pricePerUnit - variableCostPerUnit;
  const breakEvenUnits = useMemo(() => {
    if (contributionMargin <= 0) return null;
    return Math.ceil(fixedCosts / contributionMargin);
  }, [fixedCosts, contributionMargin]);

  const breakEvenRevenue = breakEvenUnits ? breakEvenUnits * pricePerUnit : null;

  return (
    <div className="rounded-card border border-white/10 bg-navy-900/60 p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-control bg-gold-400/10 text-gold-400">
          <Calculator size={20} />
        </span>
        <h3 className="font-bold text-white">حاسبة نقطة التعادل</h3>
      </div>
      <p className="mb-5 text-sm text-slate-400">
        احسب عدد الوحدات التي يجب بيعها لتغطية التكاليف بالكامل دون ربح أو خسارة.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm text-slate-300">
          التكاليف الثابتة
          <input
            type="number"
            value={fixedCosts}
            onChange={(e) => setFixedCosts(Number(e.target.value))}
            className="rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-white focus:border-gold-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-slate-300">
          سعر بيع الوحدة
          <input
            type="number"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(Number(e.target.value))}
            className="rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-white focus:border-gold-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-slate-300">
          التكلفة المتغيرة للوحدة
          <input
            type="number"
            value={variableCostPerUnit}
            onChange={(e) => setVariableCostPerUnit(Number(e.target.value))}
            className="rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-white focus:border-gold-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-control bg-navy-950/60 p-4">
          <p className="text-xs text-slate-400">نقطة التعادل (بالوحدات)</p>
          <p key={breakEvenUnits} className="mt-1 animate-pop text-2xl font-extrabold text-gold-400">
            {breakEvenUnits !== null ? breakEvenUnits.toLocaleString("ar-EG") : "—"}
          </p>
        </div>
        <div className="rounded-control bg-navy-950/60 p-4">
          <p className="text-xs text-slate-400">نقطة التعادل (بالإيرادات)</p>
          <p key={breakEvenRevenue} className="mt-1 animate-pop text-2xl font-extrabold text-gold-400">
            {breakEvenRevenue !== null ? breakEvenRevenue.toLocaleString("ar-EG") : "—"}
          </p>
        </div>
      </div>

      {contributionMargin <= 0 && (
        <p className="mt-4 text-sm text-red-400">
          يجب أن يكون سعر البيع أعلى من التكلفة المتغيرة للوصول إلى نقطة تعادل.
        </p>
      )}
    </div>
  );
}
