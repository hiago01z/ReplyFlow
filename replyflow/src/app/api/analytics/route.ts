import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/analytics?days=30
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const days       = Math.min(Number(searchParams.get('days') ?? '30'), 90)
  const filterLoc  = searchParams.get('locationId') ?? ''

  const serviceClient = createServiceClient()

  // Get user's org
  const { data: userRecord } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!userRecord?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }

  // Get location IDs
  const { data: locations } = await serviceClient
    .from('locations')
    .select('id, name')
    .eq('organization_id', userRecord.organization_id)
    .eq('active', true)

  const allLocationIds = (locations ?? []).map((l) => l.id)
  // Apply optional per-location filter (must belong to org)
  const locationIds = filterLoc && allLocationIds.includes(filterLoc)
    ? [filterLoc]
    : allLocationIds

  if (locationIds.length === 0) {
    return NextResponse.json({
      reviewsPerDay:    [],
      ratingBreakdown:  [],
      statusBreakdown:  [],
      topLocations:     [],
      totals: { total: 0, published: 0, pending: 0, avgRating: 0, replyRate: 0 },
      locations:        [],
    })
  }

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString()

  // Fetch all reviews in range
  const { data: reviews } = await serviceClient
    .from('reviews')
    .select('id, rating, status, platform_published_at, created_at, location_id')
    .in('location_id', locationIds)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true })

  const allReviews = reviews ?? []

  // ─── Reviews per day ────────────────────────────────────────────────────────
  const dayMap: Record<string, { date: string; total: number; published: number }> = {}

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = { date: key, total: 0, published: 0 }
  }

  for (const r of allReviews) {
    const key = r.created_at.slice(0, 10)
    if (dayMap[key]) {
      dayMap[key].total++
      if (r.status === 'published') dayMap[key].published++
    }
  }

  const reviewsPerDay = Object.values(dayMap)

  // ─── Rating breakdown ────────────────────────────────────────────────────────
  const ratingCount: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const r of allReviews) {
    const rt = r.rating ?? 0
    if (rt >= 1 && rt <= 5) ratingCount[rt]++
  }
  const ratingBreakdown = [1, 2, 3, 4, 5].map((stars) => ({
    stars,
    count: ratingCount[stars],
    label: `${stars}★`,
  }))

  // ─── Status breakdown ────────────────────────────────────────────────────────
  const statusCount: Record<string, number> = {
    pending: 0, draft: 0, approved: 0, published: 0, ignored: 0,
  }
  for (const r of allReviews) {
    if (statusCount[r.status] !== undefined) statusCount[r.status]++
  }
  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente', draft: 'Rascunho', approved: 'Aprovado',
    published: 'Publicado', ignored: 'Ignorado',
  }
  const statusBreakdown = Object.entries(statusCount)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ status, count, label: STATUS_LABELS[status] ?? status }))

  // ─── Top locations ───────────────────────────────────────────────────────────
  const locMap: Record<string, { id: string; name: string; total: number; published: number }> = {}
  for (const loc of locations ?? []) {
    locMap[loc.id] = { id: loc.id, name: loc.name, total: 0, published: 0 }
  }
  for (const r of allReviews) {
    if (locMap[r.location_id]) {
      locMap[r.location_id].total++
      if (r.status === 'published') locMap[r.location_id].published++
    }
  }
  const topLocations = Object.values(locMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // ─── Totals ──────────────────────────────────────────────────────────────────
  const total = allReviews.length
  const published = allReviews.filter((r) => r.status === 'published').length
  const pending   = allReviews.filter((r) => r.status === 'pending').length
  const ratings   = allReviews.filter((r) => r.rating !== null).map((r) => r.rating as number)
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : 0
  const replyRate = total > 0 ? Math.round((published / total) * 100) : 0

  // ─── Rating evolution (avg rating per period) ─────────────────────────────
  // Group by week when days > 14, by day otherwise — same buckets as reviewsPerDay
  const bucket = days > 14 ? 'week' : 'day'

  const ratingEvolution: { date: string; avgRating: number; count: number }[] = []

  if (bucket === 'day') {
    // Reuse dayMap keys; compute avg rating per day
    const dayRatings: Record<string, number[]> = {}
    for (const key of Object.keys(dayMap)) dayRatings[key] = []
    for (const r of allReviews) {
      const key = r.created_at.slice(0, 10)
      if (dayRatings[key] && r.rating !== null) dayRatings[key].push(r.rating as number)
    }
    for (const key of Object.keys(dayMap).sort()) {
      const arr = dayRatings[key]
      ratingEvolution.push({
        date:      key,
        avgRating: arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0,
        count:     arr.length,
      })
    }
  } else {
    // Weekly buckets — Monday as anchor
    const weekMap: Record<string, number[]> = {}
    for (const r of allReviews) {
      const d = new Date(r.created_at)
      const day = d.getDay() // 0=Sun
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((day + 6) % 7))
      const key = monday.toISOString().slice(0, 10)
      if (!weekMap[key]) weekMap[key] = []
      if (r.rating !== null) weekMap[key].push(r.rating as number)
    }
    // Fill in all weeks in range (same as reviewsPerDay week logic)
    const weeksSeen = new Set<string>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const day = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((day + 6) % 7))
      const key = monday.toISOString().slice(0, 10)
      weeksSeen.add(key)
    }
    for (const key of [...weeksSeen].sort()) {
      const arr = weekMap[key] ?? []
      ratingEvolution.push({
        date:      key,
        avgRating: arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0,
        count:     arr.length,
      })
    }
  }

  return NextResponse.json({
    reviewsPerDay,
    ratingBreakdown,
    statusBreakdown,
    topLocations,
    ratingEvolution,
    totals: { total, published, pending, avgRating, replyRate },
    locations: (locations ?? []).map((l) => ({ id: l.id, name: l.name })),
  })
}
