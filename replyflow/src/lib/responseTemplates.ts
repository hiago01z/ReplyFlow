/**
 * Response templates by niche + star rating.
 * Used in TemplatePicker to give users starting points when editing AI responses.
 * Variables: {business} = business name, {author} = reviewer name (optional).
 */

export type TemplateRatingRange = "low" | "mid" | "high"; // 1-2 | 3 | 4-5

export interface ResponseTemplate {
  id:    string;
  label: string;
  text:  string;
}

export type TemplateMap = Record<TemplateRatingRange, ResponseTemplate[]>;

// ─── Generic (applies to all niches) ─────────────────────────────────────────

const GENERIC: TemplateMap = {
  low: [
    {
      id: "g-low-1",
      label: "Pedido de desculpas + compromisso",
      text: "Olá{author}! Ficamos muito tristes em ler sobre sua experiência. Isso não reflete o padrão que buscamos oferecer e pedimos sinceras desculpas. Gostaríamos de entender melhor o que aconteceu para corrigir e garantir que não se repita. Por favor, entre em contato conosco diretamente. Sua opinião é fundamental para nós.",
    },
    {
      id: "g-low-2",
      label: "Reconhecimento + melhoria",
      text: "Olá{author}, obrigado por compartilhar seu feedback. Sentimos muito que sua experiência não foi satisfatória. Já repassamos seu comentário à equipe e estamos tomando as medidas necessárias para melhorar. Esperamos ter a oportunidade de reconquistar sua confiança.",
    },
  ],
  mid: [
    {
      id: "g-mid-1",
      label: "Agradecimento + melhoria contínua",
      text: "Olá{author}, obrigado pela avaliação! Ficamos felizes que gostou de alguns aspectos, mas reconhecemos que ainda temos pontos a melhorar. Seu feedback é muito valioso e nos ajuda a evoluir continuamente. Esperamos recebê-lo novamente em breve!",
    },
    {
      id: "g-mid-2",
      label: "Positivo + convite",
      text: "Obrigado pela visita{author}! Ficamos contentes com a sua avaliação. Continuamos trabalhando para melhorar cada vez mais e esperamos proporcionar uma experiência ainda melhor na próxima vez. Volte sempre!",
    },
  ],
  high: [
    {
      id: "g-high-1",
      label: "Agradecimento caloroso",
      text: "Olá{author}! Muito obrigado pela avaliação maravilhosa! 😊 Ficamos muito felizes em saber que você teve uma ótima experiência. É para isso que trabalhamos todos os dias. Esperamos vê-lo em breve!",
    },
    {
      id: "g-high-2",
      label: "Gratidão + indicação",
      text: "Que alegria receber esse feedback{author}! Obrigado por confiar em nós e por reservar um tempo para compartilhar sua experiência. Sua satisfação é a nossa maior recompensa. Indique para amigos e familiares — ficaremos felizes em atendê-los!",
    },
  ],
};

// ─── Clínica / Saúde ──────────────────────────────────────────────────────────

const CLINICA: TemplateMap = {
  low: [
    {
      id: "cl-low-1",
      label: "Desculpas + contato direto",
      text: "Olá{author}, lamentamos muito que sua consulta não tenha atendido às expectativas. A qualidade do atendimento e o cuidado com cada paciente são nossa prioridade absoluta. Pedimos que entre em contato conosco diretamente para conversarmos e encontrarmos a melhor solução. Seu bem-estar é o mais importante para nós.",
    },
    {
      id: "cl-low-2",
      label: "Espera / agendamento",
      text: "Olá{author}, sentimos muito pelo tempo de espera. Entendemos o quanto isso é frustrante, especialmente em um momento em que você precisa de atenção. Estamos revisando nossos processos de agendamento para minimizar esses inconvenientes. Agradecemos sua paciência e esperamos recebê-lo novamente.",
    },
  ],
  mid: [
    {
      id: "cl-mid-1",
      label: "Agradecimento + compromisso",
      text: "Olá{author}, obrigado por avaliar nossa clínica! Ficamos contentes que tenha gostado do atendimento. Continuamos sempre buscando aprimorar nossos serviços para oferecer o melhor cuidado possível. Estamos à disposição para qualquer necessidade!",
    },
  ],
  high: [
    {
      id: "cl-high-1",
      label: "Gratidão + saúde em foco",
      text: "Muito obrigado{author}! É maravilhoso saber que você se sentiu bem cuidado em nossa clínica. Nossa equipe se dedica com todo o carinho para que cada paciente tenha a melhor experiência possível. Conte sempre conosco para cuidar da sua saúde!",
    },
    {
      id: "cl-high-2",
      label: "Retorno + indicação",
      text: "Olá{author}! Sua avaliação nos encheu de alegria e motivação. Cuidar da saúde das pessoas é a nossa vocação e seu feedback confirma que estamos no caminho certo. Estamos sempre aqui quando precisar. Indique-nos para quem você ama!",
    },
  ],
};

// ─── Restaurante / Alimentação ────────────────────────────────────────────────

const RESTAURANTE: TemplateMap = {
  low: [
    {
      id: "rs-low-1",
      label: "Desculpas + qualidade",
      text: "Olá{author}, ficamos muito tristes em saber que sua refeição não estava no padrão que você merecia. Prezamos pela qualidade de cada prato e sabemos que falhamos nesta ocasião. Pedimos desculpas e gostaríamos de convidá-lo a nos dar uma segunda chance. Entre em contato conosco!",
    },
    {
      id: "rs-low-2",
      label: "Atendimento / demora",
      text: "Olá{author}, lamentamos muito que o atendimento não tenha sido como esperado. Sabemos o quanto um serviço ágil e atencioso é importante, especialmente quando se busca um bom momento. Estamos treinando nossa equipe continuamente e seu feedback nos ajuda muito. Esperamos reconquistar você!",
    },
  ],
  mid: [
    {
      id: "rs-mid-1",
      label: "Obrigado + volte sempre",
      text: "Olá{author}, obrigado pela visita e pela avaliação! Ficamos felizes que tenha gostado. Nosso cardápio muda frequentemente e adoraríamos que você voltasse para experimentar nossas novidades. Até breve!",
    },
  ],
  high: [
    {
      id: "rs-high-1",
      label: "Prazer à mesa",
      text: "Que alegria{author}! Adoramos saber que você curtiu a experiência. Nossa equipe se dedica para que cada refeição seja um momento especial. Volte sempre — temos muito mais para você experimentar!",
    },
    {
      id: "rs-high-2",
      label: "Gratidão + convite",
      text: "Olá{author}! Sua avaliação foi incrível — muito obrigado! Temos muito orgulho do nosso time de cozinha e de salão. Esperamos vê-lo em breve, talvez para conhecer nosso novo cardápio. Traga os amigos! 🍽️",
    },
  ],
};

// ─── Academia / Fitness ───────────────────────────────────────────────────────

const ACADEMIA: TemplateMap = {
  low: [
    {
      id: "ac-low-1",
      label: "Desculpas + suporte",
      text: "Olá{author}, ficamos muito preocupados com sua experiência. Nossa academia existe para apoiar sua jornada de saúde e bem-estar, e sentimos muito por ter falhado nisso. Entre em contato com nossa gestão para que possamos resolver a situação e garantir que você tenha o suporte que merece.",
    },
  ],
  mid: [
    {
      id: "ac-mid-1",
      label: "Motivação + melhoria",
      text: "Olá{author}, obrigado pela avaliação! Adoramos ter você em nossa academia. Estamos constantemente investindo em equipamentos, aulas e equipe para oferecer a melhor experiência possível. Continue treinando — a evolução é certa! 💪",
    },
  ],
  high: [
    {
      id: "ac-high-1",
      label: "Motivação + resultados",
      text: "Que ótimo receber esse feedback{author}! Ver nossos alunos alcançando seus objetivos é o que nos move. Continue com o foco e dedicação — estamos aqui para apoiar cada passo da sua jornada. 💪🏆",
    },
    {
      id: "ac-high-2",
      label: "Comunidade + convite",
      text: "Muito obrigado{author}! Nossa comunidade de alunos é o nosso maior orgulho. Fico feliz em saber que você se sente em casa aqui. Traga um amigo para treinar e mostre o que estamos construindo juntos!",
    },
  ],
};

// ─── Petshop / Veterinária ────────────────────────────────────────────────────

const PETSHOP: TemplateMap = {
  low: [
    {
      id: "ps-low-1",
      label: "Cuidado com o pet",
      text: "Olá{author}, ficamos muito preocupados ao ler sua avaliação. O bem-estar e a segurança dos pets são nossa maior responsabilidade. Pedimos desculpas pela experiência e gostaríamos de conversar diretamente para entender o que aconteceu e resolver da melhor forma possível.",
    },
  ],
  mid: [
    {
      id: "ps-mid-1",
      label: "Agradecimento + cuidado",
      text: "Olá{author}, obrigado pela confiança em nossos serviços! Sabemos o quanto os pets são especiais para suas famílias, e nos dedicamos para que eles sejam tratados com todo o carinho que merecem. Volte sempre! 🐾",
    },
  ],
  high: [
    {
      id: "ps-high-1",
      label: "Amor pelos pets",
      text: "Que feedack lindo{author}! Cuidar do seu pet com amor e dedicação é o que fazemos com prazer. Fico feliz que você e ele tenham tido uma ótima experiência. Estamos sempre aqui para o que precisar! 🐾❤️",
    },
    {
      id: "ps-high-2",
      label: "Confiança + retorno",
      text: "Muito obrigado{author}! Confiar-nos o cuidado do seu pet é uma responsabilidade que levamos muito a sério. Adoramos vê-los felizes e saudáveis. Até a próxima visita!",
    },
  ],
};

// ─── Barbearia / Beleza ───────────────────────────────────────────────────────

const BARBEARIA: TemplateMap = {
  low: [
    {
      id: "bb-low-1",
      label: "Desculpas + retrabalho",
      text: "Olá{author}, lamentamos muito que o resultado não tenha ficado como você esperava. Nosso objetivo é sempre deixar você satisfeito ao sair daqui. Entre em contato conosco para agendarmos um horário e corrigirmos o que não ficou bom, sem custo algum.",
    },
  ],
  mid: [
    {
      id: "bb-mid-1",
      label: "Agradecimento + fidelidade",
      text: "Olá{author}, obrigado pela avaliação! Ficamos contentes que gostou do serviço. Nossa equipe está sempre se aperfeiçoando para oferecer o melhor resultado. Agende seu próximo horário — teremos novidades em breve! ✂️",
    },
  ],
  high: [
    {
      id: "bb-high-1",
      label: "Estilo + satisfação",
      text: "Muito obrigado{author}! Sair daqui estiloso e satisfeito é exatamente o que queremos. Nossa equipe fica feliz em saber que o trabalho ficou ótimo. Volte sempre — sua confiança é o que nos motiva! ✂️💈",
    },
    {
      id: "bb-high-2",
      label: "Fidelidade + indicação",
      text: "Que avaliação incrível{author}! Ficamos muito felizes com o feedback. Temos orgulho de cada serviço que realizamos. Indique para os amigos — quanto mais, melhor! Até a próxima! 💈",
    },
  ],
};

// ─── Mapa de nicho para templates ────────────────────────────────────────────

const NICHE_TEMPLATES: Record<string, TemplateMap> = {
  clinica:     CLINICA,
  restaurante: RESTAURANTE,
  academia:    ACADEMIA,
  petshop:     PETSHOP,
  barbearia:   BARBEARIA,
  outro:       GENERIC,
};

export function getRatingRange(rating: number): TemplateRatingRange {
  if (rating <= 2) return "low";
  if (rating === 3) return "mid";
  return "high";
}

/**
 * Returns templates for a given niche + star rating.
 * Falls back to generic templates if niche is not found.
 * Always merges with generic templates for more options.
 */
export function getTemplates(
  niche: string,
  rating: number,
  authorName?: string | null,
): ResponseTemplate[] {
  const range    = getRatingRange(rating);
  const nicheMap = NICHE_TEMPLATES[niche] ?? GENERIC;

  // Merge niche-specific + generic (niche first, deduplicated by id)
  const specific = nicheMap[range] ?? [];
  const generic  = GENERIC[range] ?? [];
  const all      = [
    ...specific,
    ...generic.filter((g) => !specific.find((s) => s.id === g.id)),
  ];

  // Replace {author} placeholder
  const authorPart = authorName ? ` ${authorName}` : "";
  return all.map((t) => ({
    ...t,
    text: t.text.replace(/\{author\}/g, authorPart),
  }));
}
