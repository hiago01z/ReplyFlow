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
      const priceId = subscription.items.data[0]?.price.id ?? ''
      const plan = PLAN_BY_PRICE[priceId] ?? 'free'

      await supabase
        .from('organizations')
        .update({
          plan,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          subscription_status: subscription.status,
        })
        .eq('stripe_customer_id', subscription.customer as string)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      await supabase
        .from('organizations')
        .update({
          plan: 'free',
          stripe_subscription_id: null,
          stripe_price_id: null,
          subscription_status: 'canceled',
        })
        .eq('stripe_customer_id', subscription.customer as string)

      break
    }
  }

  return NextResponse.json({ received: true })
}
