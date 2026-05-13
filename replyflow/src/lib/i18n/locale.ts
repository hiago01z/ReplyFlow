/**
 * i18n locale utilities — server-side use only.
 * Determines the user's preferred language for emails, WhatsApp and PDF templates.
 */

export type AppLocale = 'pt' | 'en' | 'es'

/**
 * Normalises any Accept-Language segment or BCP-47 tag to AppLocale.
 * Falls back to 'pt' (Portuguese / Brazil) for unknown or missing values.
 */
export function parseLocale(raw: string | null | undefined): AppLocale {
  if (!raw) return 'pt'
  const lang = raw.toLowerCase().split(/[-_]/)[0]
  if (lang === 'en') return 'en'
  if (lang === 'es') return 'es'
  return 'pt'
}

/**
 * Extracts AppLocale from an Accept-Language header value.
 * Example: "en-US,en;q=0.9,pt;q=0.8" → 'en'
 */
export function localeFromAcceptLanguage(header: string | null): AppLocale {
  return parseLocale(header?.split(',')[0])
}
