import { Resend } from 'resend'
import type { AppLocale } from '@/lib/i18n/locale'
import { EMAIL_ALERT, EMAIL_WELCOME } from '@/lib/i18n/strings-email'
import { WA } from '@/lib/i18n/strings-whatsapp'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@replyflow-hivi.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://replyflow-hivi.com'

interface NegativeReviewAlertParams {
  to: string
  businessName: string
  authorName: string
  rating: number
  content: string
  reviewId: string
  locale?: AppLocale
}

export async function sendNegativeReviewAlert(params: NegativeReviewAlertParams) {
  const { to, businessName, authorName, rating, content, reviewId, locale } = params
  const t = EMAIL_ALERT[locale ?? 'pt']
  const htmlLang = locale === 'en' ? 'en-US' : locale === 'es' ? 'es-419' : 'pt-BR'
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const reviewUrl = `${APP_URL}/reviews?highlight=${reviewId}`

  const html = `
<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:#dc2626;padding:24px 32px">
            <p style="margin:0;color:#fff;font-size:20px;font-weight:700">${t.negativeTitle}</p>
            <p style="margin:4px 0 0;color:#fecaca;font-size:14px">${businessName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 4px;font-size:14px;color:#6b7280">${t.reviewFrom(`<strong style="color:#111">${authorName}</strong>`)}</p>
            <p style="margin:0 0 20px;font-size:24px;color:#f59e0b">${stars}</p>

            ${content ? `
            <div style="background:#f9fafb;border-left:3px solid #dc2626;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">"${content}"</p>
            </div>
            ` : `<p style="color:#6b7280;margin-bottom:24px">${t.noComment}</p>`}

            <a href="${reviewUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">
              ${t.replyNow}
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              ReplyFlow · ${t.footer}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: `ReplyFlow <${FROM}>`,
    to,
    subject: t.negativeSubject(businessName, stars),
    html,
  })
}

// ─── WhatsApp provider abstraction ──────────────────────────────────────────
// Suporta três providers (auto-detectados pelas env vars, ordem de prioridade):
//   • UltraMsg  → ULTRAMSG_INSTANCE_ID + ULTRAMSG_TOKEN          (~R$25/mês)
//   • Z-API     → ZAPI_INSTANCE_ID + ZAPI_TOKEN (+ ZAPI_CLIENT_TOKEN opcional)
//   • Evolution → EVOLUTION_API_URL + EVOLUTION_API_KEY          (self-hosted)

type WaProvider = 'ultramsg' | 'zapi' | 'evolution' | 'none'

function detectWaProvider(): WaProvider {
  if (process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN) return 'ultramsg'
  if (process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN)           return 'zapi'
  if (process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY)   return 'evolution'
  return 'none'
}

/**
 * Envia uma mensagem de texto via WhatsApp.
 * Silencioso quando nenhum provider está configurado.
 * @param phone  - E.164 sem + ex: 5511999999999
 * @param message - Texto da mensagem (suporta *bold* no WhatsApp)
 */
async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  const provider = detectWaProvider()
  if (provider === 'none') return

  if (provider === 'ultramsg') {
    // UltraMsg: https://ultramsg.com/
    // Env vars: ULTRAMSG_INSTANCE_ID, ULTRAMSG_TOKEN
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID!
    const token      = process.env.ULTRAMSG_TOKEN!
    // UltraMsg aceita número com ou sem +; normalizamos para garantir
    const toPhone = phone.startsWith('+') ? phone : `+${phone}`
    const body = new URLSearchParams({ token, to: toPhone, body: message })
    await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body.toString(),
      signal:  AbortSignal.timeout(10000),
    }).catch((e) => console.warn('[WhatsApp/ultramsg] send failed:', e.message))

  } else if (provider === 'zapi') {
    // Z-API: https://developer.z-api.io/
    const instanceId    = process.env.ZAPI_INSTANCE_ID!
    const token         = process.env.ZAPI_TOKEN!
    const clientToken   = process.env.ZAPI_CLIENT_TOKEN  // opcional, planos Enterprise
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (clientToken) headers['Client-Token'] = clientToken
    await fetch(url, {
      method:  'POST',
      headers,
      body:    JSON.stringify({ phone, message }),
      signal:  AbortSignal.timeout(10000),
    }).catch((e) => console.warn('[WhatsApp/zapi] send failed:', e.message))

  } else if (provider === 'evolution') {
    // Evolution API: https://evolution-api.com/
    const evolutionUrl = process.env.EVOLUTION_API_URL!
    const evolutionKey = process.env.EVOLUTION_API_KEY!
    const instance     = process.env.EVOLUTION_INSTANCE ?? 'replyflow'
    await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': evolutionKey },
      body:    JSON.stringify({ number: phone, text: message }),
      signal:  AbortSignal.timeout(10000),
    }).catch((e) => console.warn('[WhatsApp/evolution] send failed:', e.message))
  }
}

// ─── WhatsApp Alert ──────────────────────────────────────────────────────────

interface WhatsAppAlertParams {
  phone:        string   // formato: 5511999999999
  businessName: string
  authorName:   string
  rating:       number
  content:      string
  reviewId:     string
  locale?:      AppLocale
}

export async function sendWhatsAppAlert(params: WhatsAppAlertParams): Promise<void> {
  const { phone, businessName, authorName, rating, content, reviewId, locale } = params
  const w = WA[locale ?? 'pt']
  const stars     = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const reviewUrl = `${APP_URL}/reviews?highlight=${reviewId}`

  const message = [
    w.alertTitle,
    ``,
    `🏢 *${businessName}*`,
    `👤 ${authorName}`,
    `${stars} ${w.stars(rating)}`,
    ``,
    content ? `💬 "${content.slice(0, 200)}${content.length > 200 ? '...' : ''}"` : '',
    ``,
    `${w.replyNow} ${reviewUrl}`,
  ].filter(Boolean).join('\n')

  await sendWhatsAppMessage(phone, message)
}

// ─── WhatsApp 1-click Approval ───────────────────────────────────────────────

interface WhatsAppApprovalParams {
  phone:         string
  businessName:  string
  authorName:    string
  rating:        number
  responseDraft: string
  approveUrl:    string  // signed token URL (válido 48h)
  dashboardUrl:  string
  locale?:       AppLocale
}

export async function sendWhatsAppApproval(params: WhatsAppApprovalParams): Promise<void> {
  const { phone, businessName, authorName, rating, responseDraft, approveUrl, dashboardUrl, locale } = params
  const w = WA[locale ?? 'pt']
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)

  const message = [
    w.approvalTitle,
    ``,
    `🏢 *${businessName}*`,
    `👤 ${authorName} · ${stars}`,
    ``,
    w.draft,
    `"${responseDraft.slice(0, 300)}${responseDraft.length > 300 ? '...' : ''}"`,
    ``,
    w.approveNow,
    approveUrl,
    ``,
    `${w.editDashboard} ${dashboardUrl}`,
  ].join('\n')

  await sendWhatsAppMessage(phone, message)
}

interface WelcomeEmailParams {
  to: string
  name: string
  locale?: AppLocale
}

export async function sendWelcomeEmail({ to, name, locale }: WelcomeEmailParams) {
  const t = EMAIL_WELCOME[locale ?? 'pt']
  const firstName = name.split(' ')[0]
  const dashboardUrl  = `${APP_URL}/dashboard`
  const locationsUrl  = `${APP_URL}/locations`
  const billingUrl    = `${APP_URL}/billing`

  const html = `
<!DOCTYPE html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">

        <!-- Header gradient -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 40px 32px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 10px;vertical-align:middle">
                  <span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.5px">⚡ ReplyFlow</span>
                </td>
              </tr>
            </table>
            <h1 style="margin:20px 0 8px;font-size:26px;font-weight:800;color:#fff;line-height:1.2">
              ${t.greeting(firstName)}
            </h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.5">
              ${t.subtitle}
            </p>
          </td>
        </tr>

        <!-- Steps -->
        <tr>
          <td style="padding:36px 40px 8px">
            <p style="margin:0 0 24px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af">
              ${t.nextSteps}
            </p>

            <!-- Step 1 -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;width:100%">
              <tr>
                <td width="40" valign="top" style="padding-top:2px">
                  <div style="width:32px;height:32px;background:#eef2ff;border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:700;color:#6366f1">1</div>
                </td>
                <td style="padding-left:12px">
                  <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827">${t.step1Title}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.5">
                    Cole a URL do seu negócio no Google Maps para começar a importar avaliações e gerar respostas com IA.
                  </p>
                  <a href="${locationsUrl}" style="font-size:13px;color:#6366f1;font-weight:600;text-decoration:none">
                    ${t.goToLocations}
                  </a>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="border-top:1px solid #f3f4f6;margin:16px 0 16px 52px"></div>

            <!-- Step 2 -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;width:100%">
              <tr>
                <td width="40" valign="top" style="padding-top:2px">
                  <div style="width:32px;height:32px;background:#eef2ff;border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:700;color:#6366f1">2</div>
                </td>
                <td style="padding-left:12px">
                  <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827">${t.step2Title}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.5">
                    Clique em qualquer review e depois em <strong>"Gerar com IA"</strong>. A resposta será criada em segundos, personalizada para o seu negócio.
                  </p>
                  <a href="${dashboardUrl}" style="font-size:13px;color:#6366f1;font-weight:600;text-decoration:none">
                    ${t.goToReviews}
                  </a>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="border-top:1px solid #f3f4f6;margin:16px 0 16px 52px"></div>

            <!-- Step 3 -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;width:100%">
              <tr>
                <td width="40" valign="top" style="padding-top:2px">
                  <div style="width:32px;height:32px;background:#eef2ff;border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:700;color:#6366f1">3</div>
                </td>
                <td style="padding-left:12px">
                  <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827">${t.step3Title}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.5">
                    Nos locais, ative <strong>"Auto-publicar"</strong> para o ReplyFlow responder tudo sozinho, com delay natural de 5-20 minutos para parecer humano.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA button -->
        <tr>
          <td style="padding:24px 40px 36px">
            <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:-0.2px">
              ${t.cta}
            </a>
          </td>
        </tr>

        <!-- Plan reminder -->
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #f3f4f6">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#374151">${t.planLabel('Free')}</p>
                  <p style="margin:0;font-size:13px;color:#6b7280">10 respostas/mês · 1 local · Sem auto-publicação</p>
                </td>
                <td align="right">
                  <a href="${billingUrl}" style="font-size:13px;color:#6366f1;font-weight:600;text-decoration:none;white-space:nowrap">
                    ${t.viewPlans}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">
              ReplyFlow · ${t.footer}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: `ReplyFlow <${FROM}>`,
    to,
    subject: t.subject(firstName),
    html,
  })
}
