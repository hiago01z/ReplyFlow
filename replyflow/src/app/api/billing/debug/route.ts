/**
 * GET /api/billing/debug
 *
 * Diagnostic endpoint — returns what the DB has and what Stripe returns
 * for the current user's subscriptions. Used to diagnose plan sync issues.
 * Does NOT modify any data.
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceClient = createServiceClient()
  const { data: userRecord } = await serviceClient
    .from('users')
    .select('email, organization:organizations(id,plan,stripe_customer_id,stripe_subscription_id,subscription_status)')
    .eq('id', user.id)
    .single()

  const org = userRecord?.organization as unknown as {
    id: string
    plan: string
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    subscription_status: string | null
  } | null

  const email = userRecord?.email ?? user.email

  // ── Stripe lookups ────────────────────────────────────────────────────────
  let stripeCustomers: { id: string; email: string | null }[] = []
  let stripeSubscriptions: object[] = []
  let stripeError: string | null = null

  try {
    // List customers by email
    const customers = await stripe.customers.list({ email: email ?? '', limit: 10 })
    stripeCustomers = customers.data.map((c) => ({ id: c.id, email: c.email }))

    // List subscriptions for each customer
    for (const customer of customers.data) {
      for (const status of ['active', 'trialing', 'past_due', 'incomplete'] as const) {
        const { data } = await stripe.subscriptions.list({
          customer: customer.id,
          status,
          limit: 5,
          expand: ['data.items.data.price'],
        })
        for (const sub of data) {
          const priceRaw = sub.items.data[0]?.price
          const priceId  = typeof priceRaw === 'string' ? priceRaw : (priceRaw?.id ?? 'unknown')
          const productId = typeof priceRaw === 'string' ? null
            : (typeof priceRaw?.product === 'string' ? priceRaw.product
              : (typeof priceRaw?.product === 'object' && priceRaw.product !== null)
                ? (priceRaw.product as { id: string }).id : null)
          stripeSubscriptions.push({
            id:         sub.id,
            status:     sub.status,
            customerId: customer.id,
            priceId,
            productId,
            metadata:   sub.metadata,
          })
        }
      }
    }

    // Also look up by stripe_customer_id if different
    if (org?.stripe_customer_id && !stripeCustomers.find((c) => c.id === org.stripe_customer_id)) {
      const extraCustomer = await stripe.customers.retrieve(org.stripe_customer_id)
      if (!extraCustomer.deleted) {
        for (const status of ['active', 'trialing', 'past_due'] as const) {
          const { data } = await stripe.subscriptions.list({
            customer: org.stripe_customer_id,
            status,
            limit: 5,
            expand: ['data.items.data.price'],
          })
          for (const sub of data) {
            const priceRaw = sub.items.data[0]?.price
            const priceId  = typeof priceRaw === 'string' ? priceRaw : (priceRaw?.id ?? 'unknown')
            stripeSubscriptions.push({
              id:         sub.id,
              status:     sub.status,
              customerId: org.stripe_customer_id,
              priceId,
              metadata:   sub.metadata,
              source:     'stripe_customer_id_in_db',
            })
          }
        }
      }
    }
  } catch (err) {
    stripeError = String(err)
  }

  return NextResponse.json({
    db: {
      userId:               user.id,
      userEmail:            email,
      orgId:                org?.id ?? null,
      orgPlan:              org?.plan ?? null,
      stripeCustomerId:     org?.stripe_customer_id ?? null,
      stripeSubscriptionId: org?.stripe_subscription_id ?? null,
      subscriptionStatus:   org?.subscription_status ?? null,
    },
    env: {
      STRIPE_PRICE_STARTER_MONTHLY: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '(not set)',
      STRIPE_PRICE_PRO_MONTHLY:     process.env.STRIPE_PRICE_PRO_MONTHLY     ?? '(not set)',
      STRIPE_PRICE_AGENCY_MONTHLY:  process.env.STRIPE_PRICE_AGENCY_MONTHLY  ?? '(not set)',
    },
    stripe: {
      customers:     stripeCustomers,
      subscriptions: stripeSubscriptions,
      error:         stripeError,
    },
  })
}
