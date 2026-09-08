"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { CheckCircle2, XCircle, RotateCcw, Timer } from "lucide-react";

type Option = { id: string; text: string };
type Question = { id: string; text: string; options: Option[] };
type QuestionResult = { questionId: string; selectedId: string | null; correctId: string; isCorrect: boolean };

function mmss(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function QuizTakerForm({
  quizId,
  questions,
  timeLimitSec,
}: {
  quizId: string;
  questions: Question[];
  timeLimitSec?: number | null;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(timeLimitSec ?? null);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    total: number;
    results: QuestionResult[];
  } | null>(null);

  const deadlineRef = useRef<number | null>(
    timeLimitSec ? Date.now() + timeLimitSec * 1000 : null,
  );
  // Kept fresh each render so the interval always calls the latest closure.
  const autoSubmitRef = useRef<() => void>(() => {});

  function selectAnswer(questionId: string, optionId: string) {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  async function submitAnswers(auto = false) {
    if (loading || result) return;
    setError(null);
    setLoading(true);
    if (auto) setTimedOut(true);

    const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("تعذّر إرسال الاختبار.");
      if (auto) setTimedOut(false);
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
    setError(null);
    setTimedOut(false);
    if (timeLimitSec) {
      deadlineRef.current = Date.now() + timeLimitSec * 1000;
      setRemaining(timeLimitSec);
    }
  }

  autoSubmitRef.current = () => {
    void submitAnswers(true);
  };

  // Countdown for a timed quiz: tick every second, auto-submit at zero.
  useEffect(() => {
    if (deadlineRef.current == null || result) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((deadlineRef.current! - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        autoSubmitRef.current();
      }
    }, 1000);
    return () => clearInterval(id);
    // re-arm after a retry (new deadline) — result flips to null then
  }, [result]);

  const resultByQuestion = new Map(result?.results.map((r) => [r.questionId, r]));
  const showTimer = remaining != null && !result;
  const lowTime = remaining != null && remaining <= 60;

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

      {showTimer && (
        <div
          className={`mb-4 flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold tabular-nums ${
            lowTime
              ? "border-red-500/40 bg-red-500/10 text-red-400"
              : "border-white/10 bg-navy-900/60 text-slate-200"
          }`}
          role="timer"
          aria-live={lowTime ? "assertive" : "off"}
        >
          <Timer size={16} />
          الوقت المتبقّي: {mmss(remaining!)}
        </div>
      )}

      {timedOut && !result && (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-300">
          انتهى الوقت — يتم إرسال إجاباتك تلقائيًا…
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submitAnswers();
        }}
        className="space-y-4"
      >
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
                        disabled={!!result || loading || timedOut}
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
            disabled={loading || timedOut}
            className="w-full rounded-lg bg-gold-400 py-3 font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
          >
            {loading || timedOut ? "جارٍ التصحيح..." : "إرسال الإجابات"}
          </button>
        )}
      </form>
    </div>
  );
}
