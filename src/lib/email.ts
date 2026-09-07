const apiKey = process.env.BREVO_API_KEY;
const fromAddress = process.env.EMAIL_FROM;
const fromName = process.env.EMAIL_FROM_NAME || "Ledger Academy";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/**
 * Low-level transactional send via Brevo's HTTP API (no SDK — a single
 * `fetch`, same nullable-client pattern as `src/lib/storage.ts` and the
 * Upstash path in `src/lib/rate-limit.ts`). Until BREVO_API_KEY/EMAIL_FROM are
 * set it logs the message to the server console instead, so flows stay
 * testable without a Brevo account.
 *
 * Throws on a non-2xx Brevo response. The OTP path lets that surface (so
 * `/api/auth/otp/send` returns 500 rather than a false success); best-effort
 * callers like the admin alerts wrap it in try/catch.
 *
 * Brevo free tier: 300 emails/day, no credit card. Verify the `EMAIL_FROM`
 * address as a sender in the Brevo dashboard first.
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  text: string;
}): Promise<void> {
  const recipients = (Array.isArray(params.to) ? params.to : [params.to])
    .map((e) => e.trim())
    .filter(Boolean);
  if (recipients.length === 0) return;

  if (!apiKey || !fromAddress) {
    console.log(
      `[EMAIL DEV MODE] to ${recipients.join(", ")}: ${params.subject} — ${params.text}`,
    );
    return;
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: fromAddress, name: fromName },
      to: recipients.map((email) => ({ email })),
      subject: params.subject,
      textContent: params.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo email send failed (${res.status}): ${detail}`);
  }
}

export function sendOtpEmail(to: string, code: string): Promise<void> {
  return sendEmail({
    to,
    subject: "رمز التحقق الخاص بك في Ledger Academy",
    text: `رمز التحقق الخاص بك هو: ${code}\nصالح لمدة 5 دقائق.`,
  });
}

/**
 * Who operational alerts (a new code-order request, etc.) go to.
 * `ADMIN_ALERT_EMAILS` (comma-separated) overrides; otherwise pass the ADMIN
 * users' own addresses. Placeholder seed addresses (`@example.com`) are
 * dropped so they don't bounce against Brevo's sender reputation.
 */
export function resolveAdminAlertEmails(fallback: string[]): string[] {
  const configured = process.env.ADMIN_ALERT_EMAILS;
  const list = configured ? configured.split(",") : fallback;
  return [
    ...new Set(
      list
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && !e.endsWith("@example.com")),
    ),
  ];
}
