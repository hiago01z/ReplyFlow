/**
 * Locale helpers — dynamic locale detection to avoid hardcoded "pt-BR".
 *
 * - Client components: pass `undefined` to toLocaleDateString/toLocaleString
 *   → browser uses its own locale automatically.
 * - Server components / API routes: call getLocaleFromRequest(request)
 *   → parses Accept-Language header, falls back to "pt-BR".
 */

/**
 * Extracts the user's preferred locale from the Accept-Language header.
 * Returns the first BCP 47 language tag (e.g. "en-US", "pt-BR", "de").
 * Falls back to "pt-BR" when the header is absent.
 */
export function getLocaleFromRequest(request: Request): string {
  const accept = request.headers.get("accept-language");
  if (!accept) return "pt-BR";
  const first = accept.split(",")[0].split(";")[0].trim();
  return first || "pt-BR";
}

/**
 * Extracts locale from a Headers object (next/headers — server components).
 */
export function getLocaleFromHeaders(
  headerMap: Awaited<ReturnType<typeof import("next/headers")["headers"]>>,
): string {
  const accept = headerMap.get("accept-language");
  if (!accept) return "pt-BR";
  const first = accept.split(",")[0].split(";")[0].trim();
  return first || "pt-BR";
}
