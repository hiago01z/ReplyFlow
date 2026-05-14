import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { generateReviewResponse } from '@/lib/openai/generateResponse'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/ratelimit'
import { canGenerateAiResponse } from '@/lib/plan-limits'
import { createApprovalToken } from '@/lib/approvalToken'
import { sendWhatsAppApproval } from '@/lib/email/alerts'
import type { AppLocale } from '@/lib/i18n/locale'
import type { Location, Plan } from '@/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyflow-hivi.com'

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
    .select('organization_id, whatsapp, preferred_locale, organization:organizations(id, plan, trial_ends_at, ai_responses_count, ai_responses_month)')
    .eq('id', user.id)
    .single()

  if (!userRecord || userRecord.organization_id !== location.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const orgRecord = userRecord.organization as unknown as {
    id: string;
    plan: Plan;
    trial_ends_at?: string | null;
    ai_responses_count?: number;
    ai_responses_month?: string;
  } | null

  const plan = orgRecord?.plan ?? 'free'
  const orgId = userRecord.organization_id

  // ── Verificar limite de respostas por plano ───────────────────────────────
  const trialEndsAt = orgRecord?.trial_ends_at
  const trialActive = trialEndsAt ? new Date(trialEndsAt).getTime() > Date.now() : false

  // Durante o trial, plano free tem respostas ilimitadas
  const effectivePlan: Plan = (plan === 'free' && trialActive) ? 'pro' : plan // 'pro' = sem limite

  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const storedMonth = orgRecord?.ai_responses_month ?? ''
  let countThisMonth = orgRecord?.ai_responses_count ?? 0

  // Se o mês mudou, resetar o contador (lazy reset)
  if (storedMonth !== currentMonth) {
    countThisMonth = 0
    // Reset async — não bloqueia a verificação
    void serviceClient
      .from('organizations')
      .update({ ai_responses_count: 0, ai_responses_month: currentMonth })
      .eq('id', orgId)
  }

  const { allowed, limit: aiLimit } = canGenerateAiResponse(effectivePlan, countThisMonth)

  if (!allowed) {
    return NextResponse.json({
      error:   'plan_limit',
      message: `Seu plano Free permite ${aiLimit} respostas por mês. Faça upgrade para continuar com respostas ilimitadas.`,
      limit:   aiLimit,
      used:    countThisMonth,
      upgrade: true,
    }, { status: 403 })
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
  } catch (err: unknown) {
    console.error('[generate] OpenAI error:', err)

    // Detectar erros específicos da OpenAI
    const apiErr = err as { status?: number; code?: string; message?: string }

    if (apiErr?.status === 429 || apiErr?.code === 'insufficient_quota') {
      return NextResponse.json(
        {
          error:   'openai_quota',
          message: 'Créditos OpenAI esgotados. Acesse platform.openai.com/billing para adicionar saldo.',
        },
        { status: 402 }
      )
    }

    if (apiErr?.status === 401 || apiErr?.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'openai_auth', message: 'Chave da OpenAI inválida. Verifique OPENAI_API_KEY.' },
        { status: 502 }
      )
    }

    return NextResponse.json(
      { error: 'AI generation failed', message: apiErr?.message ?? 'Erro desconhecido na IA.' },
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
        ai_model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
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
        ai_model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
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

  // ── Incrementar contador de respostas IA (planos com limite) ─────────────
  if (aiLimit !== null) {
    void serviceClient
      .from('organizations')
      .update({
        ai_responses_count: countThisMonth + 1,
        ai_responses_month: currentMonth,
      })
      .eq('id', orgId)
  }

  // ── WhatsApp 1-click approval (Pro/Agency) ────────────────────────────────
  // Only when: plan is pro/agency, user has WhatsApp, auto_publish is OFF
  const userPhone = (userRecord as unknown as { whatsapp?: string })?.whatsapp

  if (
    (plan === 'pro' || plan === 'agency') &&
    userPhone &&
    !location.auto_publish
  ) {
    try {
      const token      = createApprovalToken(id, response.id)
      const approveUrl = `${APP_URL}/api/reviews/${id}/approve?token=${token}`
      const dashUrl    = `${APP_URL}/reviews?highlight=${id}`

      await sendWhatsAppApproval({
        phone:         userPhone,
        businessName:  location.name,
        authorName:    review.author_name ?? 'Alguém',
        rating:        review.rating ?? 3,
        responseDraft: content,
        approveUrl,
        dashboardUrl:  dashUrl,
        locale:        ((userRecord as unknown as { preferred_locale?: string })?.preferred_locale ?? 'pt') as AppLocale,
      })
    } catch (err) {
      // Non-fatal: WhatsApp failure must not break the generate response
      console.error('[generate] WhatsApp approval send error:', err)
    }
  }

  return NextResponse.json({ response })
}
