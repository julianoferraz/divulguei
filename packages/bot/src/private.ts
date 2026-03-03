import { proto, WASocket } from '@whiskeysockets/baileys';
import { query, redis, openai } from './config.js';
import { sendText } from './connection.js';
import { transcribeAudio, extractTextFromImage } from './media.js';

const ADMIN_PHONE = process.env.ADMIN_PHONE || '';
const DEFAULT_CITY_ID = process.env.DEFAULT_CITY_ID || '';
const BOT_NAME = 'Divulguei';

// User session states in Redis
type SessionState = 'idle' | 'awaiting_search' | 'creating_classified' | 'creating_alert' | 'awaiting_classified_title' | 'awaiting_classified_desc' | 'awaiting_classified_price' | 'awaiting_classified_phone';

async function getSession(phone: string): Promise<{ state: SessionState; data: any }> {
  const raw = await redis.get(`bot:session:${phone}`);
  return raw ? JSON.parse(raw) : { state: 'idle', data: {} };
}

async function setSession(phone: string, state: SessionState, data: any = {}) {
  await redis.set(`bot:session:${phone}`, JSON.stringify({ state, data }), 'EX', 600); // 10 min TTL
}

async function clearSession(phone: string) {
  await redis.del(`bot:session:${phone}`);
}

function getPhoneFromJid(jid: string): string {
  return jid.replace('@s.whatsapp.net', '');
}

function getTextFromMessage(msg: proto.IWebMessageInfo): string {
  const m = msg.message;
  if (!m) return '';
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.buttonsResponseMessage?.selectedButtonId ||
    ''
  );
}

async function classifyIntent(text: string): Promise<string> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      max_tokens: 50,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Você classifica intenções de mensagens enviadas a um bot de guia comercial de uma cidade.
Classifique a mensagem em UMA das categorias:
- greeting: saudação (oi, olá, bom dia)
- search: busca por empresa, serviço, produto ou profissional
- classified_create: quer criar um anúncio/classificado
- alert_create: quer receber alertas sobre algo
- help: pede ajuda ou quer ver o menu
- other: qualquer outra coisa
Responda APENAS com a categoria.`,
        },
        { role: 'user', content: text },
      ],
    });
    return res.choices[0]?.message?.content?.trim()?.toLowerCase() || 'other';
  } catch {
    return 'other';
  }
}

async function searchDatabase(searchText: string, cityId: string): Promise<string> {
  // Search businesses
  const bizResult = await query(
    `SELECT name, phone, whatsapp, neighborhood, description FROM businesses
     WHERE city_id = $1 AND is_active = true
     AND (name ILIKE $2 OR description ILIKE $2)
     ORDER BY is_featured DESC, views_count DESC LIMIT 5`,
    [cityId, `%${searchText}%`]
  );

  // Search classifieds
  const classResult = await query(
    `SELECT title, price, contact_phone, neighborhood FROM classifieds
     WHERE city_id = $1 AND status = 'active'
     AND (title ILIKE $2 OR description ILIKE $2)
     ORDER BY created_at DESC LIMIT 5`,
    [cityId, `%${searchText}%`]
  );

  // Search professionals
  const profResult = await query(
    `SELECT name, phone, whatsapp, services_offered FROM professionals
     WHERE city_id = $1 AND is_active = true
     AND (name ILIKE $2 OR services_offered ILIKE $2 OR description ILIKE $2)
     ORDER BY created_at DESC LIMIT 5`,
    [cityId, `%${searchText}%`]
  );

  let response = '';

  if (bizResult.rows.length > 0) {
    response += '🏪 *Empresas encontradas:*\n';
    for (const b of bizResult.rows) {
      response += `\n• *${b.name}*`;
      if (b.description) response += ` — ${b.description.slice(0, 60)}`;
      if (b.phone) response += `\n  📞 ${b.phone}`;
      if (b.whatsapp) response += `\n  📱 wa.me/${b.whatsapp}`;
      if (b.neighborhood) response += `\n  📍 ${b.neighborhood}`;
    }
    response += '\n';
  }

  if (classResult.rows.length > 0) {
    response += '\n📦 *Classificados:*\n';
    for (const c of classResult.rows) {
      response += `\n• *${c.title}*`;
      if (c.price) response += ` — R$ ${Number(c.price).toFixed(2)}`;
      if (c.contact_phone) response += `\n  📞 ${c.contact_phone}`;
      if (c.neighborhood) response += `\n  📍 ${c.neighborhood}`;
    }
    response += '\n';
  }

  if (profResult.rows.length > 0) {
    response += '\n🔧 *Profissionais:*\n';
    for (const p of profResult.rows) {
      response += `\n• *${p.name}*`;
      if (p.services_offered) response += ` — ${p.services_offered.slice(0, 60)}`;
      if (p.phone) response += `\n  📞 ${p.phone}`;
      if (p.whatsapp) response += `\n  📱 wa.me/${p.whatsapp}`;
    }
  }

  if (!response) {
    response = `😔 Não encontrei resultados para "${searchText}". Tente buscar com outras palavras.`;
  }

  // Log the search interaction
  await query(
    `INSERT INTO interactions (city_id, source, type, query) VALUES ($1, 'whatsapp_private', 'search', $2)`,
    [cityId, searchText]
  );

  return response;
}

const WELCOME_MESSAGE = `Olá! 👋 Sou o *${BOT_NAME}*, seu assistente digital.

Posso te ajudar a:
🔍 *Buscar* empresas, serviços e profissionais
📦 *Criar* anúncios de classificados
🔔 *Configurar alertas* para novidades

📝 O que você precisa? Pode me perguntar diretamente!

_Ex: "pizzaria aberta agora", "casa pra alugar", "eletricista"_`;

const HELP_MESSAGE = `📋 *Como posso ajudar:*

🔍 Para *buscar*, digite o que procura
  _Ex: farmácia, casa aluguel_

📦 Para *anunciar*, diga "quero anunciar"

🔔 Para *alertas*, diga "quero alerta"

🌐 Acesse também: divulguei.online

_Envie áudios ou fotos que eu também entendo! 🎤📸_`;

export async function handlePrivateMessage(msg: proto.IWebMessageInfo, sock: WASocket): Promise<void> {
  const jid = msg.key.remoteJid!;
  const phone = getPhoneFromJid(jid);
  const text = getTextFromMessage(msg);

  // Handle audio messages
  if (msg.message?.audioMessage) {
    await sendText(jid, '🎤 Processando seu áudio...');
    const transcription = await transcribeAudio(msg, sock);
    if (transcription) {
      await handleTextInput(jid, phone, transcription);
    } else {
      await sendText(jid, '❌ Não consegui entender o áudio. Tente enviar em texto.');
    }
    return;
  }

  // Handle image messages
  if (msg.message?.imageMessage) {
    await sendText(jid, '📸 Analisando sua imagem...');
    const description = await extractTextFromImage(msg, sock);
    if (description) {
      await sendText(jid, `📝 Entendi: *${description}*\n\nBuscando...`);
      const results = await searchDatabase(description, DEFAULT_CITY_ID);
      await sendText(jid, results);
    } else {
      await sendText(jid, '❌ Não consegui analisar a imagem. Descreva em texto o que precisa.');
    }
    return;
  }

  if (!text) return;

  await handleTextInput(jid, phone, text);
}

async function handleTextInput(jid: string, phone: string, text: string): Promise<void> {
  const session = await getSession(phone);

  // Handle session states
  switch (session.state) {
    case 'awaiting_classified_title':
      await setSession(phone, 'awaiting_classified_desc', { ...session.data, title: text });
      await sendText(jid, '📝 Agora descreva o item (detalhes, estado, etc):');
      return;

    case 'awaiting_classified_desc':
      await setSession(phone, 'awaiting_classified_price', { ...session.data, description: text });
      await sendText(jid, '💰 Qual o preço? (ou digite "gratuito" se for doação):');
      return;

    case 'awaiting_classified_price': {
      const price = text.toLowerCase() === 'gratuito' ? 0 : parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
      await setSession(phone, 'awaiting_classified_phone', { ...session.data, price: isNaN(price) ? 0 : price });
      await sendText(jid, '📱 Seu telefone para contato:');
      return;
    }

    case 'awaiting_classified_phone': {
      const data = { ...session.data, contact_phone: text.replace(/\D/g, '') };
      // Create classified
      try {
        await query(
          `INSERT INTO classifieds (city_id, title, description, type, price, contact_phone, contact_name, status)
           VALUES ($1, $2, $3, 'sell', $4, $5, $6, 'active')`,
          [DEFAULT_CITY_ID, data.title, data.description, data.price, data.contact_phone, phone]
        );
        await clearSession(phone);
        await sendText(jid, `✅ Anúncio criado com sucesso!\n\n📦 *${data.title}*\n💰 R$ ${(data.price || 0).toFixed(2)}\n\n🌐 Disponível em divulguei.online`);
      } catch (err) {
        console.error('Error creating classified:', err);
        await clearSession(phone);
        await sendText(jid, '❌ Erro ao criar anúncio. Tente novamente mais tarde.');
      }
      return;
    }

    default:
      break;
  }

  // Classify intent
  const intent = await classifyIntent(text);

  switch (intent) {
    case 'greeting':
      await sendText(jid, WELCOME_MESSAGE);
      break;

    case 'help':
      await sendText(jid, HELP_MESSAGE);
      break;

    case 'search': {
      await sendText(jid, `🔍 Buscando por "${text}"...`);
      const results = await searchDatabase(text, DEFAULT_CITY_ID);
      await sendText(jid, results);
      break;
    }

    case 'classified_create':
      await setSession(phone, 'awaiting_classified_title');
      await sendText(jid, '📦 Vamos criar seu anúncio!\n\nQual o *título* do produto/serviço?');
      break;

    case 'alert_create': {
      // Extract keyword
      const keyword = text.replace(/quero\s+alerta\s*/i, '').replace(/alerta\s+para\s*/i, '').trim();
      if (keyword) {
        // Find or create user
        let userResult = await query('SELECT id FROM users WHERE phone = $1', [phone]);
        if (userResult.rows.length === 0) {
          userResult = await query('INSERT INTO users (phone, role) VALUES ($1, $2) RETURNING id', [phone, 'resident']);
        }
        const userId = userResult.rows[0].id;

        await query(
          'INSERT INTO alerts (city_id, user_id, user_phone, alert_type, keywords) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
          [DEFAULT_CITY_ID, userId, phone, 'classified', keyword]
        );
        await sendText(jid, `🔔 Alerta criado para "*${keyword}*"!\n\nVou te avisar quando algo novo aparecer.`);
      } else {
        await sendText(jid, '🔔 Para qual palavra-chave quer receber alertas?\n\n_Ex: "alerta para casa aluguel"_');
      }
      break;
    }

    default:
      // Try search as fallback
      await sendText(jid, `🔍 Buscando por "${text}"...`);
      const results = await searchDatabase(text, DEFAULT_CITY_ID);
      await sendText(jid, results);
      break;
  }
}
