import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { GoogleMyBusinessClient } from '@/lib/google/myBusiness'
import { generateReviewResponse } from '@/lib/openai/generateResponse'
import { sendNegativeReviewAlert, sendWhatsAppAlert } from '@/lib/email/alerts'
import type { LocationNiche, LocationTone } from '@/types'

// ─── Proteção de segurança ────────────────────────────────────────────────────
// Chamado pelo cron-job.org a cada 30 minutos
// Aceita autenticação por header OU query param (compatível com plano free do cron-job.org)
//   Header:    Authorization: Bearer CRON_SECRET
//   Query:     ?secret=CRON_SECRET

// Allow up to 5 min on Vercel Pro / 60s on Hobby (default is 10s which is too short)
export const maxDuration = 300

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const querySecret = searchParams.get('secret')

  const validHeader = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const validQuery  = querySecret === process.env.CRON_SECRET

  if (!validHeader && !validQuery) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // ── Helper: delay aleatório de 5-20 minutos para parecer natural ────────────
  function randomDelayMs(): number {
    const minMs = 5  * 60 * 1000
    const maxMs = 20 * 60 * 1000
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  }

  const results = {
    processed:      0,
    newReviews:     0,
    scheduled:      0,
    autoPublished:  0,
    alertsSent:     0,
    errors:         0,
  }

  // ── PASS 1: Buscar novas reviews do GMB ──────────────────────────────────────
  // Apenas locais com google_location_name configurado (necessário para a API GMB)
  const { data: gmbLocations, error: gmbError } = await serviceClient
    .from('locations')
    .select('*, organization:organizations(id, plan, subscription_status, alert_email)')
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
          const { data: orgUser } = await serviceClient
            .from('users')
            .select('email, whatsapp, email_alerts')
            .eq('organization_id', location.organization_id)
            .eq('role', 'owner')
            .single()

          const org = location.organization as unknown as {
            plan: string; subscription_status: string; alert_email: string | null;
          } | null

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

  // ── PASS 2: Publicar reviews agendados ───────────────────────────────────────
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

  return NextResponse.json({
    success:            true,
    locationsProcessed: results.processed,
    newReviews:         results.newReviews,
    scheduled:          results.scheduled,
    autoPublished:      results.autoPublished,
    alertsSent:         results.alertsSent,
    errors:             results.errors,
    timestamp:          new Date().toISOString(),
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
