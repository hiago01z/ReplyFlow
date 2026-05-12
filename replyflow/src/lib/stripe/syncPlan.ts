/**
 * syncPlanFromStripe — server-side Stripe plan resolution
 *
 * Queries Stripe directly (not the DB) to find the active subscription
 * for a user and updates the organizations table. Designed to be called
 * from Server Components so there are no client-side caching issues.
 */

import { stripe } from './client'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

const PLAN_MAP: Record<string, string> = {
  // Planos mensais
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '__no_key__']: 'starter',
  [process.env.STRIPE_PRICE_PRO_MONTHLY     ?? '__no_key__']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY  ?? '__no_key__']: 'agency',
  // Planos anuais (mesmo plano, ciclo diferente)
  [process.env.STRIPE_PRICE_STARTER_ANNUAL  ?? '__no_key__']: 'starter',
  [process.env.STRIPE_PRICE_PRO_ANNUAL      ?? '__no_key__']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_ANNUAL   ?? '__no_key__']: 'agency',
}

// Price amount (in BRL cents) → plan name fallback
// Used when env-var price IDs don't match the subscription's price.
const AMOUNT_TO_PLAN: Record<number, string> = {
  // Mensais
  9700:   'starter',  // R$ 97/mês
  19700:  'pro',      // R$197/mês
  49700:  'agency',   // R$497/mês
  // Anuais
  97000:  'starter',  // R$970/ano
  197000: 'pro',      // R$1970/ano
  497000: 'agency',   // R$4970/ano
}

function resolvePlan(priceId: string, productId?: string | null): string {
  return (
    PLAN_MAP[priceId] ??
    (productId ? PLAN_MAP[productId] : undefined) ??
    'free'
  )
}

/**
 * Fallback resolver: fetches the price object directly from Stripe and tries:
 *   1. Product metadata `plan` field
 *   2. Product name (case-insensitive substring)
 *   3. Price unit_amount in BRL cents
 */
async function resolvePlanFromStripePrice(priceId: string): Promise<string> {
  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ['product'],
    })
    const product = typeof price.product === 'object' && price.product !== null
      ? (price.product as { id: string; name?: string; metadata?: Record<string, string> })
      : null

    if (product?.metadata?.plan) {
      return product.metadata.plan
    }
    if (product?.name) {
      const name = product.name.toLowerCase()
      if (name.includes('agenc') || name.includes('agency')) return 'agency'
      if (name.includes('pro'))                               return 'pro'
      if (name.includes('starter'))                          return 'starter'
    }
    if (price.unit_amount && price.currency?.toLowerCase() === 'brl') {
      return AMOUNT_TO_PLAN[price.unit_amount] ?? 'free'
    }
  } catch (err) {
    console.error('[syncPlan] resolvePlanFromStripePrice error:', err)
  }
  return 'free'
}

async function findMainSub(customerId: string): Promise<Stripe.Subscription | null> {
  for (const status of ['active', 'trialing'] as const) {
    const { data } = await stripe.subscriptions.list({
      customer: customerId,
      status,
      limit: 10,
      expand: ['data.items.data.price'],
    })
    const sub = data.find((s) => s.metadata?.type !== 'extra_location')
    if (sub) return sub
  }
  return null
}

export interface SyncResult {
  plan:     string          // resolved plan name (e.g. "agency")
  synced:   boolean         // true if a paid plan was found and DB was updated
  reason?:  string          // why synced=false (for debugging)
}

/**
 * @param orgId             organizations.id
 * @param stripeCustomerId  organizations.stripe_customer_id (may be null)
 * @param userEmail         user's auth email (used as fallback lookup)
 */
export async function syncPlanFromStripe(
  orgId: string,
  stripeCustomerId: string | null,
  userEmail: string | null | undefined,
): Promise<SyncResult> {
  const serviceClient = createServiceClient()

  try {
    let customerId = stripeCustomerId
    let foundSub:   Stripe.Subscription | null = null

    // ── Fast path: we already have the customer ID ──────────────────────────
    if (customerId) {
      foundSub = await findMainSub(customerId)
    }

    // ── Recovery: search all customers by email ──────────────────────────────
    if (!foundSub && userEmail) {
      let hasMore = true
      let startingAfter: string | undefined

      while (hasMore && !foundSub) {
        const customers = await stripe.customers.list({
          email: userEmail,
          limit: 10,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        })

        for (const customer of customers.data) {
          const sub = await findMainSub(customer.id)
          if (sub) {
            foundSub   = sub
            customerId = customer.id
            break
          }
        }

        hasMore = customers.has_more
        if (customers.data.length > 0) {
          startingAfter = customers.data[customers.data.length - 1].id
        }
      }
    }

    if (!foundSub || !customerId) {
      // Save customerId even if no active sub (helps future lookups)
      if (customerId && customerId !== stripeCustomerId) {
        await serviceClient
          .from('organizations')
          .update({ stripe_customer_id: customerId })
          .eq('id', orgId)
      }
      return { plan: 'free', synced: false, reason: 'no_active_subscription' }
    }

    // ── Resolve plan from price ID ───────────────────────────────────────────
    // When expand is used the price field is an object; without expand it's a string (the price ID itself).
    // We handle both cases for safety.
    const priceRaw  = foundSub.items.data[0]?.price
    const priceId   = typeof priceRaw === 'string'
      ? priceRaw
      : (priceRaw?.id ?? '')
    const productId = typeof priceRaw === 'string'
      ? null
      : (typeof priceRaw?.product === 'object' && priceRaw.product !== null
          ? (priceRaw.product as { id: string }).id
          : typeof priceRaw?.product === 'string' ? priceRaw.product : null)

    let plan = resolvePlan(priceId, productId)

    // Env-var map didn't match → look up the price directly in Stripe
    if (plan === 'free' && priceId) {
      console.log(`[syncPlan] env-var map miss for priceId=${priceId}, fetching price from Stripe...`)
      plan = await resolvePlanFromStripePrice(priceId)
    }

    console.log(
      `[syncPlan] orgId=${orgId} customer=${customerId} sub=${foundSub.id}` +
      ` priceId=${priceId} productId=${productId} → plan=${plan}`,
    )

    // ── Update DB ────────────────────────────────────────────────────────────
    await serviceClient
      .from('organizations')
      .update({
        plan,
        stripe_customer_id:     customerId,
        stripe_subscription_id: foundSub.id,
        stripe_price_id:        priceId,
        subscription_status:    foundSub.status,
      })
      .eq('id', orgId)

    return { plan, synced: plan !== 'free' }

  } catch (err) {
    console.error('[syncPlan] Stripe error:', err)
    return { plan: 'free', synced: false, reason: 'stripe_error' }
  }
}
