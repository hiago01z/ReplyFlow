/**
 * Google My Business API wrapper
 * Documentação: https://developers.google.com/my-business/reference/rest
 *
 * Endpoints utilizados:
 * - accounts.locations.reviews.list
 * - accounts.locations.reviews.updateReply
 */

const GMB_BASE = "https://mybusiness.googleapis.com/v4";

export interface GmbReview {
  reviewId: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
  name: string; // full resource name
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
  private accessToken: string;
  private refreshToken: string | null;
  private locationName: string; // e.g. "accounts/123/locations/456"

  constructor(opts: {
    accessToken: string;
    refreshToken: string | null;
    locationName: string;
  }) {
    this.accessToken = opts.accessToken;
    this.refreshToken = opts.refreshToken;
    this.locationName = opts.locationName;
  }

  /**
   * Busca todos os reviews não respondidos do local.
   * Faz paginação automática.
   */
  async listUnansweredReviews(): Promise<GmbReview[]> {
    const all: GmbReview[] = [];
    let pageToken: string | undefined;

    do {
      const url = new URL(`${GMB_BASE}/${this.locationName}/reviews`);
      url.searchParams.set("pageSize", "50");
      if (pageToken) url.searchParams.set("pageToken", pageToken);

      const res = await this.fetch(url.toString());
      if (!res.ok) throw new Error(`GMB list reviews failed: ${res.status}`);

      const data: ListReviewsResponse = await res.json();
      const reviews = data.reviews ?? [];

      // Filtrar apenas sem resposta
      for (const r of reviews) {
        if (!r.reviewReply) all.push(r);
      }

      pageToken = data.nextPageToken;
    } while (pageToken);

    return all;
  }

  /**
   * Publica ou atualiza resposta para um review.
   * @param reviewName - full resource name do review (e.g. "accounts/.../reviews/abc")
   * @param comment - texto da resposta
   */
  async replyToReview(reviewName: string, comment: string): Promise<void> {
    const url = `${GMB_BASE}/${reviewName}/reply`;
    const res = await this.fetch(url, {
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
   * Busca os accounts (empresas) do usuário autenticado.
   * Usado no onboarding para listar os locais disponíveis.
   */
  async listAccounts(): Promise<{ name: string; accountName: string }[]> {
    const res = await this.fetch(`${GMB_BASE}/accounts`);
    if (!res.ok) throw new Error(`GMB list accounts failed: ${res.status}`);
    const data = await res.json() as { accounts?: { name: string; accountName: string }[] };
    return data.accounts ?? [];
  }

  /**
   * Lista locais de um account.
   */
  async listLocations(accountName: string): Promise<{ name: string; locationName: string; title: string }[]> {
    const res = await this.fetch(`${GMB_BASE}/${accountName}/locations?readMask=name,title`);
    if (!res.ok) throw new Error(`GMB list locations failed: ${res.status}`);
    const data = await res.json() as { locations?: { name: string; locationName: string; title: string }[] };
    return data.locations ?? [];
  }

  // Converte starRating string para número
  static starRatingToNumber(rating: GmbReview["starRating"]): number {
    return STAR_TO_NUMBER[rating] ?? 0;
  }

  /**
   * Faz um fetch autenticado. Se receber 401, tenta renovar o token.
   */
  private async fetch(url: string, init?: RequestInit): Promise<Response> {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      ...(init?.headers as Record<string, string> ?? {}),
    };

    let res = await globalThis.fetch(url, { ...init, headers });

    if (res.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      const retryHeaders = { ...headers, Authorization: `Bearer ${this.accessToken}` };
      res = await globalThis.fetch(url, { ...init, headers: retryHeaders });
    }

    return res;
  }

  /**
   * Renova o access_token usando o refresh_token.
   */
  private async refreshAccessToken(): Promise<void> {
    const res = await globalThis.fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.refreshToken!,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    });

    if (!res.ok) throw new Error("Failed to refresh Google access token");

    const data = await res.json() as { access_token: string };
    this.accessToken = data.access_token;
  }
}
