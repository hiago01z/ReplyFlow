/**
 * /l/[slug] — Public location profile page
 *
 * Sprint 34: Shareable page showing a business's aggregate rating
 * and published reviews (with responses). No login required.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          }
        />
      ))}
    </div>
  );
}

function RelativeTime({ dateStr }: { dateStr: string | null }) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return <span>Hoje</span>;
  if (days === 1) return <span>Ontem</span>;
  if (days < 30)  return <span>Há {days} dias</span>;
  if (days < 365) return <span>Há {Math.floor(days / 30)} {Math.floor(days / 30) === 1 ? "mês" : "meses"}</span>;
  return <span>Há {Math.floor(days / 365)} {Math.floor(days / 365) === 1 ? "ano" : "anos"}</span>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const serviceClient = createServiceClient();
  const { data: location } = await serviceClient
    .from("locations")
    .select("name, is_public")
    .eq("public_slug", slug)
    .single();

  if (!location?.is_public) {
    return { title: "Perfil não encontrado — ReplyFlow" };
  }

  return {
    title: `${location.name} — Avaliações | ReplyFlow`,
    description: `Veja as avaliações e respostas de ${location.name}.`,
    openGraph: {
      title: `${location.name} — Avaliações`,
      description: `Avaliações verificadas e respondidas de ${location.name}.`,
      type: "website",
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  const serviceClient = createServiceClient();

  // Fetch location by slug
  const { data: location } = await serviceClient
    .from("locations")
    .select("id, name, niche, is_public, public_slug")
    .eq("public_slug", slug)
    .eq("is_public", true)
    .single();

  if (!location) notFound();

  // Fetch published reviews with their responses
  const { data: reviews } = await serviceClient
    .from("reviews")
    .select(`
      id,
      author_name,
      author_photo_url,
      rating,
      content,
      platform_published_at,
      responses ( content, published_at )
    `)
    .eq("location_id", location.id)
    .eq("status", "published")
    .order("platform_published_at", { ascending: false })
    .limit(50);

  const published = reviews ?? [];

  // Aggregate stats
  const total   = published.length;
  const avgRaw  = total > 0
    ? published.reduce((sum, r) => sum + (r.rating ?? 0), 0) / total
    : 0;
  const avg     = Math.round(avgRaw * 10) / 10;
  const replied = published.filter((r) => Array.isArray(r.responses) && r.responses.length > 0).length;

  // Rating breakdown (5 → 1)
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: published.filter((r) => r.rating === star).length,
  }));

  const nicheLabel: Record<string, string> = {
    clinica:     "Clínica / Saúde",
    restaurante: "Restaurante",
    academia:    "Academia / Fitness",
    petshop:     "Pet Shop",
    barbearia:   "Barbearia / Salão",
    outro:       "Negócio Local",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="text-center mb-8">
        {/* Avatar placeholder */}
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">
            {location.niche === "restaurante" ? "🍽️"
            : location.niche === "clinica"    ? "🏥"
            : location.niche === "academia"   ? "💪"
            : location.niche === "petshop"    ? "🐾"
            : location.niche === "barbearia"  ? "✂️"
            : "🏪"}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{location.name}</h1>
        <p className="text-sm text-gray-500">{nicheLabel[location.niche] ?? "Negócio Local"}</p>

        {total > 0 && (
          <div className="mt-4 inline-flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-gray-900">{avg.toFixed(1)}</span>
              <div className="flex flex-col gap-1">
                <StarRating rating={avg} size={20} />
                <span className="text-xs text-gray-500">
                  {total} {total === 1 ? "avaliação" : "avaliações"}
                </span>
              </div>
            </div>

            {/* Breakdown bars */}
            <div className="w-48 mt-2 space-y-1">
              {breakdown.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-4 text-right shrink-0">{star}</span>
                  <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-amber-400 h-1.5 rounded-full transition-all"
                      style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-4 shrink-0">{count}</span>
                </div>
              ))}
            </div>

            {replied > 0 && (
              <p className="text-xs text-green-600 font-medium mt-1">
                ✓ {replied} de {total} avaliações respondidas
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Reviews list ───────────────────────────────────────────────────── */}
      {total === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Star size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Ainda não há avaliações publicadas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {published.map((review) => {
            const responseContent =
              Array.isArray(review.responses) && review.responses.length > 0
                ? (review.responses[0] as { content: string; published_at: string | null }).content
                : null;

            return (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                {/* Author + rating */}
                <div className="flex items-start gap-3 mb-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {review.author_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.author_photo_url}
                        alt={review.author_name ?? "Autor"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-500">
                        {(review.author_name ?? "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {review.author_name ?? "Anônimo"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {review.rating && <StarRating rating={review.rating} size={12} />}
                      <span className="text-xs text-gray-400">
                        <RelativeTime dateStr={review.platform_published_at} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review content */}
                {review.content && (
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    {review.content}
                  </p>
                )}

                {/* Response */}
                {responseContent && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-indigo-700 mb-1">
                      Resposta do estabelecimento
                    </p>
                    <p className="text-sm text-indigo-900 leading-relaxed">
                      {responseContent}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="mt-12 text-center">
        <a
          href="https://replyflow.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Avaliações gerenciadas com
          <span className="font-semibold text-indigo-500">ReplyFlow</span>
          <span>✦</span>
        </a>
      </div>
    </div>
  );
}
