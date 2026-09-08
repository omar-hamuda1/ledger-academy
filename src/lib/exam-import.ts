// Parse an admin-uploaded CSV of multiple-choice questions into the shape the
// quiz routes expect. Pure + synchronous so it's unit-testable and runs the
// same on client or server.
//
// Expected columns (header row required, case-insensitive, order-independent):
//   question | option1..option6 | correct
// `correct` is the right option as a number (1-6), a Latin letter (A-F), or an
// Arabic letter (أ ب ج د هـ و), or the exact text of one option.

export const MAX_QUESTIONS_PER_IMPORT = 200;
const MAX_QUESTION_TEXT = 500;
const MAX_OPTION_TEXT = 300;

export type ParsedQuestion = {
  text: string;
  options: { id: string; text: string }[];
  correctId: string;
};

export type ExamImportResult = {
  questions: ParsedQuestion[];
  errors: string[];
};

const HEADER_ALIASES: Record<"question" | "correct", string[]> = {
  question: ["question", "q", "السؤال", "سؤال"],
  correct: ["correct", "answer", "الإجابة", "الاجابة", "الإجابة الصحيحة", "الاجابة الصحيحة"],
};

// Arabic MCQ letters, in the conventional أ-ب-ج-د order.
const ARABIC_LETTERS = ["أ", "ب", "ج", "د", "هـ", "ه", "و"];
const ARABIC_LETTER_INDEX: Record<string, number> = {
  "أ": 0, "ب": 1, "ج": 2, "د": 3, "هـ": 4, "ه": 4, "و": 5,
};

/** RFC-4180-ish CSV: quoted fields, "" escapes, embedded commas/newlines, CRLF, BOM. */
export function parseCsv(input: string): string[][] {
  let text = input;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // strip BOM

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r") {
      // handled by the \n branch
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function resolveCorrectIndex(raw: string, options: string[]): number | null {
  const value = raw.trim();
  if (!value) return null;

  if (/^[1-9][0-9]*$/.test(value)) {
    const n = Number(value) - 1;
    return n >= 0 && n < options.length ? n : null;
  }
  if (/^[a-zA-Z]$/.test(value)) {
    const n = value.toUpperCase().charCodeAt(0) - 65;
    return n >= 0 && n < options.length ? n : null;
  }
  if (value in ARABIC_LETTER_INDEX) {
    const n = ARABIC_LETTER_INDEX[value];
    return n < options.length ? n : null;
  }
  // fall back to an exact (trimmed, case-insensitive) match against an option
  const matches = options
    .map((o, i) => ({ o: o.trim().toLowerCase(), i }))
    .filter((x) => x.o === value.toLowerCase());
  return matches.length === 1 ? matches[0].i : null;
}

export function parseExamCsv(csv: string): ExamImportResult {
  const rows = parseCsv(csv).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) {
    return { questions: [], errors: ["الملف فارغ."] };
  }

  const header = rows[0].map((c) => c.trim().toLowerCase());
  const findCol = (aliases: string[]) =>
    header.findIndex((h) => aliases.includes(h));

  const questionCol = findCol(HEADER_ALIASES.question);
  const correctCol = findCol(HEADER_ALIASES.correct);

  const optionCols: number[] = [];
  for (let n = 1; n <= 6; n++) {
    const idx = header.findIndex((h) =>
      [`option${n}`, `option ${n}`, `الخيار${n}`, `الخيار ${n}`].includes(h),
    );
    if (idx !== -1) optionCols.push(idx);
  }

  const headerErrors: string[] = [];
  if (questionCol === -1) headerErrors.push('العمود "question" مفقود من صف العناوين.');
  if (correctCol === -1) headerErrors.push('العمود "correct" مفقود من صف العناوين.');
  if (optionCols.length < 2)
    headerErrors.push('يجب أن يحتوي صف العناوين على عمودين على الأقل: "option1" و "option2".');
  if (headerErrors.length > 0) return { questions: [], errors: headerErrors };

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_QUESTIONS_PER_IMPORT) {
    return {
      questions: [],
      errors: [`الحد الأقصى ${MAX_QUESTIONS_PER_IMPORT} سؤال في الملف الواحد (الملف يحتوي ${dataRows.length}).`],
    };
  }

  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];

  dataRows.forEach((cells, i) => {
    const rowLabel = `الصف ${i + 2}`; // +1 for header, +1 for 1-based
    const text = (cells[questionCol] ?? "").trim();
    const rawOptions = optionCols.map((c) => (cells[c] ?? "").trim());

    // options must be contiguous from the left — a gap is almost always a mistake
    const firstEmpty = rawOptions.findIndex((o) => o === "");
    const options =
      firstEmpty === -1 ? rawOptions : rawOptions.slice(0, firstEmpty);
    const hasGap =
      firstEmpty !== -1 && rawOptions.slice(firstEmpty).some((o) => o !== "");

    if (!text) errors.push(`${rowLabel}: نص السؤال فارغ.`);
    if (text.length > MAX_QUESTION_TEXT)
      errors.push(`${rowLabel}: نص السؤال أطول من ${MAX_QUESTION_TEXT} حرفًا.`);
    if (hasGap) {
      errors.push(`${rowLabel}: يوجد خيار فارغ بين الخيارات.`);
    } else if (options.length < 2) {
      errors.push(`${rowLabel}: يجب توفير خيارين على الأقل.`);
    }
    if (options.some((o) => o.length > MAX_OPTION_TEXT))
      errors.push(`${rowLabel}: أحد الخيارات أطول من ${MAX_OPTION_TEXT} حرفًا.`);

    const correctRaw = (cells[correctCol] ?? "").trim();
    if (!correctRaw) errors.push(`${rowLabel}: عمود "correct" فارغ.`);

    if (!text || options.length < 2 || hasGap || !correctRaw) return;

    const correctIndex = resolveCorrectIndex(correctRaw, options);
    if (correctIndex === null) {
      errors.push(
        `${rowLabel}: تعذّر تحديد الإجابة الصحيحة من القيمة «${correctRaw}» — استخدم رقمًا (1-${options.length})، أو حرفًا (A-${String.fromCharCode(64 + options.length)} أو ${ARABIC_LETTERS[options.length - 1]})، أو نص الخيار الصحيح.`,
      );
      return;
    }

    questions.push({
      text,
      options: options.map((t, idx) => ({ id: `opt-${idx}`, text: t })),
      correctId: `opt-${correctIndex}`,
    });
  });

  if (errors.length === 0 && questions.length === 0) {
    errors.push("لم يُعثر على أي سؤال في الملف.");
  }

  return { questions: errors.length > 0 ? [] : questions, errors };
}

/** The sample file offered to admins ("تنزيل نموذج"). Includes a BOM for Excel. */
export function examCsvTemplate(): string {
  const rows = [
    ["question", "option1", "option2", "option3", "option4", "correct"],
    ["ما هو الأصل المتداول؟", "الأرض", "المخزون", "الآلات", "المباني", "2"],
    ["المعادلة المحاسبية هي الأصول = الخصوم + ...", "المصروفات", "الإيرادات", "حقوق الملكية", "الأرباح", "ج"],
    ["2 + 2 = ?", "3", "4", "5", "6", "B"],
  ];
  const escape = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return "﻿" + rows.map((r) => r.map(escape).join(",")).join("\r\n") + "\r\n";
}
