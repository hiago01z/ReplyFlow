/**
 * GET /api/health
 *
 * Health check endpoint — verifica variáveis de ambiente críticas
 * e conectividade com o banco de dados.
 *
 * Usado por: Vercel, cron-job.org, uptime monitors (UptimeRobot, Better Uptime)
 * Retorna 200 se tudo OK, 503 se algum serviço crítico estiver ausente.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Env vars obrigatórias para o app funcionar
const REQUIRED_ENV: { key: string; label: string }[] = [
  { key: "NEXT_PUBLIC_SUPABASE_URL",   label: "Supabase URL" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase Anon Key" },
  { key: "SUPABASE_SERVICE_ROLE_KEY",  label: "Supabase Service Key" },
  { key: "OPENAI_API_KEY",             label: "OpenAI API Key" },
  { key: "STRIPE_SECRET_KEY",          label: "Stripe Secret Key" },
  { key: "STRIPE_WEBHOOK_SECRET",      label: "Stripe Webhook Secret" },
  { key: "RESEND_API_KEY",             label: "Resend API Key" },
  { key: "GOOGLE_CLIENT_ID",           label: "Google Client ID" },
  { key: "GOOGLE_CLIENT_SECRET",       label: "Google Client Secret" },
  { key: "CRON_SECRET",                label: "Cron Secret" },
];

// Opcionais (avisos, não erros)
const OPTIONAL_ENV: { key: string; label: string }[] = [
  { key: "UPSTASH_REDIS_REST_URL",    label: "Upstash Redis URL" },
  { key: "UPSTASH_REDIS_REST_TOKEN",  label: "Upstash Redis Token" },
  { key: "STRIPE_PRICE_STARTER_MONTHLY", label: "Stripe Price Starter" },
  { key: "STRIPE_PRICE_PRO_MONTHLY",     label: "Stripe Price Pro" },
  { key: "STRIPE_PRICE_AGENCY_MONTHLY",  label: "Stripe Price Agency" },
  { key: "NEXT_PUBLIC_APP_URL",       label: "App URL" },
  { key: "GOOGLE_REDIRECT_URI",       label: "Google Redirect URI" },
];

export async function GET() {
  const start = Date.now();

  // ── 1. Check required env vars ─────────────────────────────────────────────
  const missing: string[] = [];
  for (const { key, label } of REQUIRED_ENV) {
    if (!process.env[key]) missing.push(label);
  }

  const warnings: string[] = [];
  for (const { key, label } of OPTIONAL_ENV) {
    if (!process.env[key]) warnings.push(label);
  }

  // ── 2. Check DB connectivity ───────────────────────────────────────────────
  let dbOk = false;
  let dbError: string | null = null;
  try {
    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from("organizations")
      .select("id", { count: "exact", head: true })
      .limit(1);
    dbOk    = !error;
    dbError = error?.message ?? null;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Unknown error";
  }

  // ── 3. Build response ──────────────────────────────────────────────────────
  const healthy = missing.length === 0 && dbOk;
  const latency = Date.now() - start;

  const body = {
    status:     healthy ? "ok" : "degraded",
    timestamp:  new Date().toISOString(),
    latency_ms: latency,
    checks: {
      env:      missing.length === 0 ? "ok" : `missing: ${missing.join(", ")}`,
      database: dbOk ? "ok" : `error: ${dbError}`,
    },
    warnings: warnings.length > 0
      ? `optional missing: ${warnings.join(", ")}`
      : undefined,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
