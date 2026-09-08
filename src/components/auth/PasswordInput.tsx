"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Matches the other auth inputs, with room on the inline-end for the toggle.
const FIELD_CLASS =
  "w-full rounded-lg border border-white/15 bg-navy-950 py-2.5 ps-3 pe-11 text-white placeholder:text-slate-500 focus:border-gold-400 focus:outline-none";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  /** "current-password" for login, "new-password" for register / reset. */
  autoComplete?: "current-password" | "new-password";
  required?: boolean;
  /** Screen-reader name — the visible <label> above isn't associated. */
  ariaLabel?: string;
};

export function PasswordInput({
  value,
  onChange,
  placeholder,
  minLength,
  autoComplete = "current-password",
  required = true,
  ariaLabel,
}: Props) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        className={FIELD_CLASS}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        aria-pressed={visible}
        className="absolute inset-y-0 end-0 flex items-center rounded-e-lg px-3 text-slate-400 transition hover:text-gold-400 focus-visible:text-gold-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50"
      >
        <Icon size={18} aria-hidden />
      </button>
    </div>
  );
}
