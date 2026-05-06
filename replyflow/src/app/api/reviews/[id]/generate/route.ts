import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateReviewResponse } from '@/lib/openai/generateResponse'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Autenticar usuário
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // Buscar review com dados do local
  const { data: review, error: reviewError } = await serviceClient
    .from('reviews')
    .select('*, location:locations(*)')
    .eq('id', id)
    .single()

  if (reviewError || !review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  // Verificar que o usuário tem acesso a este review
  const { data: userRecord } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userRecord || userRecord.organization_id !== review.location.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Gerar resposta
  const { content, tokensUsed } = await generateReviewResponse({
    reviewContent: review.content ?? '',
    rating: review.rating ?? 3,
    authorName: review.author_name,
    niche: review.location.niche,
    tone: review.location.tone,
    businessName: review.location.name,
  })

  // Salvar rascunho
  const { data: response, error: saveError } = await serviceClient
    .from('responses')
    .upsert({
      review_id: id,
      content,
      ai_model: 'gpt-4o-mini',
      tokens_used: tokensUsed,
    }, { onConflict: 'review_id' })
    .select()
    .single()

  if (saveError) {
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
  }

  // Atualizar status do review para draft
  await serviceClient
    .from('reviews')
    .update({ status: 'draft' })
    .eq('id', id)

  return NextResponse.json({ response })
}
