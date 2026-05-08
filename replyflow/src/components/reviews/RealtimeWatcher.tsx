"use client";

import { useRouter } from "next/navigation";
import { useReviewsRealtime } from "@/hooks/useReviewsRealtime";
import { useToast } from "@/components/ui/Toast";

interface Props {
  locationIds: string[];
}

function starsLabel(rating: number | null) {
  if (!rating) return "";
  return " " + "★".repeat(rating) + "☆".repeat(5 - rating);
}

/**
 * Invisible client component — subscribes to real-time review inserts.
 * When a new review arrives it shows a toast and refreshes the server data.
 * Mount this anywhere inside the dashboard layout.
 */
export function RealtimeWatcher({ locationIds }: Props) {
  const router = useRouter();
  const { info } = useToast();

  useReviewsRealtime({
    locationIds,
    onNewReview: (review) => {
      const author = review.author_name ?? "Alguém";
      const stars  = starsLabel(review.rating);
      info(
        `Novo review de ${author}${stars}`,
        review.content
          ? review.content.slice(0, 80) + (review.content.length > 80 ? "…" : "")
          : "Sem comentário",
      );
      // Refresh server components so the list and badge update without navigation
      router.refresh();
    },
  });

  return null; // renders nothing
}
