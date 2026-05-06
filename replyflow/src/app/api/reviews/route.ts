import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/reviews — Lista reviews da organização do usuário autenticado
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const rating = searchParams.get('rating')
  const locationId = searchParams.get('locationId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = 20

  const serviceClient = createServiceClient()

  // Buscar organization_id do usuário
  const { data: userRecord } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userRecord) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Buscar location IDs da organização
  let locationsQuery = serviceClient
    .from('locations')
    .select('id')
    .eq('organization_id', userRecord.organization_id)

  if (locationId) {
    locationsQuery = locationsQuery.eq('id', locationId)
  }

  const { data: locations } = await locationsQuery
  const locationIds = locations?.map((l) => l.id) ?? []

  if (locationIds.length === 0) {
    return NextResponse.json({ reviews: [], total: 0 })
  }

  // Buscar reviews
  let query = serviceClient
    .from('reviews')
    .select('*, location:locations(id, name, niche), response:responses(*)', { count: 'exact' })
    .in('location_id', locationIds)
    .order('platform_published_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (status) query = query.eq('status', status)
  if (rating) query = query.eq('rating', parseInt(rating))

  const { data: reviews, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }

  return NextResponse.json({ reviews, total: count ?? 0, page, pageSize })
}
