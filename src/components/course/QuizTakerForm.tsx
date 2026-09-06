"use client";

import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";

type Option = { id: string; text: string };
type Question = { id: string; text: string; options: Option[] };
type QuestionResult = { questionId: string; selectedId: string | null; correctId: string; isCorrect: boolean };

export function QuizTakerForm({ quizId, questions }: { quizId: string; questions: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    total: number;
    results: QuestionResult[];
  } | null>(null);

  function selectAnswer(questionId: string, optionId: string) {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("تعذّر إرسال الاختبار.");
      return;
    }

    const data = await res.json();
    setResult({
      score: data.score,
      correctCount: data.correctCount,
      total: data.total,
      results: data.results,
    });

    if (data.score >= 50) {
      toast.success("أحسنت! لقد نجحت في الاختبار 🎉");
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#fbbf24", "#fcd34d", "#34d399"],
      });
    } else {
      toast.info("لم تحقق درجة النجاح هذه المرة، حاول مرة أخرى.");
    }
  }

  function handleRetry() {
    setResult(null);
    setAnswers({});
  }

  const resultByQuestion = new Map(result?.results.map((r) => [r.questionId, r]));

  return (
    <div>
      {result && (
        <div
          className={`mb-6 animate-scale-in rounded-2xl border p-6 text-center ${
            result.score >= 50
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/10"
          }`}
        >
          <p className={`text-3xl font-extrabold ${result.score >= 50 ? "text-emerald-400" : "text-red-400"}`}>
            {result.score}%
          </p>
          <p className="mt-1 text-sm text-slate-300">
            أجبت بشكل صحيح على {result.correctCount} من {result.total} أسئلة
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mx-auto mt-4 flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-bold text-white transition hover:border-gold-400/40 hover:text-gold-400"
          >
            <RotateCcw size={16} />
            إعادة المحاولة
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {questions.map((question, index) => {
          const questionResult = resultByQuestion.get(question.id);
          return (
            <div
              key={question.id}
              className="animate-slide-up rounded-2xl border border-white/10 bg-navy-900/60 p-5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <p className="mb-3 font-semibold text-white">
                {index + 1}. {question.text}
              </p>
              <div className="space-y-2">
                {question.options.map((option) => {
                  const isSelected = answers[question.id] === option.id;
                  let stateClasses = "border-white/15 text-slate-300 hover:border-white/30";

                  if (questionResult) {
                    if (option.id === questionResult.correctId) {
                      stateClasses = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400";
                    } else if (option.id === questionResult.selectedId) {
                      stateClasses = "border-red-500/40 bg-red-500/10 text-red-400";
                    }
                  } else if (isSelected) {
                    stateClasses = "border-gold-400/50 bg-gold-400/10 text-gold-400";
                  }

                  return (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${stateClasses}`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={isSelected}
                        onChange={() => selectAnswer(question.id, option.id)}
                        disabled={!!result}
                        className="h-4 w-4 accent-gold-400"
                      />
                      {option.text}
                      {questionResult && option.id === questionResult.correctId && (
                        <CheckCircle2 size={15} className="mr-auto text-emerald-400" />
                      )}
                      {questionResult &&
                        option.id === questionResult.selectedId &&
                        !questionResult.isCorrect && <XCircle size={15} className="mr-auto text-red-400" />}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!result && (
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gold-400 py-3 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            {loading ? "جارٍ التصحيح..." : "إرسال الإجابات"}
          </button>
        )}
      </form>
    </div>
  );
}
