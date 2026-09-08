import nodemailer, { type Transporter } from "nodemailer";

const gmailUser = process.env.GMAIL_USER;
// Google shows the app password as four space-separated groups — tolerate that.
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
const fromName = process.env.EMAIL_FROM_NAME || "Ledger Academy";
// Gmail rewrites `From` to the authenticated account unless the address is a
// verified "Send mail as" alias, so default the sender to GMAIL_USER itself.
const fromAddress = process.env.EMAIL_FROM || gmailUser;

let transporter: Transporter | null = null;

/**
 * Gmail SMTP transport, built once per warm instance. Returns null until
 * GMAIL_USER + GMAIL_APP_PASSWORD are set (same nullable-client pattern as
 * `src/lib/storage.ts` / the Upstash path in `src/lib/rate-limit.ts`) — flows
 * then fall back to logging the message to the server console.
 *
 * This is a stopgap: a `@gmail.com` sender lands in spam for many recipients
 * and Gmail caps at ~500 messages/day. The real path is a custom domain with
 * SPF/DKIM through a transactional provider — see the deploy docs.
 */
function getTransport(): Transporter | null {
  if (!gmailUser || !gmailAppPassword) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailAppPassword },
      // User-facing OTP send awaits this — fail fast rather than hang.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

/**
 * Low-level transactional send. Throws on an SMTP failure (the OTP path lets
 * that surface so `/api/auth/otp/send` returns 500 rather than a false
 * success; best-effort callers like the admin alerts wrap it in try/catch).
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

  const tx = getTransport();
  if (!tx || !fromAddress) {
    console.log(
      `[EMAIL DEV MODE] to ${recipients.join(", ")}: ${params.subject} — ${params.text}`,
    );
    return;
  }

  // Subject becomes a header — strip CR/LF defensively even though every
  // caller passes a fixed string.
  const subject = params.subject.replace(/[\r\n]+/g, " ").trim();

  await tx.sendMail({
    from: { name: fromName, address: fromAddress },
    to: recipients,
    subject,
    text: params.text,
  });
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
 * dropped so they don't bounce against the sender's reputation.
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
