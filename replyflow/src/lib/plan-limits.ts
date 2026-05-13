/**
 * Centraliza todas as regras de limite por plano.
 * Importar em API routes e páginas que precisam enforçar ou exibir limites.
 */

export type Plan = 'free' | 'starter' | 'pro' | 'agency';

export interface PlanLimits {
  /** Locais base incluídos no plano. Extras comprados via add-on R$49/mês. */
  locations: number;
  /** Plataformas por local: Google + TripAdvisor + Facebook. Free=2, demais=3. */
  platforms: number;
  /** Respostas IA por mês. null = ilimitado. */
  aiResponsesPerMonth: number | null;
  /** Clientes da agência. null = N/A. */
  agencyClients: number | null;
  /** Locais por cliente da agência (só para plan=agency). */
  agencyClientLocations: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:    { locations: 1, platforms: 2, aiResponsesPerMonth: 10,   agencyClients: null, agencyClientLocations: 0 },
  starter: { locations: 1, platforms: 3, aiResponsesPerMonth: 100,  agencyClients: null, agencyClientLocations: 0 },
  pro:     { locations: 3, platforms: 3, aiResponsesPerMonth: null,  agencyClients: null, agencyClientLocations: 0 },
  // Agência: 3 locais próprios (mesmo que Pro) + 3 locais por cada cliente no painel
  agency:  { locations: 3, platforms: 3, aiResponsesPerMonth: null,  agencyClients: 10,  agencyClientLocations: 3 },
};

/** Número de plataformas atualmente conectadas em um local. */
export function countConnectedPlatforms(loc: {
  google_access_token:    string | null;
  tripadvisor_connected:  boolean;
  facebook_connected:     boolean;
  reclame_aqui_connected: boolean;
}): number {
  return (loc.google_access_token ? 1 : 0) +
         (loc.tripadvisor_connected ? 1 : 0) +
         (loc.facebook_connected ? 1 : 0) +
         (loc.reclame_aqui_connected ? 1 : 0);
}

/** Verifica se um local pode conectar mais uma plataforma. */
export function canAddPlatform(plan: Plan, loc: Parameters<typeof countConnectedPlatforms>[0]): boolean {
  return countConnectedPlatforms(loc) < PLAN_LIMITS[plan].platforms;
}

/** Limite efetivo de locais = base do plano + extras comprados. */
export function getEffectiveLocationLimit(plan: Plan, extraLocations: number): number {
  return PLAN_LIMITS[plan].locations + extraLocations;
}

/** Verifica se a org pode criar mais um local. */
export function canAddLocation(plan: Plan, currentCount: number, extraLocations: number): boolean {
  return currentCount < getEffectiveLocationLimit(plan, extraLocations);
}

/** Verifica se a org pode gerar mais uma resposta IA neste mês. */
export function canGenerateAiResponse(
  plan: Plan,
  countThisMonth: number,
): { allowed: boolean; limit: number | null; remaining: number | null } {
  const limit = PLAN_LIMITS[plan].aiResponsesPerMonth;
  if (limit === null) return { allowed: true, limit: null, remaining: null };
  return {
    allowed:   countThisMonth < limit,
    limit,
    remaining: Math.max(0, limit - countThisMonth),
  };
}

/** Verifica se a agência pode adicionar mais um cliente. */
export function canAddAgencyClient(currentClientCount: number): boolean {
  const limit = PLAN_LIMITS.agency.agencyClients!;
  return currentClientCount < limit;
}

/** Verifica se um cliente da agência pode ter mais um local (base 3 + extras comprados). */
export function canAddClientLocation(currentCount: number, extraLocations: number = 0): boolean {
  return currentCount < PLAN_LIMITS.agency.agencyClientLocations + extraLocations;
}
