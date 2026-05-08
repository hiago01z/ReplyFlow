import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

const PLAN_BY_PRICE: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '']: 'starter',
  [process.env.STRIPE_PRICE_PRO_MONTHLY ?? '']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? '']: 'agency',
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const isAddon = subscription.metadata?.type === 'extra_location'

      if (isAddon) {
        // ── Add-on: extra location ──────────────────────────────────────────
        const orgId = subscription.metadata?.organizationId
        if (!orgId) break

        if (subscription.status === 'active') {
          // Upsert the add-on subscription record
          await supabase.from('add_on_subscriptions').upsert(
            {
              organization_id:        orgId,
              stripe_subscription_id: subscription.id,
              type:                   'extra_location',
              quantity:               1,
              status:                 'active',
            },
            { onConflict: 'stripe_subscription_id' },
          )

          // Recompute extra_locations from active add-ons
          const { count } = await supabase
            .from('add_on_subscriptions')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('type', 'extra_location')
            .eq('status', 'active')

          await supabase
            .from('organizations')
            .update({ extra_locations: count ?? 1 })
            .eq('id', orgId)
        }
      } else {
        // ── Main plan subscription ──────────────────────────────────────────
        const priceId = subscription.items.data[0]?.price.id ?? ''
        const plan    = PLAN_BY_PRICE[priceId] ?? 'free'

        await supabase
          .from('organizations')
          .update({
            plan,
            stripe_subscription_id: subscription.id,
            stripe_price_id:        priceId,
            subscription_status:    subscription.status,
          })
          .eq('stripe_customer_id', subscription.customer as string)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const isAddon = subscription.metadata?.type === 'extra_location'

      if (isAddon) {
        const orgId = subscription.metadata?.organizationId
        if (!orgId) break

        await supabase
          .from('add_on_subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

        // Recompute
        const { count } = await supabase
          .from('add_on_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .eq('type', 'extra_location')
          .eq('status', 'active')

        await supabase
          .from('organizations')
          .update({ extra_locations: count ?? 0 })
          .eq('id', orgId)
      } else {
        await supabase
          .from('organizations')
          .update({
            plan:                    'free',
            stripe_subscription_id:  null,
            stripe_price_id:         null,
            subscription_status:     'canceled',
            extra_locations:         0,
          })
          .eq('stripe_customer_id', subscription.customer as string)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
