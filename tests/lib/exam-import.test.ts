import { describe, it, expect } from "vitest";
import { parseExamCsv, examCsvTemplate, MAX_QUESTIONS_PER_IMPORT } from "@/lib/exam-import";

describe("parseExamCsv", () => {
  const header = "question,option1,option2,option3,option4,correct";

  it("parses a clean file, resolving number / Latin / Arabic 'correct'", () => {
    const csv = [
      header,
      "ما هو الأصل المتداول؟,الأرض,المخزون,الآلات,المباني,2",
      "2 + 2 = ?,3,4,5,6,B",
      "عاصمة مصر,القاهرة,الجيزة,أسوان,,أ",
    ].join("\n");

    const { questions, errors } = parseExamCsv(csv);
    expect(errors).toEqual([]);
    expect(questions).toHaveLength(3);

    expect(questions[0].correctId).toBe("opt-1"); // "2"
    expect(questions[0].options).toEqual([
      { id: "opt-0", text: "الأرض" },
      { id: "opt-1", text: "المخزون" },
      { id: "opt-2", text: "الآلات" },
      { id: "opt-3", text: "المباني" },
    ]);
    expect(questions[1].correctId).toBe("opt-1"); // "B"
    expect(questions[2].options).toHaveLength(3); // trailing empty option dropped
    expect(questions[2].correctId).toBe("opt-0"); // "أ"
  });

  it("handles quoted fields with commas and embedded newlines + a BOM", () => {
    const csv =
      "﻿" +
      'question,option1,option2,correct\r\n' +
      '"احسب: 1,000 + 500","1,500","2,000",1\r\n' +
      '"سؤال\nمتعدد الأسطر",نعم,لا,B\r\n';
    const { questions, errors } = parseExamCsv(csv);
    expect(errors).toEqual([]);
    expect(questions).toHaveLength(2);
    expect(questions[0].text).toBe("احسب: 1,000 + 500");
    expect(questions[0].options[0].text).toBe("1,500");
    expect(questions[1].text).toContain("\n");
  });

  it("accepts the shipped template verbatim", () => {
    const { questions, errors } = parseExamCsv(examCsvTemplate());
    expect(errors).toEqual([]);
    expect(questions.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects a missing required column", () => {
    const { errors } = parseExamCsv("question,option1,option2\nx,a,b");
    expect(errors.some((e) => e.includes("correct"))).toBe(true);
  });

  it("reports per-row problems and imports nothing (all-or-nothing)", () => {
    const csv = [
      header,
      "سؤال صحيح,أ,ب,ج,د,1",
      ",أ,ب,,,1", // empty question
      "ناقص الخيارات,فقط واحد,,,,1", // <2 options
      "إجابة خارج النطاق,أ,ب,,,9", // correct out of range
      "خيار فارغ بالوسط,أ,,ج,,1", // gap
    ].join("\n");

    const { questions, errors } = parseExamCsv(csv);
    expect(questions).toEqual([]);
    expect(errors).toHaveLength(4);
    expect(errors[0]).toContain("الصف 3");
  });

  it("rejects a file over the row cap", () => {
    const rows = [header];
    for (let i = 0; i < MAX_QUESTIONS_PER_IMPORT + 1; i++) rows.push(`س${i},أ,ب,,,1`);
    const { questions, errors } = parseExamCsv(rows.join("\n"));
    expect(questions).toEqual([]);
    expect(errors[0]).toContain(String(MAX_QUESTIONS_PER_IMPORT));
  });

  it("matches 'correct' against option text when it isn't a number/letter", () => {
    const { questions, errors } = parseExamCsv(
      "question,option1,option2,correct\nاختر الصح,صح,خطأ,صح",
    );
    expect(errors).toEqual([]);
    expect(questions[0].correctId).toBe("opt-0");
  });
});
