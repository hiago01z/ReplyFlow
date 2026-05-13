import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * POST /api/facebook/data-deletion
 *
 * Callback de exclusão de dados exigido pela Meta (Facebook).
 * Referência: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 *
 * Fluxo:
 *  1. Meta envia POST com body: signed_request=<base64url.base64url>
 *  2. Validamos a assinatura HMAC-SHA256 usando FACEBOOK_APP_SECRET
 *  3. Extraímos o user_id do payload
 *  4. Respondemos com JSON: { url, confirmation_code }
 *
 * URL para cadastrar no Meta:
 *   https://replyflow-hivi.com/api/facebook/data-deletion
 */

function parseSignedRequest(signedRequest: string, appSecret: string) {
  const [encodedSig, encodedData] = signedRequest.split(".");

  if (!encodedSig || !encodedData) return null;

  // Decodificar base64url → base64
  const toBase64 = (s: string) => s.replace(/-/g, "+").replace(/_/g, "/");

  const sig  = Buffer.from(toBase64(encodedSig), "base64");
  const data = Buffer.from(toBase64(encodedData), "base64").toString("utf8");

  // Verificar assinatura HMAC-SHA256
  const expectedSig = crypto
    .createHmac("sha256", appSecret)
    .update(encodedData)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) return null;

  try {
    return JSON.parse(data) as { user_id?: string; algorithm?: string };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  // Se a chave não estiver configurada, retornar erro de servidor
  if (!appSecret) {
    console.error("[facebook/data-deletion] FACEBOOK_APP_SECRET not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Ler body como form-urlencoded (Meta envia application/x-www-form-urlencoded)
  let signedRequest: string | null = null;
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      signedRequest = params.get("signed_request");
    } else {
      // Fallback: tentar JSON (alguns testes enviam JSON)
      const body = await request.json().catch(() => ({}));
      signedRequest = body.signed_request ?? null;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!signedRequest) {
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  // Validar e decodificar o signed_request
  const payload = parseSignedRequest(signedRequest, appSecret);
  if (!payload) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
  }

  const facebookUserId = payload.user_id ?? "unknown";

  // Gerar código de confirmação único para este pedido
  const confirmationCode = crypto
    .createHash("sha256")
    .update(`${facebookUserId}-${Date.now()}-${appSecret.slice(0, 8)}`)
    .digest("hex")
    .slice(0, 16);

  // URL de status que o usuário pode consultar
  const statusUrl = `https://replyflow-hivi.com/data-deletion?code=${confirmationCode}`;

  console.log(`[facebook/data-deletion] Deletion request for FB user ${facebookUserId}, code: ${confirmationCode}`);

  // Resposta no formato exigido pela Meta
  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  });
}
