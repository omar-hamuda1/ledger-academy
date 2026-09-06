import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY;
const fromAddress = process.env.EMAIL_FROM;

if (apiKey) sgMail.setApiKey(apiKey);

/**
 * Sends an email via SendGrid. Until SENDGRID_API_KEY/EMAIL_FROM are set in
 * the environment, this logs the message to the server console instead so
 * the OTP flow stays testable without a SendGrid account.
 */
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const subject = "رمز التحقق الخاص بك في Ledger Academy";
  const body = `رمز التحقق الخاص بك هو: ${code}\nصالح لمدة 5 دقائق.`;

  if (!apiKey || !fromAddress) {
    console.log(`[EMAIL DEV MODE] to ${to}: ${subject} — ${body}`);
    return;
  }

  await sgMail.send({
    from: fromAddress,
    to,
    subject,
    text: body,
  });
}
