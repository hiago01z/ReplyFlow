import Stripe from 'stripe'

// Inicialização lazy — não crasha se a key não estiver configurada ainda
function createStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY não configurada. Adicione nas variáveis de ambiente da Vercel.')
  }
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

// Singleton lazy — só instancia quando for usado
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) _stripe = createStripeClient()
  return _stripe
}

// Compatibilidade com código existente
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const STRIPE_PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    price: 97,
    currency: 'brl',
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    price: 197,
    currency: 'brl',
  },
  agency: {
    name: 'Agência',
    priceId: process.env.STRIPE_PRICE_AGENCY_MONTHLY!,
    price: 497,
    currency: 'brl',
  },
} as const

// Planos anuais — 10 meses de preço (2 meses grátis, ~17% de desconto)
// Requerem env vars: STRIPE_PRICE_STARTER_ANNUAL, STRIPE_PRICE_PRO_ANNUAL, STRIPE_PRICE_AGENCY_ANNUAL
export const STRIPE_ANNUAL_PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER_ANNUAL ?? '',
    price: 970,          // R$970/ano (R$97 × 10)
    monthlyEquiv: 81,    // ~R$81/mês
    currency: 'brl',
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO_ANNUAL ?? '',
    price: 1970,         // R$1970/ano (R$197 × 10)
    monthlyEquiv: 164,   // ~R$164/mês
    currency: 'brl',
  },
  agency: {
    name: 'Agência',
    priceId: process.env.STRIPE_PRICE_AGENCY_ANNUAL ?? '',
    price: 4970,         // R$4970/ano (R$497 × 10)
    monthlyEquiv: 414,   // ~R$414/mês
    currency: 'brl',
  },
} as const

// ── Multi-currency support ────────────────────────────────────────────────────

export type SupportedCurrency = 'brl' | 'usd' | 'eur'

export const CURRENCY_PLANS: Record<SupportedCurrency, {
  starter: { name: string; priceId: string; price: number; currency: string }
  pro:     { name: string; priceId: string; price: number; currency: string }
  agency:  { name: string; priceId: string; price: number; currency: string }
}> = {
  brl: STRIPE_PLANS,
  usd: {
    starter: { name: 'Starter', priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY_USD ?? '', price: 19, currency: 'usd' },
    pro:     { name: 'Pro',     priceId: process.env.STRIPE_PRICE_PRO_MONTHLY_USD     ?? '', price: 39, currency: 'usd' },
    agency:  { name: 'Agência', priceId: process.env.STRIPE_PRICE_AGENCY_MONTHLY_USD  ?? '', price: 99, currency: 'usd' },
  },
  eur: {
    starter: { name: 'Starter', priceId: process.env.STRIPE_PRICE_STARTER_MONTHLY_EUR ?? '', price: 17, currency: 'eur' },
    pro:     { name: 'Pro',     priceId: process.env.STRIPE_PRICE_PRO_MONTHLY_EUR     ?? '', price: 35, currency: 'eur' },
    agency:  { name: 'Agência', priceId: process.env.STRIPE_PRICE_AGENCY_MONTHLY_EUR  ?? '', price: 89, currency: 'eur' },
  },
}

export const CURRENCY_ANNUAL_PLANS: Record<SupportedCurrency, {
  starter: { name: string; priceId: string; price: number; monthlyEquiv: number; currency: string }
  pro:     { name: string; priceId: string; price: number; monthlyEquiv: number; currency: string }
  agency:  { name: string; priceId: string; price: number; monthlyEquiv: number; currency: string }
}> = {
  brl: STRIPE_ANNUAL_PLANS,
  usd: {
    starter: { name: 'Starter', priceId: process.env.STRIPE_PRICE_STARTER_ANNUAL_USD ?? '', price: 190, monthlyEquiv: 16, currency: 'usd' },
    pro:     { name: 'Pro',     priceId: process.env.STRIPE_PRICE_PRO_ANNUAL_USD     ?? '', price: 390, monthlyEquiv: 33, currency: 'usd' },
    agency:  { name: 'Agência', priceId: process.env.STRIPE_PRICE_AGENCY_ANNUAL_USD  ?? '', price: 990, monthlyEquiv: 83, currency: 'usd' },
  },
  eur: {
    starter: { name: 'Starter', priceId: process.env.STRIPE_PRICE_STARTER_ANNUAL_EUR ?? '', price: 170, monthlyEquiv: 14, currency: 'eur' },
    pro:     { name: 'Pro',     priceId: process.env.STRIPE_PRICE_PRO_ANNUAL_EUR     ?? '', price: 350, monthlyEquiv: 29, currency: 'eur' },
    agency:  { name: 'Agência', priceId: process.env.STRIPE_PRICE_AGENCY_ANNUAL_EUR  ?? '', price: 890, monthlyEquiv: 74, currency: 'eur' },
  },
}

// EU member states + common EUR-using countries
const EUR_COUNTRIES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE',
  'IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
  'CH','NO','GB', // non-EU but EUR-friendly for pricing
])

export function getCurrencyFromCountry(country: string | null | undefined): SupportedCurrency {
  if (!country) return 'usd'
  const c = country.toUpperCase()
  if (c === 'BR') return 'brl'
  if (EUR_COUNTRIES.has(c)) return 'eur'
  return 'usd'
}

// ── Extra location add-on prices per currency ─────────────────────────────────
export const EXTRA_LOCATION_PRICES: Record<SupportedCurrency, { priceId: string; price: number; currency: string }> = {
  brl: { priceId: process.env.STRIPE_PRICE_EXTRA_LOCATION         ?? '', price: 49, currency: 'brl' },
  usd: { priceId: process.env.STRIPE_PRICE_EXTRA_LOCATION_USD     ?? '', price: 9,  currency: 'usd' },
  eur: { priceId: process.env.STRIPE_PRICE_EXTRA_LOCATION_EUR     ?? '', price: 8,  currency: 'eur' },
}
