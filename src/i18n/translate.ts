import type { Locale } from "./config";
import { DEFAULT_LOCALE } from "./config";
import ar from "./messages/ar.json";
import en from "./messages/en.json";

// `ar` is authoritative for which keys exist; `en` may lag during the phased
// rollout, so a missing English key falls back to Arabic, then to the key.
export type MessageKey = keyof typeof ar;

const DICTS: Record<Locale, Record<string, string | undefined>> = {
  ar: ar as Record<string, string | undefined>,
  en: en as Record<string, string | undefined>,
};

/** Build a `t(key, vars?)` for a locale. `vars` fills `{name}` placeholders. */
export function makeT(locale: Locale) {
  return function t(key: MessageKey, vars?: Record<string, string | number>): string {
    let str: string = DICTS[locale][key] ?? DICTS[DEFAULT_LOCALE][key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return str;
  };
}

export type TFunction = ReturnType<typeof makeT>;
