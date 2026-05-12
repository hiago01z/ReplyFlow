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
