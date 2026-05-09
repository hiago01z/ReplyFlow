import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

// Supports both price IDs (price_xxx) and product IDs (prod_xxx) as env var values.
// Stripe sends price.id in subscriptions; if env vars accidentally contain product IDs
// we fall back to matching on price.product.
const PLAN_BY_PRICE: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '']: 'starter',
  [process.env.STRIPE_PRICE_PRO_MONTHLY ?? '']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY ?? '']: 'agency',
}

function resolvePlan(priceId: string, productId?: string | null): string {
  return (
    PLAN_BY_PRICE[priceId] ??
    (productId ? PLAN_BY_PRICE[productId] : undefined) ??
    'free'
  )
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
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  console.log(`[stripe/webhook] event: ${event.type}`)

  switch (event.type) {

    // ── Checkout concluído ────────────────────────────────────────────────────
    // CRITICAL: salva o stripe_customer_id na org antes de qualquer outra coisa.
    // Sem isso, os eventos de subscription não encontram a organização.
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const orgId   = session.metadata?.organizationId

      console.log(`[stripe/webhook] checkout.session.completed orgId=${orgId} customer=${session.customer}`)

      if (!orgId) {
        console.error('[stripe/webhook] checkout.session.completed: missing organizationId in metadata')
        break
      }

      // Salvar stripe_customer_id (essencial para lookups futuros)
      if (session.customer) {
        const { error } = await supabase
          .from('organizations')
          .update({ stripe_customer_id: session.customer as string })
          .eq('id', orgId)

        if (error) {
          console.error('[stripe/webhook] failed to save stripe_customer_id:', error)
        } else {
          console.log(`[stripe/webhook] stripe_customer_id saved for org ${orgId}`)
        }
      }

      // Se já tiver a subscription expandida, atualizar o plano agora mesmo.
      // (Na maioria dos casos customer.subscription.created já chegou ou chegará logo.)
      if (session.subscription) {
        try {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id

          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const priceItem = subscription.items.data[0]?.price
          const priceId   = priceItem?.id ?? ''
          const productId = typeof priceItem?.product === 'string' ? priceItem.product : null
          const plan      = resolvePlan(priceId, productId)

          await supabase
            .from('organizations')
            .update({
              plan,
              stripe_subscription_id: subscription.id,
              stripe_price_id:        priceId,
              subscription_status:    subscription.status,
            })
            .eq('id', orgId)

          console.log(`[stripe/webhook] plan updated to "${plan}" for org ${orgId}`)
        } catch (err) {
          // Não crítico — customer.subscription.created vai cobrir este caso
          console.error('[stripe/webhook] failed to update plan from checkout session:', err)
        }
      }
      break
    }

    // ── Subscription criada ou atualizada ─────────────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const isAddon = subscription.metadata?.type === 'extra_location'

      console.log(`[stripe/webhook] ${event.type} sub=${subscription.id} status=${subscription.status} isAddon=${isAddon}`)

      if (isAddon) {
        // ── Add-on: local extra ──────────────────────────────────────────────
        const orgId = subscription.metadata?.organizationId
        if (!orgId) break

        if (subscription.status === 'active') {
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
        // ── Plano principal ──────────────────────────────────────────────────
        const priceItem2 = subscription.items.data[0]?.price
        const priceId    = priceItem2?.id ?? ''
        const productId2 = typeof priceItem2?.product === 'string' ? priceItem2.product : null
        const plan       = resolvePlan(priceId, productId2)

        // Lookup primário: metadata.organizationId (injetado em subscription_data.metadata)
        // Lookup secundário: stripe_customer_id (funciona para renewals e updates)
        const orgId = subscription.metadata?.organizationId

        console.log(`[stripe/webhook] updating plan="${plan}" orgId=${orgId} customer=${subscription.customer}`)

        const updatePayload = {
          plan,
          stripe_subscription_id: subscription.id,
          stripe_price_id:        priceId,
          subscription_status:    subscription.status,
          // Garantir que o stripe_customer_id esteja salvo
          stripe_customer_id:     subscription.customer as string,
        }

        if (orgId) {
          // Mais confiável — usa o ID direto da organização
          const { error } = await supabase
            .from('organizations')
            .update(updatePayload)
            .eq('id', orgId)

          if (error) {
            console.error(`[stripe/webhook] update by orgId failed:`, error)
          } else {
            console.log(`[stripe/webhook] plan updated by orgId: ${orgId}`)
          }
        } else {
          // Fallback: busca por stripe_customer_id (renewals sem metadata)
          const { error } = await supabase
            .from('organizations')
            .update(updatePayload)
            .eq('stripe_customer_id', subscription.customer as string)

          if (error) {
            console.error(`[stripe/webhook] update by customer_id failed:`, error)
          } else {
            console.log(`[stripe/webhook] plan updated by customer_id: ${subscription.customer}`)
          }
        }
      }
      break
    }

    // ── Pagamento recorrente aprovado ─────────────────────────────────────────
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // Garante subscription_status = 'active' em renewals
      if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
        await supabase
          .from('organizations')
          .update({ subscription_status: 'active' })
          .eq('stripe_customer_id', invoice.customer as string)

        console.log(`[stripe/webhook] renewal confirmed for customer ${invoice.customer}`)
      }
      break
    }

    // ── Subscription cancelada ────────────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const isAddon = subscription.metadata?.type === 'extra_location'

      console.log(`[stripe/webhook] customer.subscription.deleted sub=${subscription.id} isAddon=${isAddon}`)

      if (isAddon) {
        const orgId = subscription.metadata?.organizationId
        if (!orgId) break

        await supabase
          .from('add_on_subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)

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
        const orgId = subscription.metadata?.organizationId

        const cancelPayload = {
          plan:                    'free',
          stripe_subscription_id:  null,
          stripe_price_id:         null,
          subscription_status:     'canceled',
          extra_locations:         0,
        }

        if (orgId) {
          await supabase.from('organizations').update(cancelPayload).eq('id', orgId)
        } else {
          await supabase
            .from('organizations')
            .update(cancelPayload)
            .eq('stripe_customer_id', subscription.customer as string)
        }

        console.log(`[stripe/webhook] subscription canceled, plan reset to free`)
      }
      break
    }

    default:
      console.log(`[stripe/webhook] unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
