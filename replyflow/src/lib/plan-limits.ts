/**
 * Centraliza todas as regras de limite por plano.
 * Importar em API routes e páginas que precisam enforçar ou exibir limites.
 */

export type Plan = 'free' | 'starter' | 'pro' | 'agency';

export interface PlanLimits {
  /** Locais base incluídos no plano. Extras comprados via add-on R$49/mês. */
  locations: number;
  /** Respostas IA por mês. null = ilimitado. */
  aiResponsesPerMonth: number | null;
  /** Clientes da agência. null = N/A. */
  agencyClients: number | null;
  /** Locais por cliente da agência (só para plan=agency). */
  agencyClientLocations: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free:    { locations: 1, aiResponsesPerMonth: 10,   agencyClients: null, agencyClientLocations: 0 },
  starter: { locations: 1, aiResponsesPerMonth: 50,   agencyClients: null, agencyClientLocations: 0 },
  pro:     { locations: 3, aiResponsesPerMonth: null,  agencyClients: null, agencyClientLocations: 0 },
  // Agência: 3 locais próprios (mesmo que Pro) + 3 locais por cada cliente no painel
  agency:  { locations: 3, aiResponsesPerMonth: null,  agencyClients: 10,  agencyClientLocations: 3 },
};

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
