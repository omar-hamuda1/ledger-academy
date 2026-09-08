"use client";

import { useId, useMemo, useState } from "react";
import { Calculator } from "lucide-react";

/** Parse a raw input string to a non-negative number; empty/invalid -> 0. */
function toAmount(raw: string) {
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm text-slate-300">
      {label}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        className="rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
    </label>
  );
}

export function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState("10000");
  const [pricePerUnit, setPricePerUnit] = useState("50");
  const [variableCostPerUnit, setVariableCostPerUnit] = useState("30");

  const fixed = toAmount(fixedCosts);
  const price = toAmount(pricePerUnit);
  const variable = toAmount(variableCostPerUnit);

  const contributionMargin = price - variable;
  const breakEvenUnits = useMemo(() => {
    if (contributionMargin <= 0) return null;
    return Math.ceil(fixed / contributionMargin);
  }, [fixed, contributionMargin]);

  const breakEvenRevenue = breakEvenUnits ? breakEvenUnits * price : null;

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
        <NumberField label="التكاليف الثابتة" value={fixedCosts} onChange={setFixedCosts} />
        <NumberField label="سعر بيع الوحدة" value={pricePerUnit} onChange={setPricePerUnit} />
        <NumberField
          label="التكلفة المتغيرة للوحدة"
          value={variableCostPerUnit}
          onChange={setVariableCostPerUnit}
        />
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
