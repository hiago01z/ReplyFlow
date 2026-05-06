import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
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

  // TODO: Publicar no Google My Business via API
  // const gmb = new GoogleMyBusinessClient(review.location.google_access_token)
  // await gmb.replyToReview(review.external_id, parsed.data.responseContent)

  const now = new Date().toISOString()

  // Atualizar response como publicada
  await serviceClient
    .from('responses')
    .update({ published_at: now, approved_at: now, approved_by: user.id })
    .eq('review_id', id)

  // Atualizar status do review
  await serviceClient
    .from('reviews')
    .update({ status: 'published' })
    .eq('id', id)

  return NextResponse.json({ success: true })
}
