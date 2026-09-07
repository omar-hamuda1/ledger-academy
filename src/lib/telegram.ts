const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatIds = (process.env.TELEGRAM_CHAT_ID ?? "")
  .split(",")
  .map((c) => c.trim())
  .filter(Boolean);

/**
 * Sends a plain-text message to the configured Telegram chat(s) via the Bot
 * API (a single `fetch`, no SDK — same nullable-client pattern as
 * `src/lib/email.ts`). Until TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are set it
 * logs to the server console instead.
 *
 * Setup: message @BotFather → /newbot → copy the token into
 * TELEGRAM_BOT_TOKEN; send any message to the new bot, then open
 * https://api.telegram.org/bot<token>/getUpdates and copy `result[].message
 * .chat.id` into TELEGRAM_CHAT_ID (comma-separated for more than one).
 *
 * Throws on a failed send — best-effort callers wrap it in try/catch.
 */
export async function sendTelegram(text: string): Promise<void> {
  if (!botToken || chatIds.length === 0) {
    console.log(`[TELEGRAM DEV MODE] ${text}`);
    return;
  }

  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
  for (const chatId of chatIds) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Telegram send failed (${res.status}): ${detail}`);
    }
  }
}
