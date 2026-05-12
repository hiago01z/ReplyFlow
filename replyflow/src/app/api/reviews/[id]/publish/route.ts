import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { GoogleMyBusinessClient } from '@/lib/google/myBusiness'
import { rateLimit } from '@/lib/ratelimit'
import { z } from 'zod'

const publishSchema = z.object({
  responseContent: z.string().min(10).max(4000),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Rate limit: 60 publicações por minuto por usuário ─────────────────────
  const rl = await rateLimit(`rl:publish:${user.id}`, 60, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Muitas requisições. Aguarde um momento.' },
      { status: 429 }
    )
  }

  const body = await request.json()
  const parsed = publishSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Buscar review e verificar acesso
  const { data: review } = await serviceClient
    .from('reviews')
    .select('*, location:locations(*)')
    .eq('id', id)
    .single()

  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const { data: userRecord } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userRecord || userRecord.organization_id !== review.location.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Publicar no Google My Business
  if (
    review.platform === 'google' &&
    review.external_id &&
    review.location.google_access_token &&
    review.location.google_location_name
  ) {
    const gmb = new GoogleMyBusinessClient({
      accessToken: review.location.google_access_token,
      refreshToken: review.location.google_refresh_token ?? null,
      locationName: review.location.google_location_name,
    })

    const reviewName = `${review.location.google_location_name}/reviews/${review.external_id}`
    await gmb.replyToReview(reviewName, parsed.data.responseContent)
  }

  const now = new Date().toISOString()

  // Upsert da resposta: salva content (editado pelo usuário) e marca como publicada.
  // Usa upsert para cobrir dois casos:
  //  1. Resposta gerada pela IA → existe registro → atualiza content + timestamps
  //  2. Resposta digitada manualmente → não existe registro → insere
  await serviceClient
    .from('responses')
    .upsert(
      {
        review_id:    id,
        content:      parsed.data.responseContent,
        published_at: now,
        approved_at:  now,
        approved_by:  user.id,
      },
      { onConflict: 'review_id', ignoreDuplicates: false }
    )

  // Atualizar status do review
  await serviceClient
    .from('reviews')
    .update({ status: 'published' })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
