export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Plan = 'free' | 'starter' | 'pro' | 'agency'
export type ReviewStatus = 'pending' | 'draft' | 'approved' | 'published' | 'ignored'
export type LocationNiche = 'clinica' | 'restaurante' | 'academia' | 'petshop' | 'barbearia' | 'outro'
export type LocationTone = 'formal' | 'amigavel' | 'descontraido'
export type AlertChannel = 'whatsapp' | 'email'
export type ReviewPlatform = 'google' | 'tripadvisor' | 'facebook' | 'reclame_aqui' | 'booking' | 'ifood'

export interface Organization {
  id: string
  name: string
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  subscription_status: string | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string
  role: 'owner' | 'member'
  name: string | null
  email: string | null
  whatsapp: string | null
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  organization_id: string
  name: string
  google_place_id: string | null
  google_account_id: string | null
  google_location_name: string | null
  google_access_token: string | null
  google_refresh_token: string | null
  niche: LocationNiche
  tone: LocationTone
  auto_publish: boolean
  auto_publish_min_rating: number
  active: boolean
  is_public: boolean
  public_slug: string | null
  // TripAdvisor (manual import)
  tripadvisor_url: string | null
  tripadvisor_connected: boolean
  // Reclame Aqui (manual import)
  reclame_aqui_url: string | null
  reclame_aqui_connected: boolean
  // Booking.com (manual import)
  booking_url: string | null
  booking_connected: boolean
  // iFood (manual import)
  ifood_url: string | null
  ifood_connected: boolean
  // Facebook (Graph API OAuth)
  facebook_page_id: string | null
  facebook_page_name: string | null
  facebook_access_token: string | null
  facebook_connected: boolean
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  location_id: string
  platform: ReviewPlatform
  external_id: string
  author_name: string | null
  author_photo_url: string | null
  rating: number | null
  content: string | null
  platform_published_at: string | null
  publish_after: string | null
  status: ReviewStatus
  created_at: string
  updated_at: string
  // Relations (joined)
  location?: Location
  response?: Response
}

export interface Response {
  id: string
  review_id: string
  content: string
  ai_model: string
  tokens_used: number | null
  approved_by: string | null
  approved_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  review_id: string
  channel: AlertChannel
  recipient: string | null
  sent_at: string
}

// Limites por plano (espelho de src/lib/plan-limits.ts — manter sincronizado)
export const PLAN_LIMITS: Record<Plan, { locations: number; platforms: number; responsesPerMonth: number | null }> = {
  free:    { locations: 1, platforms: 2, responsesPerMonth: 10 },
  starter: { locations: 1, platforms: 3, responsesPerMonth: 100 },
  pro:     { locations: 3, platforms: 3, responsesPerMonth: null },
  agency:  { locations: 3, platforms: 3, responsesPerMonth: null },
}
