import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

/**
 * POST /api/billing/sync
 *
 * Queries Stripe directly for the user's current subscription and updates the
 * organization's plan in Supabase.
 *
 * Recovery chain when stripe_customer_id is missing (webhook never fired):
 *   1. Search Stripe customers by email
 *   2. Save stripe_customer_id to org
 *   3. Look up subscriptions and update plan
 *
 * Plan resolution supports both price IDs (price_xxx) and product IDs (prod_xxx)
 * in STRIPE_PRICE_* env vars.
 */

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '']: 'starter',
  [process.env.STRIPE_PRICE_PRO_MONTHLY     ?? '']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY  ?? '']: 'agency',
}

function resolvePlan(priceId: string, productId?: string | null): string {
  return PLAN_MAP[priceId] ?? (productId ? PLAN_MAP[productId] : undefined) ?? 'free'
}

async function findSubscription(customerId: string) {
  // Check active first, then trialing
  for (const status of ['active', 'trialing'] as const) {
    const { data } = await stripe.subscriptions.list({
      customer: customerId,
      status,
      limit: 10,
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

  let customerId = org.stripe_customer_id

  // ── Step 1: recover customer ID from Stripe by email if missing ─────────────
  if (!customerId) {
    const email = userRecord?.email ?? user.email
    if (!email) {
      return NextResponse.json({ plan: 'free', synced: false, reason: 'no_customer_no_email' })
    }

    try {
      const customers = await stripe.customers.list({ email, limit: 5 })
      const customer = customers.data[0] // most recent match
      if (!customer) {
        return NextResponse.json({ plan: 'free', synced: false, reason: 'no_stripe_customer' })
      }
      customerId = customer.id

      // Save it immediately so future syncs and webhooks work
      await serviceClient
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id)

      console.log(`[billing/sync] recovered stripe_customer_id=${customerId} for org ${org.id}`)
    } catch (err) {
      console.error('[billing/sync] customer lookup failed:', err)
      return NextResponse.json({ error: 'Stripe customer lookup failed' }, { status: 502 })
    }
  }

  // ── Step 2: find active/trialing subscription ────────────────────────────────
  try {
    const sub = await findSubscription(customerId)

    if (!sub) {
      console.log(`[billing/sync] no subscription found for customer ${customerId}`)
      return NextResponse.json({ plan: 'free', synced: false, reason: 'no_subscription' })
    }

    const priceItem = sub.items.data[0]?.price
    const priceId   = priceItem?.id ?? ''
    const productId = typeof priceItem?.product === 'string' ? priceItem.product : null
    const plan      = resolvePlan(priceId, productId)

    await serviceClient.from('organizations').update({
      plan,
      stripe_subscription_id: sub.id,
      stripe_price_id:        priceId,
      subscription_status:    sub.status,
      stripe_customer_id:     customerId,
    }).eq('id', org.id)

    console.log(`[billing/sync] plan="${plan}" status="${sub.status}" orgId=${org.id} priceId=${priceId} productId=${productId}`)
    return NextResponse.json({ plan, status: sub.status, synced: true })

  } catch (err) {
    console.error('[billing/sync] subscription lookup failed:', err)
    return NextResponse.json({ error: 'Stripe subscription lookup failed' }, { status: 502 })
  }
}
