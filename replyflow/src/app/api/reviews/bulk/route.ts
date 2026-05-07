import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  ids:    z.array(z.string().uuid()).min(1).max(50),
  action: z.enum(["generate", "publish"]),
});

// POST /api/reviews/bulk
// Sequentially calls per-review endpoints and collects results.
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { ids, action } = parsed.data;
  const baseUrl = new URL(request.url).origin;
  const cookie  = request.headers.get("cookie") ?? "";

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const id of ids) {
    try {
      const res = await fetch(`${baseUrl}/api/reviews/${id}/${action}`, {
        method:  "POST",
        headers: { cookie },
      });

      if (res.ok) {
        results.push({ id, ok: true });
      } else {
        const data = await res.json().catch(() => ({}));
        results.push({ id, ok: false, error: data?.error ?? `HTTP ${res.status}` });
      }
    } catch (err) {
      results.push({ id, ok: false, error: "network_error" });
    }

    // Small delay between requests to avoid hammering the DB / OpenAI
    if (action === "generate") {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  const failed    = results.filter((r) => !r.ok).length;

  return NextResponse.json({ succeeded, failed, results });
}
