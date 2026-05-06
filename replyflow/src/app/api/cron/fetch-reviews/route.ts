import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Este endpoint é chamado pelo cron da Vercel a cada 30 minutos
// Protegido por CRON_SECRET para evitar chamadas não autorizadas
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createServiceClient()

  // Buscar todos os locais ativos com Google conectado
  const { data: locations, error } = await serviceClient
    .from('locations')
    .select('*')
    .eq('active', true)
    .not('google_location_name', 'is', null)

  if (error || !locations) {
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }

  const results = { processed: 0, errors: 0 }

  for (const location of locations) {
    try {
      // TODO: Implementar chamada real à Google My Business API
      // const reviews = await fetchGoogleReviews(location)
      // await saveNewReviews(serviceClient, location.id, reviews)

      // Por ora, apenas registra que o cron rodou
      results.processed++
    } catch {
      results.errors++
    }
  }

  return NextResponse.json({
    success: true,
    locationsProcessed: results.processed,
    errors: results.errors,
    timestamp: new Date().toISOString(),
  })
}
