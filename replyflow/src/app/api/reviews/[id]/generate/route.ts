import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateReviewResponse } from '@/lib/openai/generateResponse'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/ratelimit'
import { PLAN_LIMITS } from '@/types'
import type { Location, Plan } from '@/types'

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

  // ── Rate limit: 30 gerações por minuto por usuário ────────────────────────
  const rl = await rateLimit(`rl:generate:${user.id}`, 30, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Muitas requisições. Aguarde um momento.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)),
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    )
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
    .select('organization_id, organization:organizations(plan)')
    .eq('id', user.id)
    .single()

  if (!userRecord || userRecord.organization_id !== location.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Verificar limite de respostas por plano ───────────────────────────────
  const plan = (userRecord.organization as unknown as { plan: Plan } | null)?.plan ?? 'free'
  const monthlyLimit = PLAN_LIMITS[plan]?.responsesPerMonth

  if (monthlyLimit !== null && monthlyLimit !== undefined) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Buscar reviews da org criados este mês
    const { data: orgLocations } = await serviceClient
      .from('locations')
      .select('id')
      .eq('organization_id', userRecord.organization_id)

    const locIds = (orgLocations ?? []).map((l) => l.id)

    const { data: monthlyReviews } = await serviceClient
      .from('reviews')
      .select('id')
      .in('location_id', locIds)
      .gte('created_at', startOfMonth.toISOString())

    const reviewIds = (monthlyReviews ?? []).map((r) => r.id)

    let monthlyCount = 0
    if (reviewIds.length > 0) {
      const { count } = await serviceClient
        .from('responses')
        .select('id', { count: 'exact', head: true })
        .in('review_id', reviewIds)
      monthlyCount = count ?? 0
    }

    if (monthlyCount >= monthlyLimit) {
      return NextResponse.json({
        error:   'plan_limit',
        message: `Seu plano Free permite ${monthlyLimit} respostas por mês. Faça upgrade para continuar.`,
        limit:   monthlyLimit,
        used:    monthlyCount,
      }, { status: 403 })
    }
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
