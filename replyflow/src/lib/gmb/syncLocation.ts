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
  fetchedFromGmb: number;  // total retornado pela API do Google
  newReviews:     number;  // inseridos agora (não existiam no banco)
  alreadyExisted: number;  // já estavam no banco (ignorados pelo upsert)
  scheduled:      number;
  alertsSent:     number;
  errors:         number;
}

function randomDelayMs(): number {
  const minMs = 5  * 60 * 1000;
  const maxMs = 20 * 60 * 1000;
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

export async function syncLocationReviews(location: LocationRow): Promise<SyncResult> {
  const serviceClient = createServiceClient();
  const result: SyncResult = { fetchedFromGmb: 0, newReviews: 0, alreadyExisted: 0, scheduled: 0, alertsSent: 0, errors: 0 };

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

  let gmb = new GoogleMyBusinessClient({
    accessToken:  location.google_access_token,
    refreshToken: location.google_refresh_token,
    locationName,
  });

  let gmbReviews: Awaited<ReturnType<typeof gmb.listAllReviews>>;
  try {
    gmbReviews = await gmb.listAllReviews();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    // ── Auto-relink: if 404, the stored location ID is wrong — try to discover the real one ──
    if (msg.includes("404")) {
      console.warn(`[syncLocation] 404 for ${locationName} — attempting auto-relink via listLocations`);
      try {
        const tempGmb = new GoogleMyBusinessClient({
          accessToken:  location.google_access_token,
          refreshToken: location.google_refresh_token,
          locationName: "",
        });
        const accounts = await tempGmb.listAccounts();
        let detectedName: string | null = null;
        for (const account of accounts) {
          const locs = await tempGmb.listLocations(account.name);
          if (locs.length > 0) {
            detectedName = locs[0].name;
            break;
          }
        }
        if (detectedName) {
          console.log(`[syncLocation] auto-relink found: ${detectedName} (was: ${locationName})`);
          await serviceClient
            .from("locations")
            .update({ google_location_name: detectedName, google_access_token: tempGmb.currentAccessToken })
            .eq("id", location.id);
          // Retry with correct location name
          gmb = new GoogleMyBusinessClient({
            accessToken:  tempGmb.currentAccessToken,
            refreshToken: location.google_refresh_token,
            locationName: detectedName,
          });
          gmbReviews = await gmb.listAllReviews();
        } else {
          console.warn("[syncLocation] auto-relink: no locations found in any account");
          result.errors++;
          return result;
        }
      } catch (relinkErr) {
        console.error("[syncLocation] auto-relink failed:", relinkErr instanceof Error ? relinkErr.message : relinkErr);
        result.errors++;
        return result;
      }
    } else {
      console.error("[syncLocation] GMB API error:", err);
      result.errors++;
      return result;
    }
  }

  result.fetchedFromGmb = gmbReviews.length;
  console.log(`[syncLocation] GMB returned ${gmbReviews.length} reviews for location ${location.id}`);

  for (const gmbReview of gmbReviews) {
    const rating = GoogleMyBusinessClient.starRatingToNumber(gmbReview.starRating);
    // Se o review já tem resposta no Google, marcar como published; senão, pending
    const statusToSet = gmbReview.reviewReply ? "published" : "pending";

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
          status:                statusToSet,
        },
        { onConflict: "platform,external_id", ignoreDuplicates: true },
      )
      .select("id, rating, status")
      .single();

    if (insertError || !inserted) {
      result.alreadyExisted++;
      continue; // already exists
    }

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
