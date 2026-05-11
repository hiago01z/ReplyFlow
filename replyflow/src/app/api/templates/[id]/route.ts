import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateSchema = z.object({
  title:      z.string().min(1).max(100).optional(),
  content:    z.string().min(10).max(2000).optional(),
  niche:      z.string().max(50).nullable().optional(),
  min_rating: z.number().int().min(1).max(5).optional(),
  max_rating: z.number().int().min(1).max(5).optional(),
})

async function getOrgId(userId: string) {
  const serviceClient = createServiceClient()
  const { data } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single()
  return data?.organization_id ?? null
}

/** PUT /api/templates/[id] — update a custom template */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const body   = await request.json().catch(() => ({}))
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', issues: parsed.error.issues }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data, error } = await serviceClient
    .from('response_templates')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', orgId)
    .select('id, title, content, niche, min_rating, max_rating')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  return NextResponse.json(data)
}

/** DELETE /api/templates/[id] — delete a custom template */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orgId = await getOrgId(user.id)
  if (!orgId) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('response_templates')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
