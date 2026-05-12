import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWebhook, type WebhookPayload } from '@/lib/webhooks/sendWebhook'
import { z } from 'zod'

const schema = z.object({
  webhookUrl:    z.string().url().max(500),
  webhookSecret: z.string().max(200).optional().nullable(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
  }

  // Verificar plano (Pro/Agency apenas)
  const serviceClient = createServiceClient()
  const { data: userRecord } = await serviceClient
    .from('users')
    .select('organization:organizations(plan)')
    .eq('id', user.id)
    .single()

  const org = userRecord?.organization as unknown as { plan: string } | null
  if (!org || (org.plan !== 'pro' && org.plan !== 'agency')) {
    return NextResponse.json({ error: 'Plano Pro ou Agência necessário' }, { status: 403 })
  }

  const testPayload: WebhookPayload = {
    event:         'review.negative',
    review_id:     'test-00000000-0000-0000-0000-000000000000',
    location_id:   'test-00000000-0000-0000-0000-000000000001',
    business_name: 'Exemplo de Negócio',
    author_name:   'Cliente Teste',
    rating:        2,
    content:       'Este é um payload de teste enviado pelo ReplyFlow para validar sua configuração de webhook.',
    platform:      'google',
    review_url:    `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyflow-hivi.com'}/reviews`,
    timestamp:     new Date().toISOString(),
  }

  try {
    await sendWebhook(
      parsed.data.webhookUrl,
      parsed.data.webhookSecret ?? null,
      testPayload,
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 422 })
  }
}
