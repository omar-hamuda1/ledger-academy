// Egyptian mobile number — shared by `registerSchema` (server) and the signup /
// profile forms (client) so they never drift. 11 digits: 01 + operator digit
// (0 Vodafone, 1 Etisalat, 2 Orange, 5 WE) + 8 more.

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits → Latin, strip spaces / dashes / a leading +20 or 0020. */
export function normalizePhone(raw: string): string {
  let s = raw
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\s\-()]/g, "");
  s = s.replace(/^\+?20/, "0").replace(/^0020/, "0");
  return s;
}

/** null = valid; a string = an Arabic error message. */
export function phoneError(raw: string): string | null {
  const v = normalizePhone(raw);
  if (!v) return "أدخل رقم الهاتف.";
  if (!/^01[0125]\d{8}$/.test(v)) return "رقم هاتف مصري غير صحيح (مثال: 01012345678).";
  return null;
}
