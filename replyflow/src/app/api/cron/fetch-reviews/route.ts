import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { GoogleMyBusinessClient } from '@/lib/google/myBusiness'
import { sendNegativeReviewAlert } from '@/lib/email/alerts'

// Chamado pela Vercel Cron a cada 30 minutos
// Protegido por CRON_SECRET
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

  const results = { processed: 0, newReviews: 0, errors: 0 }

  for (const location of locations) {
    try {
      const gmb = new GoogleMyBusinessClient({
        accessToken: location.google_access_token,
        refreshToken: location.google_refresh_token,
        locationName: location.google_location_name,
      })

      const gmbReviews = await gmb.listUnansweredReviews()

      for (const gmbReview of gmbReviews) {
        const rating = GoogleMyBusinessClient.starRatingToNumber(gmbReview.starRating)

        // Upsert — ignora se já existe (pelo external_id)
        const { data: inserted, error: insertError } = await serviceClient
          .from('reviews')
          .upsert(
            {
              location_id: location.id,
              platform: 'google',
              external_id: gmbReview.reviewId,
              author_name: gmbReview.reviewer.displayName,
              author_photo_url: gmbReview.reviewer.profilePhotoUrl ?? null,
              rating,
              content: gmbReview.comment ?? null,
              platform_published_at: gmbReview.createTime,
              status: 'pending',
            },
            { onConflict: 'platform,external_id', ignoreDuplicates: true }
          )
          .select('id, rating')
          .single()

        if (insertError || !inserted) continue

        results.newReviews++

        // Enviar alerta se review negativo (1-2 estrelas)
        if (rating <= 2) {
          const { data: orgUser } = await serviceClient
            .from('users')
            .select('email, whatsapp')
            .eq('organization_id', location.organization_id)
            .eq('role', 'owner')
            .single()

          if (orgUser?.email) {
            await sendNegativeReviewAlert({
              to: orgUser.email,
              businessName: location.name,
              authorName: gmbReview.reviewer.displayName,
              rating,
              content: gmbReview.comment ?? '',
              reviewId: inserted.id,
            }).catch(() => null) // não quebrar o cron por falha de e-mail
          }

          // Registrar alerta
          await serviceClient.from('alerts').insert({
            review_id: inserted.id,
            channel: 'email',
            recipient: orgUser?.email ?? null,
          })
        }
      }

      // Atualizar access_token se foi renovado
      await serviceClient
        .from('locations')
        .update({ google_access_token: location.google_access_token })
        .eq('id', location.id)

      results.processed++
    } catch {
      results.errors++
    }
  }

  return NextResponse.json({
    success: true,
    locationsProcessed: results.processed,
    newReviews: results.newReviews,
    errors: results.errors,
    timestamp: new Date().toISOString(),
  })
}
