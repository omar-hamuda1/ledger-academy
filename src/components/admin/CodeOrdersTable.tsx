"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Inbox, ImageOff, Copy } from "lucide-react";
import { formatCode } from "@/lib/prepaid-codes";

export type CodeOrderRow = {
  id: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  courseTitle: string;
  coursePrice: number;
  paymentReference: string | null;
  paymentNote: string | null;
  proofUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  issuedCode: string | null;
  createdAt: number;
  reviewedAt: number | null;
};

const dateFmt = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" });
const egp = (n: number) => `${n.toLocaleString("ar-EG")} ج.م`;

const STATUS_BADGE: Record<CodeOrderRow["status"], { label: string; cls: string }> = {
  PENDING: { label: "قيد المراجعة", cls: "bg-gold-400/10 text-gold-400" },
  APPROVED: { label: "مقبول", cls: "bg-emerald-400/10 text-emerald-400" },
  REJECTED: { label: "مرفوض", cls: "bg-red-500/10 text-red-400" },
};

export function CodeOrdersTable({ rows }: { rows: CodeOrderRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approveChecked, setApproveChecked] = useState(false);

  function copyRef(ref: string) {
    navigator.clipboard?.writeText(ref).then(
      () => toast.success("تم نسخ رقم العملية"),
      () => {},
    );
  }

  async function review(id: string, action: "approve" | "reject", rejectionReason?: string) {
    setBusyId(id);
    const res = await fetch(`/api/code-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        action === "approve"
          ? { action, verified: true }
          : { action, ...(rejectionReason ? { rejectionReason } : {}) },
      ),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    setRejectingId(null);
    setReason("");
    setApprovingId(null);
    setApproveChecked(false);

    if (!res.ok) {
      toast.error(data.error ?? "تعذّرت العملية.");
      return;
    }
    toast.success(action === "approve" ? "تمت الموافقة وفُتح الكورس للطالب." : "تم رفض الطلب.");
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-white/10 bg-navy-900/60 p-16 text-center shadow-card">
        <Inbox size={32} className="text-slate-600" />
        <p className="text-slate-400">لا توجد طلبات في هذا القسم.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-white/10 bg-navy-900/60 shadow-card">
      <table className="w-full text-right text-sm">
        <thead>
          <tr className="border-b border-white/10 text-slate-400">
            <th className="px-4 py-3 font-semibold">الطالب</th>
            <th className="px-4 py-3 font-semibold">الكورس</th>
            <th className="px-4 py-3 font-semibold">رقم العملية والمبلغ</th>
            <th className="px-4 py-3 font-semibold">إثبات الدفع</th>
            <th className="px-4 py-3 font-semibold">التاريخ</th>
            <th className="px-4 py-3 font-semibold">الحالة</th>
            <th className="px-4 py-3 font-semibold">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-white/5 align-top text-slate-200 transition-colors last:border-0 hover:bg-white/[0.03]"
            >
              <td className="px-4 py-3">
                <p className="font-medium text-white">{row.studentName}</p>
                <p className="text-xs text-slate-400">{row.studentEmail}</p>
                <p dir="ltr" className="text-right text-xs text-slate-400">
                  {row.studentPhone}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-300">{row.courseTitle}</td>
              <td className="max-w-xs px-4 py-3 text-slate-300">
                {row.paymentReference ? (
                  <button
                    type="button"
                    onClick={() => copyRef(row.paymentReference!)}
                    dir="ltr"
                    title="نسخ رقم العملية"
                    className="flex items-center gap-1.5 font-mono text-sm text-white transition hover:text-gold-400"
                  >
                    {row.paymentReference}
                    <Copy size={12} className="shrink-0 opacity-60" />
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">— بدون رقم عملية —</span>
                )}
                <p className="mt-0.5 text-xs text-slate-400">المتوقع: {egp(row.coursePrice)}</p>
                {row.paymentNote && (
                  <p className="mt-1 whitespace-pre-line break-words text-xs text-slate-400">
                    {row.paymentNote}
                  </p>
                )}
                {row.issuedCode && (
                  <p className="mt-1 font-mono text-xs text-gold-400">
                    {formatCode(row.issuedCode)}
                  </p>
                )}
                {row.rejectionReason && (
                  <p className="mt-1 text-xs text-red-400">السبب: {row.rejectionReason}</p>
                )}
              </td>
              <td className="px-4 py-3">
                {row.proofUrl ? (
                  <a href={row.proofUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL, expires hourly; next/image can't cache it */}
                    <img
                      src={row.proofUrl}
                      alt="إثبات الدفع"
                      className="h-16 w-16 rounded-control border border-white/10 object-cover transition hover:opacity-80"
                    />
                  </a>
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-control border border-dashed border-white/15 text-slate-600">
                    <ImageOff size={16} />
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {dateFmt.format(row.createdAt)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[row.status].cls}`}
                >
                  {STATUS_BADGE[row.status].label}
                </span>
              </td>
              <td className="px-4 py-3">
                {row.status !== "PENDING" ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : rejectingId === row.id ? (
                  <div className="flex w-56 flex-col gap-2">
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value.slice(0, 300))}
                      rows={2}
                      placeholder="سبب الرفض (اختياري)"
                      className="rounded-lg border border-white/15 bg-navy-950 px-2 py-1.5 text-xs text-white focus:border-gold-400 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => review(row.id, "reject", reason.trim() || undefined)}
                        className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-60"
                      >
                        تأكيد الرفض
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(null);
                          setReason("");
                        }}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : approvingId === row.id ? (
                  <div className="flex w-64 flex-col gap-2">
                    <p className="text-xs text-slate-300">
                      تأكد من وصول{" "}
                      <span className="font-bold text-white">{egp(row.coursePrice)}</span>
                      {row.paymentReference && (
                        <>
                          {" "}
                          بالمرجع{" "}
                          <span dir="ltr" className="font-mono text-white">
                            {row.paymentReference}
                          </span>
                        </>
                      )}{" "}
                      في حساب إنستاباي.
                    </p>
                    <label className="flex items-start gap-2 text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={approveChecked}
                        onChange={(e) => setApproveChecked(e.target.checked)}
                        className="mt-0.5 accent-gold-400"
                      />
                      تأكدت من وصول التحويل بنفس المبلغ في حسابنا
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!approveChecked || busyId === row.id}
                        onClick={() => review(row.id, "approve")}
                        className="rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        تأكيد الموافقة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setApprovingId(null);
                          setApproveChecked(false);
                        }}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => {
                        setApprovingId(row.id);
                        setApproveChecked(false);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                    >
                      <Check size={13} />
                      موافقة
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => setRejectingId(row.id)}
                      className="flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/5 disabled:opacity-60"
                    >
                      <X size={13} />
                      رفض
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
