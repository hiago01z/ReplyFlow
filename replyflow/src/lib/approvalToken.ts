/**
 * Sprint 21 — WhatsApp 1-click approval tokens
 *
 * Creates and verifies signed, time-limited tokens for approving review
 * responses via a GET link sent by WhatsApp.
 *
 * Token format (base64url-encoded):
 *   reviewId|responseId|expiresAt(unix)|hmac-sha256
 *
 * Requires env var APPROVAL_SECRET (falls back to NEXTAUTH_SECRET in dev).
 */

import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  const s = process.env.APPROVAL_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("APPROVAL_SECRET env var is not set");
  return s;
}

/** Creates a token valid for 48 hours. */
export function createApprovalToken(reviewId: string, responseId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + 48 * 3600;
  const payload   = `${reviewId}|${responseId}|${expiresAt}`;
  const sig       = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

/** Verifies the token. Returns the IDs on success, null on failure/expiry. */
export function verifyApprovalToken(
  token: string,
): { reviewId: string; responseId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts   = decoded.split("|");
    if (parts.length !== 4) return null;

    const [reviewId, responseId, expiresAtStr, sig] = parts;

    // Check expiry
    const expiresAt = parseInt(expiresAtStr, 10);
    if (Number.isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) return null;

    // Verify HMAC (timing-safe)
    const payload  = `${reviewId}|${responseId}|${expiresAtStr}`;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const sigBuf   = Buffer.from(sig,      "hex");
    const expBuf   = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

    return { reviewId, responseId };
  } catch {
    return null;
  }
}
