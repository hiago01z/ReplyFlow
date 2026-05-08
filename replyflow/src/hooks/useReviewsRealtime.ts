"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface NewReviewPayload {
  id: string;
  author_name: string | null;
  rating: number | null;
  content: string | null;
  location_id: string;
}

interface Options {
  locationIds: string[];
  onNewReview: (review: NewReviewPayload) => void;
}

/**
 * Subscribes to INSERT events on the reviews table for the given location IDs.
 * Requires `ALTER PUBLICATION supabase_realtime ADD TABLE reviews;` (migration 005).
 */
export function useReviewsRealtime({ locationIds, onNewReview }: Options) {
  // Keep a stable ref to the callback to avoid re-subscribing on every render
  const callbackRef = useRef(onNewReview);
  callbackRef.current = onNewReview;

  // Stable key: re-subscribe only when the set of location IDs changes
  const locationKey = [...locationIds].sort().join(",");

  useEffect(() => {
    if (locationIds.length === 0) return;

    const supabase = createClient();
    const channel = supabase
      .channel("reviews-insert")
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "reviews",
          filter: `location_id=in.(${locationIds.join(",")})`,
        },
        (payload) => {
          callbackRef.current(payload.new as NewReviewPayload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey]);
}
