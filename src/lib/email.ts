const apiKey = process.env.BREVO_API_KEY;
const fromAddress = process.env.EMAIL_FROM;
const fromName = process.env.EMAIL_FROM_NAME || "Ledger Academy";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/**
 * Sends a transactional email via Brevo's HTTP API (no SDK — a single
 * `fetch`, same nullable-client pattern as `src/lib/storage.ts` and the
 * Upstash path in `src/lib/rate-limit.ts`). Until BREVO_API_KEY/EMAIL_FROM
 * are set in the environment, this logs the message to the server console
 * instead so the OTP flow stays testable without a Brevo account.
 *
 * Brevo free tier: 300 emails/day, no credit card. Verify the `EMAIL_FROM`
 * address as a sender in the Brevo dashboard (Senders, Domains & Dedicated
 * IPs → Senders) before it will deliver.
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const subject = "رمز التحقق الخاص بك في Ledger Academy";
  const body = `رمز التحقق الخاص بك هو: ${code}\nصالح لمدة 5 دقائق.`;

  if (!apiKey || !fromAddress) {
    console.log(`[EMAIL DEV MODE] to ${to}: ${subject} — ${body}`);
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
      to: [{ email: to }],
      subject,
      textContent: body,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo email send failed (${res.status}): ${detail}`);
  }
}
