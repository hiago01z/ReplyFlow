/**
 * ReplyFlow - Teste interno da IA de respostas
 * Uso: node --env-file=.env.local scripts/test-ai.js
 *
 * Testa o generateResponse diretamente sem precisar de login,
 * navegador ou Google My Business.
 */

const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Configuracoes de nicho e tom (espelha generateResponse.ts) ──────────
const NICHE_CONTEXT = {
  clinica:    "clinica de saude (medica, odontologica, estetica ou similar)",
  restaurante:"restaurante ou estabelecimento de alimentacao",
  academia:   "academia ou estudio de fitness",
  petshop:    "pet shop ou clinica veterinaria",
  barbearia:  "barbearia ou salao de beleza",
  outro:      "estabelecimento comercial",
};

const TONE_INSTRUCTION = {
  formal:      "Use linguagem formal, profissional e respeitosa. Evite girias.",
  amigavel:    "Use linguagem amigavel, calorosa e proxima. Seja genuino.",
  descontraido:"Use linguagem descontraida e informal, mas ainda profissional.",
};

async function generateResponse({ reviewContent, rating, authorName, niche, tone, businessName }) {
  const nicheContext  = NICHE_CONTEXT[niche]  || NICHE_CONTEXT.outro;
  const toneInstr     = TONE_INSTRUCTION[tone] || TONE_INSTRUCTION.amigavel;
  const firstName     = authorName ? authorName.split(" ")[0] : "cliente";
  const isNegative    = rating <= 2;

  const systemPrompt = `Voce e um especialista em gestao de reputacao digital para ${nicheContext}.
Sua tarefa e responder reviews de clientes de forma autentica, personalizada e eficaz.

Diretrizes:
- ${toneInstr}
- Sempre mencione o nome do estabelecimento: ${businessName}
- Chame o cliente pelo primeiro nome quando disponivel
- Para reviews negativos (1-2 estrelas): reconheca o problema, peca desculpas sinceras, ofereca resolver, nao seja defensivo
- Para reviews positivos (4-5 estrelas): agradeca com entusiasmo, reforca o diferencial mencionado
- Para reviews neutros (3 estrelas): agradeca, reconheca o feedback, mostre comprometimento com melhoria
- Resposta entre 3-6 frases. Nem muito curta, nem muito longa.
- NUNCA invente informacoes especificas que nao estao no review
- NUNCA use templates genericos obvios`;

  const userPrompt = `Review do cliente ${firstName} (${rating} estrela${rating > 1 ? "s" : ""}):
"${reviewContent || "Sem comentario, apenas avaliacao por estrelas."}"
${isNegative ? "\nATENCAO: Review negativo. Priorize empatia e resolucao." : ""}

Escreva a resposta agora:`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  return {
    content:    completion.choices[0]?.message?.content?.trim() ?? "",
    tokensUsed: completion.usage?.total_tokens ?? 0,
    model:      completion.model,
  };
}

// ── Casos de teste ───────────────────────────────────────────────────────
const TEST_CASES = [
  {
    label: "Review POSITIVO (5 estrelas) - Clinica - Tom formal",
    params: {
      reviewContent: "Atendimento excelente! A doutora foi muito atenciosa e o consultorio e impecavel. Recomendo muito!",
      rating: 5,
      authorName: "Maria Silva",
      niche: "clinica",
      tone: "formal",
      businessName: "Clinica Saude Total",
    },
  },
  {
    label: "Review NEGATIVO (1 estrela) - Restaurante - Tom amigavel",
    params: {
      reviewContent: "Esperamos mais de 1 hora pela comida e quando chegou estava fria. Pessimo servico.",
      rating: 1,
      authorName: "Carlos Mendes",
      niche: "restaurante",
      tone: "amigavel",
      businessName: "Restaurante Sabor Caseiro",
    },
  },
  {
    label: "Review NEUTRO (3 estrelas) - Academia - Tom descontraido",
    params: {
      reviewContent: "Academia legal, equipamentos bons, mas o horario de pico fica muito cheio.",
      rating: 3,
      authorName: "Joao",
      niche: "academia",
      tone: "descontraido",
      businessName: "FitLife Academia",
    },
  },
  {
    label: "Review SEM TEXTO (4 estrelas) - Pet Shop - Tom amigavel",
    params: {
      reviewContent: "",
      rating: 4,
      authorName: null,
      niche: "petshop",
      tone: "amigavel",
      businessName: "PetAmor",
    },
  },
];

// ── Runner ───────────────────────────────────────────────────────────────
async function runTests() {
  console.log("\n================================================");
  console.log("  ReplyFlow - Teste de IA (gpt-4o-mini)");
  console.log("================================================\n");

  if (!process.env.OPENAI_API_KEY) {
    console.error("[ERRO] OPENAI_API_KEY nao encontrada.");
    console.error("  Rode: node --env-file=.env.local scripts/test-ai.js");
    process.exit(1);
  }

  console.log(`  API Key: ...${process.env.OPENAI_API_KEY.slice(-6)}`);
  console.log(`  Rodando ${TEST_CASES.length} testes...\n`);

  let passed = 0;
  let totalTokens = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const { label, params } = TEST_CASES[i];
    console.log(`[${i + 1}/${TEST_CASES.length}] ${label}`);
    console.log(`  Business: ${params.businessName} | Rating: ${"★".repeat(params.rating)}${"☆".repeat(5 - params.rating)} | Niche: ${params.niche}`);
    if (params.reviewContent) {
      console.log(`  Review: "${params.reviewContent.substring(0, 80)}..."`);
    } else {
      console.log(`  Review: (sem texto)`);
    }
    console.log("  Gerando resposta...");

    const start = Date.now();
    try {
      const result = await generateResponse(params);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      console.log(`\n  [OK] Resposta gerada em ${elapsed}s | ${result.tokensUsed} tokens | modelo: ${result.model}`);
      console.log("  -----------------------------------------------");
      console.log(`  ${result.content}`);
      console.log("  -----------------------------------------------\n");

      passed++;
      totalTokens += result.tokensUsed;
    } catch (err) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.error(`\n  [FALHA] ${elapsed}s - ${err.message}\n`);
      if (err.status === 401) {
        console.error("  Verifique: OPENAI_API_KEY invalida ou expirada.");
        break;
      }
      if (err.status === 429) {
        console.error("  Rate limit atingido. Aguarde e tente novamente.");
        break;
      }
    }
  }

  console.log("================================================");
  console.log(`  Resultado: ${passed}/${TEST_CASES.length} testes passaram`);
  console.log(`  Total de tokens usados: ${totalTokens}`);
  const cost = (totalTokens * 0.00000015).toFixed(6); // gpt-4o-mini input ~$0.15/1M tokens
  console.log(`  Custo estimado: ~$${cost} USD`);
  console.log("================================================\n");
}

runTests().catch((err) => {
  console.error("Erro fatal:", err.message);
  process.exit(1);
});
