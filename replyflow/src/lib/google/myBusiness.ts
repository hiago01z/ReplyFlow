/**
 * Google My Business / Business Profile API wrapper
 *
 * Uses the Business Profile APIs (v1) — the v4 legacy API was sunset in 2023.
 *
 * API base URLs:
 *   Reviews  → https://mybusinessreviews.googleapis.com/v1
 *   Accounts → https://mybusinessaccountmanagement.googleapis.com/v1
 *   Info     → https://mybusinessbusinessinformation.googleapis.com/v1
 */

const REVIEWS_BASE  = "https://mybusinessreviews.googleapis.com/v1";
const ACCOUNTS_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";
const INFO_BASE     = "https://mybusinessbusinessinformation.googleapis.com/v1";

export interface GmbReview {
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
  name: string; // full resource name e.g. accounts/123/locations/456/reviews/789
}

interface ListReviewsResponse {
  reviews?: GmbReview[];
  nextPageToken?: string;
  totalReviewCount?: number;
}

const STAR_TO_NUMBER: Record<GmbReview["starRating"], number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export class GoogleMyBusinessClient {
  private _accessToken: string;
  private refreshToken: string | null;
  private locationName: string; // e.g. "accounts/123/locations/456"

  constructor(opts: {
    accessToken: string;
    refreshToken: string | null;
    locationName: string;
  }) {
    this._accessToken = opts.accessToken;
    this.refreshToken = opts.refreshToken;
    this.locationName = opts.locationName;
  }

  /**
   * Returns the current access token (possibly refreshed).
   * Use this to persist the token back to the DB after cron operations.
   */
  get currentAccessToken(): string {
    return this._accessToken;
  }

  /**
   * Busca todos os reviews do local (com e sem resposta).
   * Usado pelo cron/sync para ter visão completa do estado atual.
   * Faz paginação automática.
   */
  async listAllReviews(): Promise<GmbReview[]> {
    const all: GmbReview[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${REVIEWS_BASE}/${this.locationName}/reviews`);
      url.searchParams.set("pageSize", "50");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await this.doFetch(url.toString());
      if (!res.ok) throw new Error(`GMB list reviews failed: ${res.status} ${await res.text()}`);

      const data: ListReviewsResponse = await res.json();
      all.push(...(data.reviews ?? []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    return all;
  }

  /**
   * Busca todos os reviews não respondidos do local.
   * @deprecated Use listAllReviews() para visibilidade completa.
   * Faz paginação automática.
   */
  async listUnansweredReviews(): Promise<GmbReview[]> {
    const reviews = await this.listAllReviews();
    return reviews.filter((r) => !r.reviewReply);
  }

  /**
   * Publica ou atualiza resposta para um review.
   * @param reviewName - full resource name e.g. "accounts/123/locations/456/reviews/789"
   * @param comment    - texto da resposta
   */
  async replyToReview(reviewName: string, comment: string): Promise<void> {
    const url = `${REVIEWS_BASE}/${reviewName}/reply`;
    const res = await this.doFetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GMB reply failed (${res.status}): ${err}`);
    }
  }

  /**
   * Retorna o Google User ID (sub) via userinfo — nunca tem quota limitada.
   * Usado para construir o account path sem precisar chamar accounts.list.
   */
  async getGoogleUserId(): Promise<string> {
    const res = await this.doFetch("https://www.googleapis.com/oauth2/v3/userinfo");
    if (!res.ok) throw new Error(`userinfo failed: ${res.status}`);
    const data = await res.json() as { sub: string; email?: string };
    return data.sub; // numeric Google account ID
  }

  /**
   * Busca os accounts (empresas) do usuário autenticado.
   * Estratégia: userinfo sub → accounts.list fallback.
   */
  async listAccounts(): Promise<{ name: string; accountName: string }[]> {
    try {
      const sub = await this.getGoogleUserId();
      return [{ name: `accounts/${sub}`, accountName: "Minha Conta" }];
    } catch { /* fallback */ }

    const res = await this.doFetch(`${ACCOUNTS_BASE}/accounts`);
    if (!res.ok) throw new Error(`GMB list accounts failed: ${res.status}`);
    const data = await res.json() as { accounts?: { name: string; accountName: string }[] };
    return data.accounts ?? [];
  }

  /**
   * Lista locais de um account.
   * @param accountName - e.g. "accounts/123456789"
   */
  async listLocations(accountName: string): Promise<{ name: string; title: string }[]> {
    const url = `${INFO_BASE}/${accountName}/locations?readMask=name,title`;
    const res = await this.doFetch(url);
    if (!res.ok) throw new Error(`GMB list locations failed: ${res.status} ${await res.text()}`);
    const data = await res.json() as { locations?: { name: string; title: string }[] };
    return data.locations ?? [];
  }

  /**
   * Busca locais pelo nome do negócio — não precisa de account ID nem de quota do accounts.list.
   * Usa googleLocations:search da Business Information API.
   * @param query - nome do negócio (ex: "Clínica Sorriso")
   */
  async searchLocationsByName(query: string): Promise<{ name: string; title: string; address: string }[]> {
    const url = `${INFO_BASE}/googleLocations:search`;
    const res = await this.doFetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ query, pageSize: 10 }),
    });
    if (!res.ok) throw new Error(`GMB search locations failed: ${res.status} ${await res.text()}`);
    const data = await res.json() as {
      googleLocations?: {
        name: string;
        location?: {
          title?: string;
          storefrontAddress?: { addressLines?: string[]; locality?: string };
        };
      }[];
    };
    return (data.googleLocations ?? []).map((gl) => ({
      name:    gl.name, // "googleLocations/XXXXXXXX" — need to strip prefix for final path
      title:   gl.location?.title ?? gl.name,
      address: [
        ...(gl.location?.storefrontAddress?.addressLines ?? []),
        gl.location?.storefrontAddress?.locality ?? "",
      ].filter(Boolean).join(", "),
    }));
  }

  // Converte starRating string para número
  static starRatingToNumber(rating: GmbReview["starRating"]): number {
    return STAR_TO_NUMBER[rating] ?? 0;
  }

  /**
   * Faz um fetch autenticado.
   * - 401 → renova token e tenta uma vez
   * - 429 → espera Retry-After (ou 10s) e tenta até 3 vezes
   */
  private async doFetch(url: string, init?: RequestInit): Promise<Response> {
    const buildHeaders = () => ({
      Authorization: `Bearer ${this._accessToken}`,
      ...(init?.headers as Record<string, string> ?? {}),
    });

    let res = await globalThis.fetch(url, { ...init, headers: buildHeaders() });

    // 401 — renovar token uma vez
    if (res.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      res = await globalThis.fetch(url, { ...init, headers: buildHeaders() });
    }

    // 429 — rate limit: aguarda e retenta até 3 vezes
    let retries = 0;
    while (res.status === 429 && retries < 3) {
      const retryAfter = parseInt(res.headers.get("Retry-After") ?? "10", 10);
      const waitMs     = (retryAfter || 10) * 1000;
      console.warn(`[GMB] 429 rate limit — waiting ${waitMs}ms before retry ${retries + 1}/3`);
      await new Promise((r) => setTimeout(r, waitMs));
      res = await globalThis.fetch(url, { ...init, headers: buildHeaders() });
      retries++;
    }

    return res;
  }

  /**
   * Renova o access_token usando o refresh_token.
   * Atualiza this._accessToken — use currentAccessToken para persistir.
   */
  private async refreshAccessToken(): Promise<void> {
    const res = await globalThis.fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "refresh_token",
        refresh_token: this.refreshToken!,
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    });

    if (!res.ok) throw new Error("Failed to refresh Google access token");

    const data = await res.json() as { access_token: string };
    this._accessToken = data.access_token;
    console.log("[GMB] access_token refreshed successfully");
  }
}
