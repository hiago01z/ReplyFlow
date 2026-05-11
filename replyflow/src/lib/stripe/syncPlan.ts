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
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '__no_key__']: 'starter',
  [process.env.STRIPE_PRICE_PRO_MONTHLY     ?? '__no_key__']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY  ?? '__no_key__']: 'agency',
}

function resolvePlan(priceId: string, productId?: string | null): string {
  return (
    PLAN_MAP[priceId] ??
    (productId ? PLAN_MAP[productId] : undefined) ??
    'free'
  )
}

async function findMainSub(customerId: string): Promise<Stripe.Subscription | null> {
  for (const status of ['active', 'trialing'] as const) {
    const { data } = await stripe.subscriptions.list({ customer: customerId, status, limit: 10 })
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
    const priceItem = foundSub.items.data[0]?.price
    const priceId   = priceItem?.id ?? ''
    const productId = typeof priceItem?.product === 'object' && priceItem.product !== null
      ? (priceItem.product as { id: string }).id
      : typeof priceItem?.product === 'string' ? priceItem.product : null

    const plan = resolvePlan(priceId, productId)

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
