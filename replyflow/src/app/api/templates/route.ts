import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getDefaultTemplates } from '@/lib/templates/defaults'
import { z } from 'zod'

const createSchema = z.object({
  title:      z.string().min(1).max(100),
  content:    z.string().min(10).max(2000),
  niche:      z.string().max(50).nullable().optional(),
  min_rating: z.number().int().min(1).max(5).default(1),
  max_rating: z.number().int().min(1).max(5).default(5),
})

/** GET /api/templates?niche=restaurante&rating=5
 * Returns built-in templates (filtered) + org's custom templates.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const niche  = searchParams.get('niche')  ?? 'outro'
  const rating = parseInt(searchParams.get('rating') ?? '3', 10)

  const serviceClient = createServiceClient()
  const { data: userRecord } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Custom templates from DB
  const { data: custom } = await serviceClient
    .from('response_templates')
    .select('id, title, content, niche, min_rating, max_rating')
    .eq('organization_id', userRecord.organization_id)
    .or(`niche.is.null,niche.eq.${niche}`)
    .lte('min_rating', rating)
    .gte('max_rating', rating)
    .order('created_at', { ascending: false })

  // Built-in templates filtered by niche + rating
  const defaults = getDefaultTemplates(niche, rating).map((t) => ({
    id:         t.id,
    title:      t.title,
    content:    t.content,
    niche:      t.niches[0] ?? null,
    min_rating: t.minRating,
    max_rating: t.maxRating,
    builtin:    true,
  }))

  return NextResponse.json({
    builtin: defaults,
    custom:  (custom ?? []).map((t) => ({ ...t, builtin: false })),
  })
}

/** POST /api/templates — create a custom template */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body   = await request.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: userRecord } = await serviceClient
    .from('users')
    .select('organization_id, organization:organizations(plan)')
    .eq('id', user.id)
    .single()

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const plan = (userRecord.organization as unknown as { plan: string } | null)?.plan ?? 'free'
  if (plan === 'free') {
    return NextResponse.json({ error: 'Upgrade required', message: 'Modelos personalizados estão disponíveis nos planos pagos.' }, { status: 403 })
  }

  const { data, error } = await serviceClient
    .from('response_templates')
    .insert({
      organization_id: userRecord.organization_id,
      ...parsed.data,
    })
    .select('id, title, content, niche, min_rating, max_rating')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
