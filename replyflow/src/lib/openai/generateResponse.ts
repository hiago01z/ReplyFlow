import OpenAI from 'openai'
import type { LocationNiche, LocationTone } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Modelo configurável via env var — padrão gpt-4.1-mini (mais novo, mais barato)
// Alternativas: gpt-4o-mini, gpt-4o, gpt-4.1-nano
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini'

interface GenerateResponseParams {
  reviewContent: string
  rating: number
  authorName: string | null
  niche: LocationNiche
  tone: LocationTone
  businessName: string
}

const NICHE_CONTEXT: Record<LocationNiche, string> = {
  clinica: 'health clinic (medical, dental, aesthetic or similar)',
  restaurante: 'restaurant or food establishment',
  academia: 'gym or fitness studio',
  petshop: 'pet shop or veterinary clinic',
  barbearia: 'barbershop or beauty salon',
  outro: 'commercial establishment',
}

const TONE_INSTRUCTION: Record<LocationTone, string> = {
  formal: 'Use formal, professional and respectful language. Avoid slang.',
  amigavel: 'Use friendly, warm and approachable language. Be genuine.',
  descontraido: 'Use casual and informal language, but still professional.',
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
  const firstName = authorName?.split(' ')[0] ?? 'there'
  const isNegative = rating <= 2

  const systemPrompt = `You are a digital reputation management expert for a ${nicheContext}.
Your task is to reply to customer reviews in an authentic, personalized and effective way.

Guidelines:
- ${toneInstruction}
- Always mention the establishment name: ${businessName}
- Address the customer by their first name when available
- For negative reviews (1-2 stars): acknowledge the issue, apologize sincerely, offer to resolve it, never be defensive
- For positive reviews (4-5 stars): thank enthusiastically, reinforce the highlighted strength
- For neutral reviews (3 stars): thank, acknowledge the feedback, show commitment to improvement
- Keep the reply between 3-6 sentences. Not too short, not too long.
- NEVER invent specific details not mentioned in the review
- NEVER use obviously generic templates
- CRITICAL: Detect the language of the customer's review and write your reply EXCLUSIVELY in that same language. If the review is in English, reply in English. If in Spanish, reply in Spanish. If in Portuguese, reply in Portuguese. Never mix languages.`

  const userPrompt = `Customer review from ${firstName} (${rating} star${rating > 1 ? 's' : ''}):
"${reviewContent || '(No comment — star rating only.)'}"

${isNegative ? 'IMPORTANT: Negative review. Prioritize empathy and resolution.' : ''}

Write the reply now:`

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
