import type { AppLocale } from './locale'

export const WA = {
  pt: {
    alertTitle:    '⚠️ *Review negativo recebido!*',
    stars:         (n: number) => `(${n} estrela${n > 1 ? 's' : ''})`,
    replyNow:      '👉 Responder agora:',
    approvalTitle: '⚡ *ReplyFlow — Resposta pronta para aprovar*',
    draft:         '📝 *Rascunho:*',
    approveNow:    '✅ *Aprovar e publicar agora:*',
    editDashboard: '✏️ Editar no dashboard:',
  },
  en: {
    alertTitle:    '⚠️ *Negative review received!*',
    stars:         (n: number) => `(${n} star${n > 1 ? 's' : ''})`,
    replyNow:      '👉 Reply now:',
    approvalTitle: '⚡ *ReplyFlow — Response ready to approve*',
    draft:         '📝 *Draft:*',
    approveNow:    '✅ *Approve and publish now:*',
    editDashboard: '✏️ Edit in dashboard:',
  },
  es: {
    alertTitle:    '⚠️ *¡Reseña negativa recibida!*',
    stars:         (n: number) => `(${n} estrella${n > 1 ? 's' : ''})`,
    replyNow:      '👉 Responder ahora:',
    approvalTitle: '⚡ *ReplyFlow — Respuesta lista para aprobar*',
    draft:         '📝 *Borrador:*',
    approveNow:    '✅ *Aprobar y publicar ahora:*',
    editDashboard: '✏️ Editar en el panel:',
  },
} satisfies Record<AppLocale, object>
