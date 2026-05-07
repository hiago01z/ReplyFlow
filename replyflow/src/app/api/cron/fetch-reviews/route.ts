import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { GoogleMyBusinessClient } from '@/lib/google/myBusiness'
import { generateReviewResponse } from '@/lib/openai/generateResponse'
import { sendNegativeReviewAlert } from '@/lib/email/alerts'
import type { LocationNiche, LocationTone } from '@/types'

// ─── Proteção de segurança ────────────────────────────────────────────────────
// Chamado pelo cron-job.org a cada 30 minutos
// Aceita autenticação por header OU query param (compatível com plano free do cron-job.org)
//   Header:    Authorization: Bearer CRON_SECRET
//   Query:     ?secret=CRON_SECRET

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

  // Buscar locais ativos com Google conectado
  const { data: locations, error } = await serviceClient
    .from('locations')
    .select('*, organization:organizations(id, plan)')
    .eq('active', true)
    .not('google_access_token', 'is', null)
    .not('google_location_name', 'is', null)

  if (error || !locations) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }

  const results = {
    processed:      0,
    newReviews:     0,
    autoPublished:  0,
    alertsSent:     0,
    errors:         0,
  }

  for (const location of locations) {
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
            .select('email, whatsapp')
            .eq('organization_id', location.organization_id)
            .eq('role', 'owner')
            .single()

          if (orgUser?.email) {
            await sendNegativeReviewAlert({
              to:           orgUser.email,
              businessName: location.name,
              authorName:   gmbReview.reviewer.displayName,
              rating,
              content:      gmbReview.comment ?? '',
              reviewId:     inserted.id,
            }).catch(() => null) // nunca quebrar o cron por falha de e-mail

            await serviceClient.from('alerts').insert({
              review_id: inserted.id,
              channel:   'email',
              recipient: orgUser.email,
            })

            results.alertsSent++
          }
        }

        // ── Auto-publicação ───────────────────────────────────────────────────
        // Só executa se:
        //  1. O local tem auto_publish = true
        //  2. O review NÃO é 1 estrela (muito arriscado publicar sem revisão)
        //  3. O review ainda está pendente (não foi respondido manualmente antes)
        if (location.auto_publish && rating >= 2 && inserted.status === 'pending') {
          await autoPublishReview({
            serviceClient,
            gmb,
            reviewId:     inserted.id,
            reviewContent: gmbReview.comment ?? '',
            externalId:   gmbReview.reviewId,
            rating,
            authorName:   gmbReview.reviewer.displayName,
            location: {
              name:              location.name,
              niche:             location.niche as LocationNiche,
              tone:              location.tone as LocationTone,
              google_location_name: location.google_location_name,
            },
          })
          results.autoPublished++
        }
      }

      // Atualizar access_token se foi renovado pela GMB client
      await serviceClient
        .from('locations')
        .update({ google_access_token: location.google_access_token })
        .eq('id', location.id)

      results.processed++
    } catch (err) {
      console.error(`[cron] error processing location ${location.id}:`, err)
      results.errors++
    }
  }

  return NextResponse.json({
    success:            true,
    locationsProcessed: results.processed,
    newReviews:         results.newReviews,
    autoPublished:      results.autoPublished,
    alertsSent:         results.alertsSent,
    errors:             results.errors,
    timestamp:          new Date().toISOString(),
  })
}

// ─── Helper: gera resposta com IA e publica no GMB ───────────────────────────

interface AutoPublishParams {
  serviceClient:  ReturnType<typeof createServiceClient>
  gmb:            GoogleMyBusinessClient
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
      review_id:  reviewId,
      content,
      ai_model:   'gpt-4o-mini',
      tokens_used: tokensUsed,
    })
    .select('id')
    .single()

  if (!response) {
    throw new Error('Failed to save auto-generated response')
  }

  // 3. Publicar no Google My Business
  const reviewName = `${location.google_location_name}/reviews/${externalId}`
  await gmb.replyToReview(reviewName, content)

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
