import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import type Stripe from 'stripe'

/**
 * POST /api/billing/sync
 *
 * Queries Stripe directly for the user's current subscription and updates the
 * organization's plan in Supabase.
 *
 * Recovery chain when stripe_customer_id is missing (webhook never fired):
 *   1. Search ALL Stripe customers with the user's email (multiple may exist
 *      when checkout ran multiple times without saving the customer ID)
 *   2. Find the customer that actually has an active/trialing subscription
 *   3. Save stripe_customer_id and update plan
 *
 * Plan resolution supports both price IDs (price_xxx) and product IDs (prod_xxx)
 * in STRIPE_PRICE_* env vars.
 */

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '']: 'starter',
  [process.env.STRIPE_PRICE_PRO_MONTHLY     ?? '']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY  ?? '']: 'agency',
}

const AMOUNT_TO_PLAN: Record<number, string> = {
  9700:  'starter',
  19700: 'pro',
  49700: 'agency',
}

function resolvePlan(priceId: string, productId?: string | null): string {
  return PLAN_MAP[priceId] ?? (productId ? PLAN_MAP[productId] : undefined) ?? 'free'
}

async function resolvePlanFromStripePrice(priceId: string): Promise<string> {
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] })
    const product = typeof price.product === 'object' && price.product !== null
      ? (price.product as { id: string; name?: string; metadata?: Record<string, string> })
      : null
    if (product?.metadata?.plan) return product.metadata.plan
    if (product?.name) {
      const n = product.name.toLowerCase()
      if (n.includes('agenc') || n.includes('agency')) return 'agency'
      if (n.includes('pro'))                           return 'pro'
      if (n.includes('starter'))                       return 'starter'
    }
    if (price.unit_amount) {
      return AMOUNT_TO_PLAN[price.unit_amount] ?? 'free'
    }
  } catch (err) {
    console.error('[billing/sync] resolvePlanFromStripePrice error:', err)
  }
  return 'free'
}

async function findActiveSubForCustomer(
  customerId: string,
): Promise<Stripe.Subscription | null> {
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

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  const { data: userRecord } = await serviceClient
    .from('users')
    .select('email, organization:organizations(id, stripe_customer_id)')
    .eq('id', user.id)
    .single()

  const org = userRecord?.organization as unknown as {
    id: string
    stripe_customer_id: string | null
  } | null

  if (!org?.id) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // ── Fast path: we already have the customer ID ───────────────────────────────
  if (org.stripe_customer_id) {
    try {
      const sub = await findActiveSubForCustomer(org.stripe_customer_id)
      if (sub) {
        const priceRaw  = sub.items.data[0]?.price
        const priceId   = typeof priceRaw === 'string' ? priceRaw : (priceRaw?.id ?? '')
        const productId = typeof priceRaw === 'string'
          ? null
          : (typeof priceRaw?.product === 'string' ? priceRaw.product
              : (priceRaw?.product && typeof priceRaw.product === 'object')
                ? (priceRaw.product as { id: string }).id : null)
        let plan        = resolvePlan(priceId, productId)
        if (plan === 'free' && priceId) plan = await resolvePlanFromStripePrice(priceId)

        await serviceClient.from('organizations').update({
          plan,
          stripe_subscription_id: sub.id,
          stripe_price_id:        priceId,
          subscription_status:    sub.status,
        }).eq('id', org.id)

        console.log(`[billing/sync] fast-path plan="${plan}" orgId=${org.id}`)
        return NextResponse.json({ plan, status: sub.status, synced: true })
      }
    } catch (err) {
      console.error('[billing/sync] fast-path error:', err)
      // Fall through to email search
    }
  }

  // ── Recovery: search ALL customers with this email ───────────────────────────
  const email = userRecord?.email ?? user.email
  if (!email) {
    return NextResponse.json({ plan: 'free', synced: false, reason: 'no_email' })
  }

  try {
    // Stripe may have created multiple customers for the same email
    // (one per checkout attempt when stripe_customer_id wasn't saved).
    // Iterate all of them until we find one with an active subscription.
    let hasMore = true
    let startingAfter: string | undefined
    let foundCustomerId: string | null = null
    let foundSub: Stripe.Subscription | null = null

    while (hasMore && !foundSub) {
      const customers = await stripe.customers.list({
        email,
        limit: 10,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })

      for (const customer of customers.data) {
        const sub = await findActiveSubForCustomer(customer.id)
        if (sub) {
          foundCustomerId = customer.id
          foundSub = sub
          break
        }
      }

      hasMore = customers.has_more
      if (customers.data.length > 0) {
        startingAfter = customers.data[customers.data.length - 1].id
      }
    }

    if (!foundSub || !foundCustomerId) {
      console.log(`[billing/sync] no active subscription found for email ${email}`)
      return NextResponse.json({ plan: 'free', synced: false, reason: 'no_subscription' })
    }

    const priceRaw  = foundSub.items.data[0]?.price
    const priceId   = typeof priceRaw === 'string' ? priceRaw : (priceRaw?.id ?? '')
    const productId = typeof priceRaw === 'string'
      ? null
      : (typeof priceRaw?.product === 'string' ? priceRaw.product
          : (priceRaw?.product && typeof priceRaw.product === 'object')
            ? (priceRaw.product as { id: string }).id : null)
    let plan        = resolvePlan(priceId, productId)
    if (plan === 'free' && priceId) plan = await resolvePlanFromStripePrice(priceId)

    await serviceClient.from('organizations').update({
      plan,
      stripe_subscription_id: foundSub.id,
      stripe_price_id:        priceId,
      subscription_status:    foundSub.status,
      stripe_customer_id:     foundCustomerId,
    }).eq('id', org.id)

    console.log(`[billing/sync] recovery plan="${plan}" customer=${foundCustomerId} orgId=${org.id} priceId=${priceId} productId=${productId}`)
    return NextResponse.json({ plan, status: foundSub.status, synced: true })

  } catch (err) {
    console.error('[billing/sync] error:', err)
    return NextResponse.json({ error: 'Stripe query failed' }, { status: 502 })
  }
}
