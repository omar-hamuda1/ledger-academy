import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

/**
 * Neon Object Storage — private `payment-proofs` bucket, holding the payment
 * screenshots students attach to a `CodeOrder`. Same nullable-client pattern
 * as `src/lib/email.ts` / the Upstash path in `src/lib/rate-limit.ts`: when
 * the S3 env vars aren't present (declared in `neon.ts`, pulled by
 * `neon env pull`), this is `null` and the upload route returns a clear
 * "not configured" error instead of crashing.
 */

export const PAYMENT_PROOF_BUCKET = "payment-proofs";

/** Every key a given user's uploads live under — used to check ownership. */
export function paymentProofPrefix(userId: string): string {
  return `proofs/${userId}/`;
}

export const paymentProofStore =
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_ENDPOINT_URL_S3
    ? new Files({ adapter: neon({ bucket: PAYMENT_PROOF_BUCKET }) })
    : null;
