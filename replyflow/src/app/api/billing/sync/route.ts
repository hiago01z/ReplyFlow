import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

/**
 * POST /api/billing/sync
 *
 * Queries Stripe directly for the user's current subscription and updates the
 * organization's plan in Supabase.  Called by CheckoutSuccessBanner after
 * returning from Stripe Checkout — this removes the dependency on webhooks for
 * the initial plan activation and works even when STRIPE_WEBHOOK_SECRET is not
 * yet configured.
 *
 * Plan resolution supports both price IDs (price_xxx) and product IDs (prod_xxx)
 * in STRIPE_PRICE_* env vars so misconfigured environments still work.
 */

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '']: 'starter',
  [process.env.STRIPE_PRICE_PRO_MONTHLY     ?? '']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY  ?? '']: 'agency',
}

function resolvePlan(priceId: string, productId?: string | null): string {
  return PLAN_MAP[priceId] ?? (productId ? PLAN_MAP[productId] : undefined) ?? 'free'
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()

  const { data: userRecord } = await serviceClient
    .from('users')
    .select('organization:organizations(id, stripe_customer_id, stripe_subscription_id)')
    .eq('id', user.id)
    .single()

  const org = userRecord?.organization as unknown as {
    id: string
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
  } | null

  if (!org?.id) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // If no customer yet, nothing to sync
  if (!org.stripe_customer_id) {
    return NextResponse.json({ plan: 'free', synced: false })
  }

  try {
    // Fetch active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: org.stripe_customer_id,
      status: 'active',
      limit: 5,
    })

    // Find the main plan subscription (not add-ons)
    const mainSub = subscriptions.data.find(
      (s) => s.metadata?.type !== 'extra_location',
    )

    if (!mainSub) {
      // No active subscription — check for trialing
      const trialSubs = await stripe.subscriptions.list({
        customer: org.stripe_customer_id,
        status: 'trialing',
        limit: 5,
      })
      const trialSub = trialSubs.data.find(
        (s) => s.metadata?.type !== 'extra_location',
      )

      if (!trialSub) {
        return NextResponse.json({ plan: 'free', synced: false })
      }

      const priceItem = trialSub.items.data[0]?.price
      const priceId   = priceItem?.id ?? ''
      const productId = typeof priceItem?.product === 'string' ? priceItem.product : null
      const plan      = resolvePlan(priceId, productId)

      await serviceClient.from('organizations').update({
        plan,
        stripe_subscription_id: trialSub.id,
        stripe_price_id:        priceId,
        subscription_status:    trialSub.status,
        stripe_customer_id:     org.stripe_customer_id,
      }).eq('id', org.id)

      return NextResponse.json({ plan, synced: true })
    }

    const priceItem = mainSub.items.data[0]?.price
    const priceId   = priceItem?.id ?? ''
    const productId = typeof priceItem?.product === 'string' ? priceItem.product : null
    const plan      = resolvePlan(priceId, productId)

    await serviceClient.from('organizations').update({
      plan,
      stripe_subscription_id: mainSub.id,
      stripe_price_id:        priceId,
      subscription_status:    mainSub.status,
      stripe_customer_id:     org.stripe_customer_id,
    }).eq('id', org.id)

    console.log(`[billing/sync] plan="${plan}" orgId=${org.id}`)
    return NextResponse.json({ plan, synced: true })

  } catch (err) {
    console.error('[billing/sync] stripe error:', err)
    return NextResponse.json({ error: 'Stripe query failed' }, { status: 502 })
  }
}
