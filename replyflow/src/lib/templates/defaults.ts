/**
 * Built-in response templates.
 * Filtered client-side by niche and rating so they stay fresh without a DB query.
 * {authorName} is replaced at render time.
 */

export interface DefaultTemplate {
  id:         string
  title:      string
  content:    string
  niches:     string[]   // [] = all niches
  minRating:  number
  maxRating:  number
}

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  // ─── 5 estrelas — genérico ───────────────────────────────────────────────
  {
    id: 'default_5star_warm',
    title: '5★ — Agradecimento caloroso',
    niches: [],
    minRating: 5, maxRating: 5,
    content: `Olá, {authorName}! 😊 Que alegria receber esse feedback tão positivo! Fico muito feliz que tenha tido uma ótima experiência conosco. Seu carinho nos motiva a continuar melhorando sempre. Esperamos te ver em breve!`,
  },
  {
    id: 'default_5star_formal',
    title: '5★ — Agradecimento formal',
    niches: [],
    minRating: 5, maxRating: 5,
    content: `Prezado(a) {authorName}, muito obrigado pela sua avaliação! É com grande satisfação que recebemos um retorno tão positivo. Sua opinião é fundamental para continuarmos aprimorando nossos serviços. Estamos à sua disposição sempre que precisar.`,
  },

  // ─── 4 estrelas — genérico ───────────────────────────────────────────────
  {
    id: 'default_4star_generic',
    title: '4★ — Agradecimento + melhoria',
    niches: [],
    minRating: 4, maxRating: 4,
    content: `Olá, {authorName}! Muito obrigado pela sua avaliação. Ficamos felizes que tenha gostado da experiência! Se puder nos contar o que poderíamos melhorar para conquistar a 5ª estrela, ficaremos ainda mais gratos. Até a próxima!`,
  },

  // ─── 3 estrelas — genérico ───────────────────────────────────────────────
  {
    id: 'default_3star_generic',
    title: '3★ — Neutro + convite para retorno',
    niches: [],
    minRating: 3, maxRating: 3,
    content: `Olá, {authorName}! Agradecemos pelo seu feedback. Lamentamos que a experiência não tenha sido completamente satisfatória. Sua opinião é muito importante para nós e usaremos esse retorno para melhorar. Esperamos ter a oportunidade de superar suas expectativas numa próxima visita!`,
  },

  // ─── 1-2 estrelas — genérico ─────────────────────────────────────────────
  {
    id: 'default_negative_apology',
    title: '1-2★ — Pedido de desculpas + solução',
    niches: [],
    minRating: 1, maxRating: 2,
    content: `Olá, {authorName}. Pedimos sinceras desculpas pela experiência negativa que teve conosco. Seu feedback é muito importante e levamos toda crítica a sério. Gostaríamos muito de entender melhor o ocorrido e resolver a situação. Por favor, entre em contato diretamente conosco para que possamos ajudá-lo(a) da melhor forma.`,
  },
  {
    id: 'default_negative_investigate',
    title: '1-2★ — Investigação + contato direto',
    niches: [],
    minRating: 1, maxRating: 2,
    content: `Olá, {authorName}. Ficamos muito preocupados com sua experiência e lamentamos pelo ocorrido. Isso não reflete o padrão que nos comprometemos a oferecer. Estamos investigando o que aconteceu e gostaríamos de conversar diretamente para resolver a situação. Por favor, entre em contato para que possamos encontrar a melhor solução.`,
  },

  // ─── Restaurante ─────────────────────────────────────────────────────────
  {
    id: 'restaurant_5star',
    title: '5★ — Restaurante',
    niches: ['restaurante'],
    minRating: 5, maxRating: 5,
    content: `Olá, {authorName}! 🍽️ Fico muito feliz que tenha curtido a experiência! Nosso time se dedica muito para que cada visita seja especial — da cozinha ao atendimento. Esperamos te ver em breve para novas experiências gastronômicas!`,
  },
  {
    id: 'restaurant_negative',
    title: '1-2★ — Restaurante',
    niches: ['restaurante'],
    minRating: 1, maxRating: 2,
    content: `Olá, {authorName}. Pedimos desculpas pela experiência que teve em nosso restaurante. Isso não condiz com os padrões de qualidade que nos comprometemos a oferecer. Encaminharei seu feedback diretamente para nossa equipe. Gostaríamos de convidá-lo(a) para uma nova visita e ter a oportunidade de surpreendê-lo(a).`,
  },

  // ─── Clínica / Saúde ─────────────────────────────────────────────────────
  {
    id: 'clinic_5star',
    title: '5★ — Clínica/Saúde',
    niches: ['clinica', 'saúde'],
    minRating: 5, maxRating: 5,
    content: `Olá, {authorName}! Ficamos muito felizes em saber que a sua experiência foi positiva. Nossa equipe tem o compromisso de oferecer o melhor cuidado com atenção e dedicação. Obrigado pela confiança! Estamos sempre à disposição.`,
  },
  {
    id: 'clinic_negative',
    title: '1-2★ — Clínica/Saúde',
    niches: ['clinica', 'saúde'],
    minRating: 1, maxRating: 2,
    content: `Olá, {authorName}. Lamentamos muito que sua experiência não tenha sido satisfatória. Na área da saúde, o conforto e a qualidade no atendimento são prioridades absolutas. Gostaríamos de entender melhor o ocorrido — por favor, entre em contato conosco diretamente para que possamos analisar seu caso e melhorar.`,
  },

  // ─── Academia / Fitness ──────────────────────────────────────────────────
  {
    id: 'gym_5star',
    title: '5★ — Academia',
    niches: ['academia'],
    minRating: 5, maxRating: 5,
    content: `Olá, {authorName}! 💪 Que ótimo saber que está curtindo a academia! Nosso objetivo é oferecer o melhor ambiente e suporte para que você alcance seus resultados. Continue firme nos treinos — estamos aqui pra te apoiar!`,
  },

  // ─── Salão / Beleza ──────────────────────────────────────────────────────
  {
    id: 'salon_5star',
    title: '5★ — Salão/Beleza',
    niches: ['salão', 'beleza'],
    minRating: 5, maxRating: 5,
    content: `Olá, {authorName}! ✨ Ficamos muito felizes que tenha gostado do resultado! Nossa equipe se dedica para que cada cliente saia daqui se sentindo maravilhoso(a). Obrigado pela confiança e até a próxima!`,
  },

  // ─── Hotel / Pousada ─────────────────────────────────────────────────────
  {
    id: 'hotel_5star',
    title: '5★ — Hotel/Hospedagem',
    niches: ['hotel', 'pousada'],
    minRating: 5, maxRating: 5,
    content: `Olá, {authorName}! Que prazer ter você como hóspede! Ficamos felizes que sua estadia tenha sido agradável. Nossa equipe trabalha com muito carinho para que cada visita seja memorável. Esperamos recebê-lo(a) novamente em breve!`,
  },
  {
    id: 'hotel_negative',
    title: '1-2★ — Hotel/Hospedagem',
    niches: ['hotel', 'pousada'],
    minRating: 1, maxRating: 2,
    content: `Olá, {authorName}. Pedimos sinceras desculpas por não termos correspondido às suas expectativas durante a sua estadia. Seu feedback é fundamental para que possamos melhorar. Encaminharemos seu relato à nossa gestão para que os pontos apontados sejam corrigidos. Esperamos ter a oportunidade de proporcionar uma experiência melhor.`,
  },
]

/**
 * Returns built-in templates matching the given niche and rating.
 * Niche matching: templates with empty niches[] match ALL niches.
 */
export function getDefaultTemplates(niche: string, rating: number): DefaultTemplate[] {
  const n = niche.toLowerCase()
  return DEFAULT_TEMPLATES.filter((t) => {
    const nicheMatch = t.niches.length === 0 || t.niches.some((tn) => n.includes(tn) || tn.includes(n))
    const ratingMatch = rating >= t.minRating && rating <= t.maxRating
    return nicheMatch && ratingMatch
  })
}

/** Replace {authorName} placeholder */
export function fillTemplate(content: string, authorName: string | null | undefined): string {
  return content.replace(/\{authorName\}/g, authorName ?? 'cliente')
}
