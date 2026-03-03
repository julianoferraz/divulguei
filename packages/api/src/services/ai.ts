import OpenAI from 'openai';
import { env } from '../config/env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface IntentResult {
  intent: 'business_search' | 'classified_search' | 'professional_search' | 'job_search' | 'event_search' | 'public_service_search' | 'general';
  keywords: string[];
  category_hint: string | null;
  filters: {
    neighborhood?: string | null;
    price_min?: number | null;
    price_max?: number | null;
    open_now?: boolean;
    type?: string | null;
  };
  confidence: number;
}

export interface GroupClassification {
  type: 'question_recommendation' | 'sale_post' | 'search_post' | 'irrelevant';
  keywords: string[];
  confidence: number;
}

export async function classifyIntent(query: string, cityName: string): Promise<IntentResult> {
  const systemPrompt = `Você é o classificador de intenções do Divulguei.Online, um guia comercial e classificados para a cidade de ${cityName}. Analise a mensagem do usuário e retorne APENAS um JSON com a estrutura abaixo, sem nenhum texto adicional:
{
  "intent": "business_search" | "classified_search" | "professional_search" | "job_search" | "event_search" | "public_service_search" | "general",
  "keywords": ["palavra1", "palavra2"],
  "category_hint": "nome da categoria sugerida ou null",
  "filters": {
    "neighborhood": "bairro mencionado ou null",
    "price_min": número ou null,
    "price_max": número ou null,
    "open_now": true/false,
    "type": "sell/buy/rent_offer/rent_search/service ou null"
  },
  "confidence": 0.0 a 1.0
}
Exemplos:
- "pizzaria aberta agora" → intent: business_search, keywords: ["pizzaria"], filters: { open_now: true }
- "casa pra alugar no centro" → intent: classified_search, keywords: ["casa"], filters: { type: "rent_offer", neighborhood: "centro" }
- "eletricista bom" → intent: professional_search, keywords: ["eletricista"]
- "vaga de atendente" → intent: job_search, keywords: ["atendente"]
- "festa nesse fim de semana" → intent: event_search, keywords: ["festa"]
- "número do SAMU" → intent: public_service_search, keywords: ["SAMU"]`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content?.trim() || '{}';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as IntentResult;
  } catch (err) {
    console.error('Error classifying intent:', err);
    return {
      intent: 'general',
      keywords: query.split(' ').filter(w => w.length > 2),
      category_hint: null,
      filters: {},
      confidence: 0.3,
    };
  }
}

export async function classifyGroupMessage(message: string): Promise<GroupClassification> {
  const systemPrompt = `Classifique esta mensagem de grupo de WhatsApp. Retorne APENAS um JSON:
{
  "type": "question_recommendation" | "sale_post" | "search_post" | "irrelevant",
  "keywords": ["palavras-chave"],
  "confidence": 0.0 a 1.0
}
Só classifique como question_recommendation se for claramente uma pergunta pedindo indicação de empresa, serviço ou profissional. Exemplos: "alguém indica pizzaria?", "conhecem eletricista bom?", "onde compro material de construção?"
Classifique como sale_post se a pessoa está anunciando algo para vender, alugar ou oferecer um serviço.
Classifique como search_post se a pessoa está procurando comprar, alugar ou contratar algo.
Na dúvida, retorne "irrelevant". É melhor não responder do que responder errado.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content?.trim() || '{}';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as GroupClassification;
  } catch (err) {
    console.error('Error classifying group message:', err);
    return { type: 'irrelevant', keywords: [], confidence: 0 };
  }
}

export async function improveClassifiedDescription(rawText: string): Promise<string> {
  const systemPrompt = `Você é o assistente de criação de anúncios do Divulguei.Online. O usuário descreveu um item que quer anunciar. Sua tarefa é melhorar o texto para ficar claro, organizado e atrativo, mantendo TODAS as informações originais. Não invente dados. Não adicione informações que o usuário não mencionou. Use linguagem simples e direta, adequada para classificados em cidade pequena do interior do Brasil. Retorne apenas o texto melhorado, sem explicações.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content?.trim() || rawText;
  } catch (err) {
    console.error('Error improving description:', err);
    return rawText;
  }
}

export interface ExtractedData {
  type: 'business_profile' | 'product' | 'menu' | 'unknown';
  data: Record<string, any>;
}

export async function extractDataFromImage(imageBase64: string, context: string): Promise<ExtractedData> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Analise a imagem e extraia dados estruturados. Contexto: ${context}. Retorne APENAS um JSON com a estrutura: { "type": "business_profile" | "product" | "menu" | "unknown", "data": { ... } }. Para business_profile, extraia: name, description, phone, instagram, address. Para product, extraia: title, description, estimated_price. Para menu, extraia: items (array com name e price).`,
        },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
          ],
        },
      ],
      temperature: 0,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content?.trim() || '{}';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as ExtractedData;
  } catch (err) {
    console.error('Error extracting data from image:', err);
    return { type: 'unknown', data: {} };
  }
}

export async function generateBusinessDescription(businessData: Record<string, any>): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Gere uma descrição curta e amigável para uma empresa de cidade pequena do Brasil. Use linguagem simples e direta. Máximo 2 parágrafos. Retorne apenas o texto, sem explicações.',
        },
        {
          role: 'user',
          content: JSON.stringify(businessData),
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (err) {
    console.error('Error generating business description:', err);
    return '';
  }
}
