"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessagesSquare, Trash2, CornerDownLeft } from "lucide-react";
import type { QAThread } from "@/lib/lesson-qa";

const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" });

export function LessonQA({
  lessonId,
  currentUserId,
  isAdmin,
  threads,
}: {
  lessonId: string;
  currentUserId: string;
  isAdmin: boolean;
  threads: QAThread[];
}) {
  const router = useRouter();
  const [ask, setAsk] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  async function send(url: string, method: string, body?: unknown) {
    setBusy(true);
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "تعذّرت العملية.");
      return false;
    }
    router.refresh();
    return true;
  }

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (ask.trim().length < 3) return;
    if (await send(`/api/lessons/${lessonId}/questions`, "POST", { body: ask.trim() })) {
      setAsk("");
      toast.success("تم إرسال سؤالك.");
    }
  }

  async function submitReply(questionId: string) {
    if (reply.trim().length < 1) return;
    if (
      await send(`/api/lesson-questions/${questionId}/answers`, "POST", { body: reply.trim() })
    ) {
      setReply("");
      setReplyTo(null);
    }
  }

  const canDelete = (authorId: string) => isAdmin || authorId === currentUserId;

  return (
    <section className="mt-10 border-t border-white/10 pt-8">
      <div className="mb-4 flex items-center gap-2">
        <MessagesSquare size={18} className="text-gold-400" />
        <h2 className="text-lg font-bold text-white">الأسئلة والنقاش</h2>
        <span className="text-sm text-slate-400">
          ({threads.length.toLocaleString("ar-EG")})
        </span>
      </div>

      <form onSubmit={submitQuestion} className="mb-6">
        <textarea
          value={ask}
          onChange={(e) => setAsk(e.target.value.slice(0, 2000))}
          rows={3}
          placeholder="عندك سؤال حول هذا الدرس؟ اكتبه هنا وسيرد عليك المحاضر."
          className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || ask.trim().length < 3}
          className="mt-2 rounded-lg bg-gold-400 px-5 py-2 text-sm font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
        >
          إرسال السؤال
        </button>
      </form>

      {threads.length === 0 ? (
        <p className="text-sm text-slate-400">لا توجد أسئلة على هذا الدرس بعد. كن أول من يسأل.</p>
      ) : (
        <ul className="space-y-4">
          {threads.map((q) => (
            <li key={q.id} className="rounded-card border border-white/10 bg-navy-900/60 p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{q.authorName}</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-200">
                    {q.body}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">{dateFmt.format(q.createdAt)}</p>
                </div>
                {canDelete(q.authorId) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      confirm("حذف هذا السؤال وكل الردود عليه؟") &&
                      send(`/api/lesson-questions/${q.id}`, "DELETE")
                    }
                    aria-label="حذف السؤال"
                    className="shrink-0 text-slate-500 transition hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              {q.answers.length > 0 && (
                <ul className="mt-3 space-y-2 border-r-2 border-white/10 pr-3">
                  {q.answers.map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold ${
                            a.byInstructor ? "text-gold-400" : "text-slate-300"
                          }`}
                        >
                          {a.authorName}
                          {a.byInstructor && (
                            <span className="mr-1.5 rounded-full bg-gold-400/10 px-1.5 py-0.5 text-[10px]">
                              المحاضر
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-200">
                          {a.body}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {dateFmt.format(a.createdAt)}
                        </p>
                      </div>
                      {canDelete(a.authorId) && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => send(`/api/lesson-answers/${a.id}`, "DELETE")}
                          aria-label="حذف الرد"
                          className="shrink-0 text-slate-500 transition hover:text-red-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {replyTo === q.id ? (
                <div className="mt-3">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value.slice(0, 4000))}
                    rows={2}
                    autoFocus
                    placeholder="اكتب ردك..."
                    className="w-full rounded-lg border border-white/15 bg-navy-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-gold-400 focus:outline-none"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={busy || reply.trim().length < 1}
                      onClick={() => submitReply(q.id)}
                      className="rounded-lg bg-gold-400 px-4 py-1.5 text-xs font-bold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
                    >
                      إرسال
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setReply("");
                      }}
                      className="rounded-lg border border-white/15 px-4 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setReplyTo(q.id);
                    setReply("");
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-gold-400"
                >
                  <CornerDownLeft size={13} />
                  {isAdmin ? "الرد كمحاضر" : "رد"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
