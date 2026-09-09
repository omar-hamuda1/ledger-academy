// Shared display-name rules for signup — used by both `registerSchema` (server)
// and the register form (client) so the two never drift. Pure, no deps.

export const NAME_MIN = 2;
export const NAME_MAX = 80;

/** Collapse internal whitespace and trim. */
export function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * null = acceptable; a string = an Arabic error message to show the user.
 * Runs on the raw input (normalizes internally).
 */
export function displayNameError(raw: string): string | null {
  const v = normalizeName(raw);
  if (v.length < NAME_MIN) return "الاسم قصير جدًا.";
  if (v.length > NAME_MAX) return "الاسم طويل جدًا.";
  if (/\d/.test(v)) return "الاسم لا يجب أن يحتوي على أرقام.";
  if ((v.match(/\p{L}/gu)?.length ?? 0) < 2) return "أدخل اسمًا صحيحًا (حروف فقط).";
  if (/(https?:\/\/|www\.|\.(com|net|org|io|me|ly|co)\b)/i.test(v))
    return "الاسم لا يمكن أن يحتوي على روابط.";
  return null;
}
