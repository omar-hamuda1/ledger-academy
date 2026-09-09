import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireScope } from "@/lib/require-admin";
import { formatCode } from "@/lib/prepaid-codes";
import { logAudit } from "@/lib/audit";

const MAX_ROWS = 10_000;
const BOM = "﻿"; // so Excel reads the UTF-8 Arabic columns correctly

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// CSV of prepaid codes for the current course / used-status filter (same
// semantics as the admin page). No pagination — the whole filtered set, up to
// MAX_ROWS.
export async function GET(req: Request) {
  const admin = await requireScope("codes");
  if (!admin) return NextResponse.json({ error: "غير مصرح لك بهذا الإجراء." }, { status: 403 });

  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId") || undefined;
  const statusParam = url.searchParams.get("status");
  const isUsed = statusParam === "used" ? true : statusParam === "unused" ? false : undefined;

  const where = {
    ...(courseId ? { courseId } : {}),
    ...(isUsed === undefined ? {} : { isUsed }),
  };

  const codes = await db.prepaidCode.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    include: {
      course: { select: { title: true } },
      usedBy: { select: { name: true, email: true } },
    },
  });

  const header = ["code", "course", "status", "used_by_name", "used_by_email", "used_at", "created_at"];
  const lines = [header.join(",")];
  for (const c of codes) {
    lines.push(
      [
        formatCode(c.code),
        c.course.title,
        c.isUsed ? "used" : "unused",
        c.usedBy?.name ?? "",
        c.usedBy?.email ?? "",
        c.usedAt ? c.usedAt.toISOString() : "",
        c.createdAt.toISOString(),
      ]
        .map((v) => csvCell(String(v)))
        .join(","),
    );
  }

  await logAudit({
    actorId: admin.id,
    actorEmail: admin.email ?? "unknown",
    action: "prepaid_codes.export",
    targetType: "Course",
    targetId: courseId ?? "all",
    metadata: { rows: codes.length, status: statusParam ?? "all" },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(BOM + lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="prepaid-codes-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
