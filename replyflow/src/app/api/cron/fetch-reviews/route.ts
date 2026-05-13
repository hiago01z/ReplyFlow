import { NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServiceClient } from '@/lib/supabase/server'
import { GoogleMyBusinessClient } from '@/lib/google/myBusiness'
import { generateReviewResponse } from '@/lib/openai/generateResponse'
import { sendNegativeReviewAlert, sendWhatsAppAlert } from '@/lib/email/alerts'
import { sendWebhook, type WebhookPayload } from '@/lib/webhooks/sendWebhook'
import type { LocationNiche, LocationTone } from '@/types'

// ─── Proteção de segurança ────────────────────────────────────────────────────
// Chamado pelo cron-job.org a cada 30 minutos
// Aceita autenticação por header OU query param (compatível com plano free do cron-job.org)
//   Header:    Authorization: Bearer CRON_SECRET
//   Query:     ?secret=CRON_SECRET

// waitUntil keeps the function alive after response; cron-job.org gets 200 in <2s
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')

  const validHeader = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const validQuery  = querySecret === process.env.CRON_SECRET

  if (!validHeader && !validQuery) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Return 200 immediately so cron-job.org doesn't timeout (30s limit on free plan).
  // waitUntil keeps Vercel running the heavy work in background.
  waitUntil(runSync())

  return NextResponse.json({ success: true, status: 'processing', timestamp: new Date().toISOString() })
}

async function runSync() {
  const serviceClient = createServiceClient()

  // ── Helper: delay aleatório de 5-20 minutos para parecer natural ────────────
  function randomDelayMs(): number {
    const minMs = 5  * 60 * 1000
    const maxMs = 20 * 60 * 1000
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  }

  const results = {
    processed:              0,
    newReviews:             0,
    newFacebookReviews:     0,
    scheduled:              0,
    autoPublished:          0,
    alertsSent:             0,
    detected:               0,
    fbTokenWarnings:        0,
    errors:                 0,
  }

  // ── PASS -1: Alertar sobre tokens Facebook próximos de expirar (< 7 dias) ────
  // Long-lived user tokens duram 60 dias. Page tokens derivados de long-lived são
  // permanentes mas apenas enquanto o user token original não expirar.
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: expiringFbLocations } = await serviceClient
    .from('locations')
    .select('id, name, organization_id, facebook_token_expires_at, organization:organizations(plan)')
    .eq('active', true)
    .eq('facebook_connected', true)
    .not('facebook_token_expires_at', 'is', null)
    .lt('facebook_token_expires_at', sevenDaysFromNow)

  for (const loc of expiringFbLocations ?? []) {
    try {
      const { data: orgUser } = await serviceClient
        .from('users')
        .select('email')
        .eq('organization_id', loc.organization_id)
        .eq('role', 'owner')
        .single()

      if (orgUser?.email) {
        await sendNegativeReviewAlert({
          to:           orgUser.email,
          businessName: loc.name,
          authorName:   'Sistema ReplyFlow',
          rating:       0, // usado apenas para triagem — não é alerta negativo
          content:      `Seu token de acesso ao Facebook para o local "${loc.name}" expira em breve (${new Date(loc.facebook_token_expires_at as string).toLocaleDateString('pt-BR')}). Acesse Configurações → Locais → ${loc.name} e reconecte o Facebook para manter a integração funcionando.`,
          reviewId:     loc.id,
        }).catch(() => null)
        results.fbTokenWarnings++
      }
    } catch (err) {
      console.warn(`[cron] Facebook token warning failed for loc ${loc.id}:`, err instanceof Error ? err.message : err)
    }
  }

  // ── PASS 0: Auto-detectar google_location_name para locais ainda não vinculados ─
  // Locais com token mas sem location_name — tentativa silenciosa a cada cron run
  const { data: unlinkedLocations } = await serviceClient
    .from('locations')
    .select('id, google_access_token, google_refresh_token')
    .eq('active', true)
    .not('google_access_token', 'is', null)
    .is('google_location_name', null)

  for (const loc of unlinkedLocations ?? []) {
    try {
      const gmb = new GoogleMyBusinessClient({
        accessToken:  loc.google_access_token,
        refreshToken: loc.google_refresh_token ?? null,
        locationName: '',
      })
      const accounts = await gmb.listAccounts()
      for (const account of accounts) {
        const locs = await gmb.listLocations(account.name)
        if (locs.length > 0) {
          await serviceClient
            .from('locations')
            .update({
              google_location_name: locs[0].name,
              google_account_id:    account.name,
              google_access_token:  gmb.currentAccessToken,
            })
            .eq('id', loc.id)
          console.log(`[cron] PASS 0 detected location ${locs[0].name} for loc ${loc.id}`)
          results.detected++
          break
        }
      }
    } catch (err) {
      // Silent — will retry next cron run
      console.warn(`[cron] PASS 0 detect failed for loc ${loc.id}:`, err instanceof Error ? err.message : err)
    }
  }

  // ── PASS 1: Buscar novas reviews do GMB ──────────────────────────────────────
  // Apenas locais com google_location_name configurado (necessário para a API GMB)
  const { data: gmbLocations, error: gmbError } = await serviceClient
    .from('locations')
    .select('*, organization:organizations(id, plan, subscription_status, alert_email, webhook_url, webhook_secret, parent_agency_id)')
    .eq('active', true)
    .not('google_access_token', 'is', null)
    .not('google_location_name', 'is', null)

  if (gmbError) {
    console.error('[cron] error fetching GMB locations:', gmbError)
  }

  for (const location of gmbLocations ?? []) {
    try {
      const gmb = new GoogleMyBusinessClient({
        accessToken:    location.google_access_token,
        refreshToken:   location.google_refresh_token,
        locationName:   location.google_location_name,
      })

      const gmbReviews = await gmb.listUnansweredReviews()

      for (const gmbReview of gmbReviews) {
        const rating = GoogleMyBusinessClient.starRatingToNumber(gmbReview.starRating)

        // ── Inserir review (ignora se já existe) ─────────────────────────────
        const { data: inserted, error: insertError } = await serviceClient
          .from('reviews')
          .upsert(
            {
              location_id:            location.id,
              platform:               'google',
              external_id:            gmbReview.reviewId,
              author_name:            gmbReview.reviewer.displayName,
              author_photo_url:       gmbReview.reviewer.profilePhotoUrl ?? null,
              rating,
              content:                gmbReview.comment ?? null,
              platform_published_at:  gmbReview.createTime,
              status:                 'pending',
            },
            { onConflict: 'platform,external_id', ignoreDuplicates: true }
          )
          .select('id, rating, status')
          .single()

        // ignoreDuplicates=true retorna null quando já existe — pular
        if (insertError || !inserted) continue

        results.newReviews++

        // ── Alerta para reviews negativos (1-2 estrelas) ─────────────────────
        if (rating <= 2) {
          const { data: directOwner } = await serviceClient
            .from('users')
            .select('email, whatsapp, email_alerts')
            .eq('organization_id', location.organization_id)
            .eq('role', 'owner')
            .single()

          const org = location.organization as unknown as {
            plan: string; subscription_status: string; alert_email: string | null;
            webhook_url: string | null; webhook_secret: string | null;
            parent_agency_id: string | null;
          } | null

          // Agency client orgs have no users — fall back to agency owner
          let orgUser = directOwner
          if (!orgUser && org?.parent_agency_id) {
            const { data: agencyOwner } = await serviceClient
              .from('users')
              .select('email, whatsapp, email_alerts')
              .eq('organization_id', org.parent_agency_id)
              .eq('role', 'owner')
              .single()
            orgUser = agencyOwner ?? null
          }

          // Use custom alert email if set, otherwise fall back to user's login email
          const alertTo = org?.alert_email || orgUser?.email

          if (alertTo && orgUser?.email_alerts !== false) {
            const isProOrAgency = org?.plan === 'pro' || org?.plan === 'agency'

            // E-mail para todos os planos
            await sendNegativeReviewAlert({
              to:           alertTo,
              businessName: location.name,
              authorName:   gmbReview.reviewer.displayName,
              rating,
              content:      gmbReview.comment ?? '',
              reviewId:     inserted.id,
            }).catch(() => null)

            await serviceClient.from('alerts').insert({
              review_id: inserted.id,
              channel:   'email',
              recipient: alertTo,
            })

            // WhatsApp apenas para Pro/Agency com número cadastrado
            if (isProOrAgency && orgUser?.whatsapp) {
              await sendWhatsAppAlert({
                phone:        orgUser.whatsapp,
                businessName: location.name,
                authorName:   gmbReview.reviewer.displayName,
                rating,
                content:      gmbReview.comment ?? '',
                reviewId:     inserted.id,
              }).catch(() => null)

              await serviceClient.from('alerts').insert({
                review_id: inserted.id,
                channel:   'whatsapp',
                recipient: orgUser.whatsapp,
              })
            }

            results.alertsSent++
          }

          // ── Webhook personalizado (Pro/Agency) ───────────────────────────
          const isProOrAgency = (org?.plan === 'pro' || org?.plan === 'agency')
          if (isProOrAgency && org?.webhook_url) {
            const webhookPayload: WebhookPayload = {
              event:         'review.negative',
              review_id:     inserted.id,
              location_id:   location.id,
              business_name: location.name,
              author_name:   gmbReview.reviewer.displayName,
              rating,
              content:       gmbReview.comment ?? null,
              platform:      'google',
              review_url:    `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyflow-hivi.com'}/reviews?highlight=${inserted.id}`,
              timestamp:     new Date().toISOString(),
            }
            await sendWebhook(org.webhook_url, org.webhook_secret ?? null, webhookPayload)
              .catch((err) => console.warn(`[cron] webhook failed for org ${location.organization_id}:`, err instanceof Error ? err.message : err))
          }
        }

        // ── Agendamento de auto-publicação com delay natural ─────────────────
        const minRating = location.auto_publish_min_rating ?? 3
        if (location.auto_publish && rating >= minRating && inserted.status === 'pending') {
          const publishAt = new Date(Date.now() + randomDelayMs()).toISOString()
          await serviceClient
            .from('reviews')
            .update({ publish_after: publishAt })
            .eq('id', inserted.id)
          results.scheduled++
        }
      }

      // Persistir access_token — pode ter sido renovado internamente pelo GMB client
      await serviceClient
        .from('locations')
        .update({ google_access_token: gmb.currentAccessToken })
        .eq('id', location.id)

      results.processed++
    } catch (err) {
      console.error(`[cron] error fetching GMB reviews for location ${location.id}:`, err)
      results.errors++
    }
  }

  // ── PASS 2: Buscar novas avaliações do Facebook ──────────────────────────────
  const { data: facebookLocations, error: fbError } = await serviceClient
    .from('locations')
    .select('id, name, niche, organization_id, facebook_page_id, facebook_access_token, organization:organizations(plan, alert_email, webhook_url, webhook_secret, parent_agency_id)')
    .eq('active', true)
    .eq('facebook_connected', true)
    .not('facebook_access_token', 'is', null)
    .not('facebook_page_id', 'is', null)

  if (fbError) {
    console.error('[cron] error fetching Facebook locations:', fbError)
  }

  for (const location of facebookLocations ?? []) {
    try {
      const ratingsRes = await fetch(
        `https://graph.facebook.com/v19.0/${location.facebook_page_id}/ratings` +
        `?fields=id,reviewer,rating,review_text,created_time&limit=50` +
        `&access_token=${location.facebook_access_token}`,
      )

      if (!ratingsRes.ok) {
        const errText = await ratingsRes.text()
        console.error(`[cron] Facebook ratings API error for location ${location.id}:`, errText)
        results.errors++
        continue
      }

      const ratingsData = await ratingsRes.json() as {
        data: {
          id:           string
          reviewer:     { name: string; id: string }
          rating:       number
          review_text?: string
          created_time: string
        }[]
      }

      for (const fbReview of ratingsData.data ?? []) {
        const rating  = fbReview.rating
        const content = fbReview.review_text ?? null

        const { data: inserted, error: insertError } = await serviceClient
          .from('reviews')
          .upsert(
            {
              location_id:            location.id,
              platform:               'facebook',
              external_id:            fbReview.id,
              author_name:            fbReview.reviewer.name,
              rating,
              content,
              platform_published_at:  fbReview.created_time,
              status:                 'pending',
            },
            { onConflict: 'platform,external_id', ignoreDuplicates: true }
          )
          .select('id, rating, status')
          .single()

        if (insertError || !inserted) continue

        results.newFacebookReviews++

        // ── Alerta para avaliações negativas (1-2 estrelas) ──────────────────
        if (rating <= 2) {
          const { data: directOwner } = await serviceClient
            .from('users')
            .select('email, whatsapp, email_alerts')
            .eq('organization_id', location.organization_id)
            .eq('role', 'owner')
            .single()

          const org = location.organization as unknown as {
            plan: string; alert_email: string | null;
            webhook_url: string | null; webhook_secret: string | null;
            parent_agency_id: string | null;
          } | null

          // Agency client orgs have no users — fall back to agency owner
          let orgUser = directOwner
          if (!orgUser && org?.parent_agency_id) {
            const { data: agencyOwner } = await serviceClient
              .from('users')
              .select('email, whatsapp, email_alerts')
              .eq('organization_id', org.parent_agency_id)
              .eq('role', 'owner')
              .single()
            orgUser = agencyOwner ?? null
          }

          const alertTo = org?.alert_email || orgUser?.email

          if (alertTo && orgUser?.email_alerts !== false) {
            const isProOrAgency = org?.plan === 'pro' || org?.plan === 'agency'

            await sendNegativeReviewAlert({
              to:           alertTo,
              businessName: location.name,
              authorName:   fbReview.reviewer.name,
              rating,
              content:      content ?? '',
              reviewId:     inserted.id,
            }).catch(() => null)

            await serviceClient.from('alerts').insert({
              review_id: inserted.id,
              channel:   'email',
              recipient: alertTo,
            })

            if (isProOrAgency && orgUser?.whatsapp) {
              await sendWhatsAppAlert({
                phone:        orgUser.whatsapp,
                businessName: location.name,
                authorName:   fbReview.reviewer.name,
                rating,
                content:      content ?? '',
                reviewId:     inserted.id,
              }).catch(() => null)

              await serviceClient.from('alerts').insert({
                review_id: inserted.id,
                channel:   'whatsapp',
                recipient: orgUser.whatsapp,
              })
            }

            results.alertsSent++

            // Webhook personalizado (Pro/Agency)
            if (isProOrAgency && org?.webhook_url) {
              const webhookPayload: WebhookPayload = {
                event:         'review.negative',
                review_id:     inserted.id,
                location_id:   location.id,
                business_name: location.name,
                author_name:   fbReview.reviewer.name,
                rating,
                content,
                platform:      'facebook',
                review_url:    `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyflow-hivi.com'}/reviews?highlight=${inserted.id}`,
                timestamp:     new Date().toISOString(),
              }
              await sendWebhook(org.webhook_url, org.webhook_secret ?? null, webhookPayload)
                .catch((err) => console.warn(`[cron] Facebook webhook failed for org ${location.organization_id}:`, err instanceof Error ? err.message : err))
            }
          }
        }
      }
    } catch (err) {
      console.error(`[cron] error fetching Facebook reviews for location ${location.id}:`, err)
      results.errors++
    }
  }

  // ── PASS 3: Publicar reviews agendados ───────────────────────────────────────
  // Separado do Pass 1 para que reviews de DEMO também sejam publicados,
  // mesmo sem google_location_name configurado.
  const { data: autoPublishLocations } = await serviceClient
    .from('locations')
    .select('id, name, niche, tone, google_access_token, google_refresh_token, google_location_name')
    .eq('active', true)
    .eq('auto_publish', true)

  const now = new Date().toISOString()

  for (const location of autoPublishLocations ?? []) {
    // Criar cliente GMB apenas se disponível (necessário para reviews reais)
    const gmb = location.google_access_token && location.google_location_name
      ? new GoogleMyBusinessClient({
          accessToken:  location.google_access_token,
          refreshToken: location.google_refresh_token,
          locationName: location.google_location_name,
        })
      : null

    // ── Agendar reviews pendentes sem publish_after ──────────────────────────
    // Cobre reviews de demo e reviews reais inseridos antes do auto_publish ser ativado
    const { data: unscheduled } = await serviceClient
      .from('reviews')
      .select('id, rating, external_id')
      .eq('location_id', location.id)
      .eq('status', 'pending')
      .is('publish_after', null)

    if (unscheduled?.length) {
      const { data: locFull } = await serviceClient
        .from('locations')
        .select('auto_publish_min_rating')
        .eq('id', location.id)
        .single()

      const minRating = locFull?.auto_publish_min_rating ?? 3

      for (const u of unscheduled) {
        if ((u.rating ?? 0) >= minRating) {
          const publishAt = new Date(Date.now() + randomDelayMs()).toISOString()
          await serviceClient
            .from('reviews')
            .update({ publish_after: publishAt })
            .eq('id', u.id)
          results.scheduled++
        }
      }
    }

    // ── Publicar reviews com delay vencido ───────────────────────────────────
    const { data: scheduledReviews } = await serviceClient
      .from('reviews')
      .select('id, rating, content, external_id, author_name, publish_after')
      .eq('location_id', location.id)
      .eq('status', 'pending')
      .not('publish_after', 'is', null)
      .lte('publish_after', now)

    for (const rev of scheduledReviews ?? []) {
      try {
        await autoPublishReview({
          serviceClient,
          gmb,
          reviewId:      rev.id,
          reviewContent: rev.content ?? '',
          externalId:    rev.external_id,
          rating:        rev.rating ?? 3,
          authorName:    rev.author_name ?? 'Cliente',
          location: {
            name:                 location.name,
            niche:                location.niche as LocationNiche,
            tone:                 location.tone as LocationTone,
            google_location_name: location.google_location_name ?? '',
          },
        })
        results.autoPublished++
      } catch (err) {
        console.error(`[cron] error auto-publishing review ${rev.id}:`, err)
        results.errors++
      }
    }
  }

  console.log('[cron] runSync completed', {
    locationsProcessed:  results.processed,
    newGoogleReviews:    results.newReviews,
    newFacebookReviews:  results.newFacebookReviews,
    scheduled:           results.scheduled,
    autoPublished:       results.autoPublished,
    alertsSent:          results.alertsSent,
    locationsDetected:   results.detected,
    errors:              results.errors,
  })
}

// ─── Helper: gera resposta com IA e publica no GMB ───────────────────────────

interface AutoPublishParams {
  serviceClient:  ReturnType<typeof createServiceClient>
  gmb:            GoogleMyBusinessClient | null
  reviewId:       string
  reviewContent:  string
  externalId:     string
  rating:         number
  authorName:     string
  location: {
    name:                 string
    niche:                LocationNiche
    tone:                 LocationTone
    google_location_name: string
  }
}

async function autoPublishReview({
  serviceClient,
  gmb,
  reviewId,
  reviewContent,
  externalId,
  rating,
  authorName,
  location,
}: AutoPublishParams): Promise<void> {
  // 1. Gerar resposta com IA
  const { content, tokensUsed } = await generateReviewResponse({
    reviewContent,
    rating,
    authorName,
    niche:        location.niche,
    tone:         location.tone,
    businessName: location.name,
  })

  // 2. Salvar rascunho no banco
  const { data: response } = await serviceClient
    .from('responses')
    .insert({
      review_id:   reviewId,
      content,
      ai_model:    process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
      tokens_used: tokensUsed,
    })
    .select('id')
    .single()

  if (!response) {
    throw new Error('Failed to save auto-generated response')
  }

  // 3. Publicar no Google My Business
  // Reviews de demo (external_id começa com "demo") não existem no GMB — pular chamada real
  // Também pula se gmb não estiver disponível (sem google_location_name)
  const isDemo = externalId.startsWith('demo')
  if (!isDemo && gmb) {
    const reviewName = `${location.google_location_name}/reviews/${externalId}`
    await gmb.replyToReview(reviewName, content)
  }

  // 4. Marcar response e review como publicados
  const now = new Date().toISOString()
  await Promise.all([
    serviceClient
      .from('responses')
      .update({ published_at: now, approved_at: now })
      .eq('id', response.id),
    serviceClient
      .from('reviews')
      .update({ status: 'published', updated_at: now })
      .eq('id', reviewId),
  ])
}
