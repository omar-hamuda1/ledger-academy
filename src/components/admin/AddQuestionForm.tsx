"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

export function AddQuestionForm({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setCorrectIndex((prev) => (prev === index ? 0 : prev > index ? prev - 1 : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (options.some((o) => !o.trim())) {
      setError("لا يمكن ترك أي خيار فارغًا.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/quizzes/${quizId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        options: options.map((o, i) => ({ id: `opt-${i}`, text: o })),
        correctId: `opt-${correctIndex}`,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      setError("تعذّرت إضافة السؤال.");
      return;
    }

    setText("");
    setOptions(["", ""]);
    setCorrectIndex(0);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-xl border border-white/10 bg-navy-950/40 p-4">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
        placeholder="نص السؤال"
        className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
      />

      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={correctIndex === index}
              onChange={() => setCorrectIndex(index)}
              className="h-4 w-4 accent-gold-400"
            />
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`الخيار ${index + 1}`}
              className="flex-1 rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none"
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                aria-label="حذف الخيار"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= 6}
          className="flex items-center gap-1 text-sm text-gold-400 hover:underline disabled:opacity-50"
        >
          <Plus size={14} />
          إضافة خيار
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
        >
          {loading ? "جارٍ الإضافة..." : "إضافة السؤال"}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-slate-400">حدد الدائرة بجانب الإجابة الصحيحة.</p>
    </form>
  );
}
