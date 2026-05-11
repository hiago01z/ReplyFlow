import crypto from 'crypto'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type WebhookEvent =
  | 'review.negative'   // review de 1-2 estrelas recebido
  | 'review.new'        // qualquer review novo recebido
  | 'review.published'  // resposta publicada no GMB

export interface WebhookPayload {
  event:         WebhookEvent
  review_id:     string
  location_id:   string
  business_name: string
  author_name:   string | null
  rating:        number
  content:       string | null
  platform:      string
  review_url:    string          // link direto para o review no dashboard
  timestamp:     string          // ISO 8601
}

// ─── Envio ────────────────────────────────────────────────────────────────────

/**
 * Dispara um webhook POST para a URL configurada na organização.
 *
 * Segurança: se `secret` for fornecido, inclui o header
 *   X-ReplyFlow-Signature: sha256=<hmac-sha256-hex>
 * O receptor pode verificar a autenticidade calculando o mesmo HMAC
 * sobre o body raw e comparando com timing-safe.
 *
 * Timeout: 10 segundos. Lança erro em caso de falha HTTP ou timeout.
 * O caller é responsável por fazer .catch(() => null) quando quiser silenciar.
 */
export async function sendWebhook(
  url:     string,
  secret:  string | null,
  payload: WebhookPayload,
): Promise<void> {
  // Validar URL básica (deve ser https em produção)
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new Error(`Webhook URL inválida: ${url}`)
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new Error('Webhook URL deve usar http:// ou https://')
  }

  const body = JSON.stringify(payload)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent':   'ReplyFlow-Webhook/1.0',
  }

  if (secret) {
    const sig = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    headers['X-ReplyFlow-Signature'] = `sha256=${sig}`
  }

  const res = await fetch(url, {
    method:  'POST',
    headers,
    body,
    signal: AbortSignal.timeout(10_000), // 10s timeout
  })

  if (!res.ok) {
    throw new Error(`Webhook retornou HTTP ${res.status} ${res.statusText}`)
  }
}
