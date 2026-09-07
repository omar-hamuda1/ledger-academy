/**
 * Prepaid course-access codes: generation, normalization, display.
 *
 * Codes are 12 characters from a 31-symbol alphabet with visually ambiguous
 * letters removed (no I/O/0/1). 31^12 ≈ 7.9e17 possibilities, so brute-forcing
 * a valid code is infeasible even before the redemption rate limit.
 *
 * Stored canonical form: the bare 12-char uppercase string (no separators).
 * `formatCode` adds dashes for display only; `normalizeCode` strips whatever
 * a student pastes back down to the canonical form.
 */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 31 symbols, no I O 0 1
export const CODE_LENGTH = 12;
export const MAX_BATCH = 200;

export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** N distinct codes (deduped in-memory; DB `@unique` is the real guarantee). */
export function generateCodeBatch(count: number): string[] {
  const set = new Set<string>();
  // Cap iterations well above `count` so a pathological RNG can't spin forever.
  for (let i = 0; set.size < count && i < count * 20; i++) {
    set.add(generateCode());
  }
  return [...set];
}

/** Canonical form for lookup: keep only alphabet chars, uppercase. */
export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .split("")
    .filter((ch) => ALPHABET.includes(ch))
    .join("");
}

/** `ABCD-EFGH-JKLM` for display. */
export function formatCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, "$1-");
}
