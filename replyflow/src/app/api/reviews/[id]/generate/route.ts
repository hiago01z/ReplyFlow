import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateReviewResponse } from '@/lib/openai/generateResponse'
import { createClient } from '@/lib/supabase/server'
import type { Location } from '@/types'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // ── Autenticação ─────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // ── Buscar review com dados do local ─────────────────────────────────────
  const { data: review, error: reviewError } = await serviceClient
    .from('reviews')
    .select('*, location:locations(*)')
    .eq('id', id)
    .single()

  if (reviewError || !review) {
    console.error('[generate] review not found:', reviewError)
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  // O Supabase retorna o join como objeto — garantir tipagem correta
  const location = review.location as unknown as Location | null
  if (!location) {
    return NextResponse.json({ error: 'Location data missing' }, { status: 500 })
  }

  // ── Verificar acesso: usuário pertence à organização do review ────────────
  const { data: userRecord } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userRecord || userRecord.organization_id !== location.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Gerar resposta com IA ─────────────────────────────────────────────────
  let content: string
  let tokensUsed: number

  try {
    const result = await generateReviewResponse({
      reviewContent: review.content ?? '',
      rating: review.rating ?? 3,
      authorName: review.author_name,
      niche: location.niche,
      tone: location.tone,
      businessName: location.name,
    })
    content = result.content
    tokensUsed = result.tokensUsed
  } catch (err) {
    console.error('[generate] OpenAI error:', err)
    return NextResponse.json(
      { error: 'AI generation failed. Check OPENAI_API_KEY.' },
      { status: 502 }
    )
  }

  // ── Salvar rascunho (insert ou update — sem depender de UNIQUE constraint) ─
  // Verifica se já existe um response para este review
  const { data: existing } = await serviceClient
    .from('responses')
    .select('id')
    .eq('review_id', id)
    .maybeSingle()

  let response
  let saveError

  if (existing?.id) {
    // Atualiza o rascunho existente
    const { data, error } = await serviceClient
      .from('responses')
      .update({
        content,
        ai_model: 'gpt-4o-mini',
        tokens_used: tokensUsed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    response = data
    saveError = error
  } else {
    // Insere novo rascunho
    const { data, error } = await serviceClient
      .from('responses')
      .insert({
        review_id: id,
        content,
        ai_model: 'gpt-4o-mini',
        tokens_used: tokensUsed,
      })
      .select()
      .single()
    response = data
    saveError = error
  }

  if (saveError || !response) {
    console.error('[generate] save error:', saveError)
    return NextResponse.json(
      { error: 'Failed to save response', detail: saveError?.message },
      { status: 500 }
    )
  }

  // ── Atualizar status do review para draft ─────────────────────────────────
  await serviceClient
    .from('reviews')
    .update({ status: 'draft', updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ response })
}
