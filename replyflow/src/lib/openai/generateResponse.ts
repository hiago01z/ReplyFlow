import OpenAI from 'openai'
import type { LocationNiche, LocationTone } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Modelo configurável via env var — padrão gpt-4o-mini (barato e rápido)
// Para usar gpt-4.1-mini: defina OPENAI_MODEL=gpt-4.1-mini no .env.local
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini'

interface GenerateResponseParams {
  reviewContent: string
  rating: number
  authorName: string | null
  niche: LocationNiche
  tone: LocationTone
  businessName: string
}

const NICHE_CONTEXT: Record<LocationNiche, string> = {
  clinica: 'clínica de saúde (médica, odontológica, estética ou similar)',
  restaurante: 'restaurante ou estabelecimento de alimentação',
  academia: 'academia ou estúdio de fitness',
  petshop: 'pet shop ou clínica veterinária',
  barbearia: 'barbearia ou salão de beleza',
  outro: 'estabelecimento comercial',
}

const TONE_INSTRUCTION: Record<LocationTone, string> = {
  formal: 'Use linguagem formal, profissional e respeitosa. Evite gírias.',
  amigavel: 'Use linguagem amigável, calorosa e próxima. Seja genuíno.',
  descontraido: 'Use linguagem descontraída e informal, mas ainda profissional.',
}

export async function generateReviewResponse({
  reviewContent,
  rating,
  authorName,
  niche,
  tone,
  businessName,
}: GenerateResponseParams): Promise<{ content: string; tokensUsed: number }> {
  const nicheContext = NICHE_CONTEXT[niche]
  const toneInstruction = TONE_INSTRUCTION[tone]
  const firstName = authorName?.split(' ')[0] ?? 'cliente'
  const isNegative = rating <= 2

  const systemPrompt = `Você é um especialista em gestão de reputação digital para ${nicheContext}.
Sua tarefa é responder reviews de clientes de forma autêntica, personalizada e eficaz.

Diretrizes:
- ${toneInstruction}
- Sempre mencione o nome do estabelecimento: ${businessName}
- Chame o cliente pelo primeiro nome quando disponível
- Para reviews negativos (1-2 estrelas): reconheça o problema, peça desculpas sinceras, ofereça resolver, não seja defensivo
- Para reviews positivos (4-5 estrelas): agradeça com entusiasmo, reforce o diferencial mencionado
- Para reviews neutros (3 estrelas): agradeça, reconheça o feedback, mostre comprometimento com melhoria
- Resposta entre 3-6 frases. Nem muito curta, nem muito longa.
- NUNCA invente informações específicas que não estão no review
- NUNCA use templates genéricos óbvios`

  const userPrompt = `Review do cliente ${firstName} (${rating} estrela${rating > 1 ? 's' : ''}):
"${reviewContent || 'Sem comentário, apenas avaliação por estrelas.'}"

${isNegative ? 'ATENÇÃO: Review negativo. Priorize empatia e resolução.' : ''}

Escreva a resposta agora:`

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 300,
    temperature: 0.7,
  })

  const content = completion.choices[0]?.message?.content?.trim() ?? ''
  const tokensUsed = completion.usage?.total_tokens ?? 0

  return { content, tokensUsed }
}
