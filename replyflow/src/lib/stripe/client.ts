import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
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
