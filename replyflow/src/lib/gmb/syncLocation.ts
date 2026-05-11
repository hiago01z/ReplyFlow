/**
 * Shared helper: fetch new GMB reviews for a single location and insert them.
 * Used by both the cron job and the manual sync endpoint (Sprint 23).
 */

import { createServiceClient } from "@/lib/supabase/server";
import { GoogleMyBusinessClient } from "@/lib/google/myBusiness";
import { sendNegativeReviewAlert, sendWhatsAppAlert } from "@/lib/email/alerts";

interface LocationRow {
  id: string;
  name: string;
  organization_id: string;
  google_access_token: string;
  google_refresh_token: string | null;
  google_location_name: string;
  auto_publish: boolean;
  auto_publish_min_rating: number | null;
  organization: {
    plan: string;
    alert_email: string | null;
  } | null;
}

export interface SyncResult {
  newReviews:  number;
  scheduled:   number;
  alertsSent:  number;
  errors:      number;
}

function randomDelayMs(): number {
  const minMs = 5  * 60 * 1000;
  const maxMs = 20 * 60 * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

export async function syncLocationReviews(location: LocationRow): Promise<SyncResult> {
  const serviceClient = createServiceClient();
  const result: SyncResult = { newReviews: 0, scheduled: 0, alertsSent: 0, errors: 0 };

  // Normalise google_location_name: resolve "accounts/me/" to real sub
  let locationName = location.google_location_name;
  if (locationName.startsWith("accounts/me/")) {
    try {
      const tempGmb = new GoogleMyBusinessClient({
        accessToken:  location.google_access_token,
        refreshToken: location.google_refresh_token,
        locationName: "",
      });
      const sub = await tempGmb.getGoogleUserId();
      locationName = locationName.replace("accounts/me/", `accounts/${sub}/`);
      // Persist the corrected name so we don't need to do this again
      await serviceClient
        .from("locations")
        .update({ google_location_name: locationName, google_account_id: `accounts/${sub}` })
        .eq("id", location.id);
    } catch (e) {
      console.warn("[syncLocation] could not resolve 'accounts/me' sub:", e);
    }
  }

  const gmb = new GoogleMyBusinessClient({
    accessToken:  location.google_access_token,
    refreshToken: location.google_refresh_token,
    locationName,
  });

  let gmbReviews: Awaited<ReturnType<typeof gmb.listUnansweredReviews>>;
  try {
    gmbReviews = await gmb.listUnansweredReviews();
  } catch (err) {
    console.error("[syncLocation] GMB API error:", err);
    result.errors++;
    return result;
  }

  for (const gmbReview of gmbReviews) {
    const rating = GoogleMyBusinessClient.starRatingToNumber(gmbReview.starRating);

    const { data: inserted, error: insertError } = await serviceClient
      .from("reviews")
      .upsert(
        {
          location_id:           location.id,
          platform:              "google",
          external_id:           gmbReview.reviewId,
          author_name:           gmbReview.reviewer.displayName,
          author_photo_url:      gmbReview.reviewer.profilePhotoUrl ?? null,
          rating,
          content:               gmbReview.comment ?? null,
          platform_published_at: gmbReview.createTime,
          status:                "pending",
        },
        { onConflict: "platform,external_id", ignoreDuplicates: true },
      )
      .select("id, rating, status")
      .single();

    if (insertError || !inserted) continue; // already exists

    result.newReviews++;

    // Negative review alerts (1-2 stars)
    if (rating <= 2) {
      const { data: orgUser } = await serviceClient
        .from("users")
        .select("email, whatsapp, email_alerts")
        .eq("organization_id", location.organization_id)
        .eq("role", "owner")
        .single();

      const alertTo = location.organization?.alert_email || orgUser?.email;
      const isProOrAgency = location.organization?.plan === "pro" || location.organization?.plan === "agency";

      if (alertTo && orgUser?.email_alerts !== false) {
        await sendNegativeReviewAlert({
          to:           alertTo,
          businessName: location.name,
          authorName:   gmbReview.reviewer.displayName,
          rating,
          content:      gmbReview.comment ?? "",
          reviewId:     inserted.id,
        }).catch(() => null);

        await serviceClient.from("alerts").insert({
          review_id: inserted.id,
          channel:   "email",
          recipient: alertTo,
        });

        if (isProOrAgency && orgUser?.whatsapp) {
          await sendWhatsAppAlert({
            phone:        orgUser.whatsapp,
            businessName: location.name,
            authorName:   gmbReview.reviewer.displayName,
            rating,
            content:      gmbReview.comment ?? "",
            reviewId:     inserted.id,
          }).catch(() => null);

          await serviceClient.from("alerts").insert({
            review_id: inserted.id,
            channel:   "whatsapp",
            recipient: orgUser.whatsapp,
          });
        }

        result.alertsSent++;
      }
    }

    // Schedule auto-publish if enabled
    const minRating = location.auto_publish_min_rating ?? 3;
    if (location.auto_publish && rating >= minRating) {
      const publishAt = new Date(Date.now() + randomDelayMs()).toISOString();
      await serviceClient
        .from("reviews")
        .update({ publish_after: publishAt })
        .eq("id", inserted.id);
      result.scheduled++;
    }
  }

  // Persist potentially-refreshed access token
  await serviceClient
    .from("locations")
    .update({ google_access_token: location.google_access_token })
    .eq("id", location.id);

  return result;
}
