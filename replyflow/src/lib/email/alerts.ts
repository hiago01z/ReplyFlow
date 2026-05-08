import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@replyflow.com.br'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.replyflow.com.br'

interface NegativeReviewAlertParams {
  to: string
  businessName: string
  authorName: string
  rating: number
  content: string
  reviewId: string
}

export async function sendNegativeReviewAlert(params: NegativeReviewAlertParams) {
  const { to, businessName, authorName, rating, content, reviewId } = params
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const reviewUrl = `${APP_URL}/reviews?highlight=${reviewId}`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
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
            <p style="margin:0;color:#fff;font-size:20px;font-weight:700">⚠️ Review negativo recebido</p>
            <p style="margin:4px 0 0;color:#fecaca;font-size:14px">${businessName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 4px;font-size:14px;color:#6b7280">Avaliação de <strong style="color:#111">${authorName}</strong></p>
            <p style="margin:0 0 20px;font-size:24px;color:#f59e0b">${stars}</p>

            ${content ? `
            <div style="background:#f9fafb;border-left:3px solid #dc2626;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px">
              <p style="margin:0;font-size:15px;color:#374151;line-height:1.6">"${content}"</p>
            </div>
            ` : '<p style="color:#6b7280;margin-bottom:24px">Sem comentário.</p>'}

            <a href="${reviewUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">
              Responder agora →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              ReplyFlow · Você recebe este e-mail porque tem alertas de reviews negativos ativados.
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
    subject: `⚠️ Review negativo em ${businessName} (${stars})`,
    html,
  })
}

// ─── WhatsApp Alert via Evolution API ───────────────────────────────────────

interface WhatsAppAlertParams {
  phone:        string   // formato: 5511999999999
  businessName: string
  authorName:   string
  rating:       number
  content:      string
  reviewId:     string
}

export async function sendWhatsAppAlert(params: WhatsAppAlertParams): Promise<void> {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY

  if (!evolutionUrl || !evolutionKey) return // silencioso se não configurado

  const { phone, businessName, authorName, rating, content, reviewId } = params
  const stars   = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  const reviewUrl = `${APP_URL}/reviews?highlight=${reviewId}`

  const message = [
    `⚠️ *Review negativo recebido!*`,
    ``,
    `🏢 *${businessName}*`,
    `👤 ${authorName}`,
    `${stars} (${rating} estrela${rating > 1 ? 's' : ''})`,
    ``,
    content ? `💬 "${content.slice(0, 200)}${content.length > 200 ? '...' : ''}"` : '',
    ``,
    `👉 Responder agora: ${reviewUrl}`,
  ].filter(Boolean).join('\n')

  await fetch(`${evolutionUrl}/message/sendText/replyflow`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey':       evolutionKey,
    },
    body: JSON.stringify({ number: phone, text: message }),
  })
}

// ─── WhatsApp 1-click Approval (Sprint 21) ──────────────────────────────────

interface WhatsAppApprovalParams {
  phone:        string   // formato: 5511999999999
  businessName: string
  authorName:   string
  rating:       number
  responseDraft: string
  approveUrl:   string  // signed token URL
  dashboardUrl: string
}

export async function sendWhatsAppApproval(params: WhatsAppApprovalParams): Promise<void> {
  const evolutionUrl = process.env.EVOLUTION_API_URL
  const evolutionKey = process.env.EVOLUTION_API_KEY

  if (!evolutionUrl || !evolutionKey) return

  const { phone, businessName, authorName, rating, responseDraft, approveUrl, dashboardUrl } = params
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)

  const message = [
    `⚡ *ReplyFlow — Resposta pronta para aprovar*`,
    ``,
    `🏢 *${businessName}*`,
    `👤 ${authorName} · ${stars}`,
    ``,
    `📝 *Rascunho:*`,
    `"${responseDraft.slice(0, 300)}${responseDraft.length > 300 ? '...' : ''}"`,
    ``,
    `✅ *Aprovar e publicar agora:*`,
    approveUrl,
    ``,
    `✏️ Editar no dashboard: ${dashboardUrl}`,
  ].join('\n')

  await fetch(`${evolutionUrl}/message/sendText/replyflow`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey':       evolutionKey,
    },
    body: JSON.stringify({ number: phone, text: message }),
  })
}

interface WelcomeEmailParams {
  to: string
  name: string
}

export async function sendWelcomeEmail({ to, name }: WelcomeEmailParams) {
  const firstName = name.split(' ')[0]
  const dashboardUrl  = `${APP_URL}/dashboard`
  const locationsUrl  = `${APP_URL}/locations`
  const billingUrl    = `${APP_URL}/billing`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
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
              Bem-vindo, ${firstName}! 🎉
            </h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);line-height:1.5">
              Sua conta está pronta. Veja o que fazer agora:
            </p>
          </td>
        </tr>

        <!-- Steps -->
        <tr>
          <td style="padding:36px 40px 8px">
            <p style="margin:0 0 24px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af">
              PRÓXIMOS PASSOS
            </p>

            <!-- Step 1 -->
            <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;width:100%">
              <tr>
                <td width="40" valign="top" style="padding-top:2px">
                  <div style="width:32px;height:32px;background:#eef2ff;border-radius:50%;text-align:center;line-height:32px;font-size:14px;font-weight:700;color:#6366f1">1</div>
                </td>
                <td style="padding-left:12px">
                  <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827">Conecte o Google Meu Negócio</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.5">
                    Autentique sua conta Google para o ReplyFlow começar a monitorar seus reviews automaticamente a cada 30 minutos.
                  </p>
                  <a href="${locationsUrl}" style="font-size:13px;color:#6366f1;font-weight:600;text-decoration:none">
                    Ir para Locais →
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
                  <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827">Gere sua primeira resposta com IA</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.5">
                    Clique em qualquer review e depois em <strong>"Gerar com IA"</strong>. A resposta será criada em segundos, personalizada para o seu negócio.
                  </p>
                  <a href="${dashboardUrl}" style="font-size:13px;color:#6366f1;font-weight:600;text-decoration:none">
                    Ver reviews →
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
                  <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#111827">Ative o piloto automático (opcional)</p>
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
              Acessar meu dashboard →
            </a>
          </td>
        </tr>

        <!-- Plan reminder -->
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #f3f4f6">
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td>
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#374151">Você está no plano Free</p>
                  <p style="margin:0;font-size:13px;color:#6b7280">10 respostas/mês · 1 local · Sem auto-publicação</p>
                </td>
                <td align="right">
                  <a href="${billingUrl}" style="font-size:13px;color:#6366f1;font-weight:600;text-decoration:none;white-space:nowrap">
                    Ver planos →
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
              ReplyFlow · Sua reputação no piloto automático.<br>
              Você recebe este e-mail porque criou uma conta em replyflow.com.br
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
    subject: `${firstName}, sua conta ReplyFlow está pronta! ⚡`,
    html,
  })
}
