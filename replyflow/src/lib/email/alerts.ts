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

interface WelcomeEmailParams {
  to: string
  name: string
}

export async function sendWelcomeEmail({ to, name }: WelcomeEmailParams) {
  const firstName = name.split(' ')[0]
  const dashboardUrl = `${APP_URL}/dashboard`

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">
        <tr>
          <td style="background:#4f46e5;padding:24px 32px">
            <p style="margin:0;color:#fff;font-size:22px;font-weight:700">⚡ ReplyFlow</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <h1 style="margin:0 0 16px;font-size:22px;color:#111">Bem-vindo, ${firstName}! 🎉</h1>
            <p style="margin:0 0 16px;color:#374151;line-height:1.6">
              Sua conta foi criada com sucesso. A partir de agora, o ReplyFlow vai monitorar seus reviews e responder com IA personalizada.
            </p>
            <p style="margin:0 0 24px;color:#374151;line-height:1.6">
              <strong>Próximo passo:</strong> conecte seu Google Meu Negócio para começar a monitorar.
            </p>
            <a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">
              Acessar dashboard →
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:12px;color:#9ca3af">ReplyFlow · Sua reputação no piloto automático.</p>
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
    subject: 'Bem-vindo ao ReplyFlow! ⚡',
    html,
  })
}
