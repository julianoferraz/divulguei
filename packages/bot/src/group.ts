import { proto, WASocket } from '@whiskeysockets/baileys';
import { query, redis, openai } from './config.js';
import { sendText } from './connection.js';

const DEFAULT_CITY_ID = process.env.DEFAULT_CITY_ID || '';
const COOLDOWN_SECONDS = 30;
const MAX_DAILY_MESSAGES = 50;

function getTextFromMessage(msg: proto.IWebMessageInfo): string {
  const m = msg.message;
  if (!m) return '';
  return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption || '';
}

async function classifyGroupMessage(text: string): Promise<string> {
  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      max_tokens: 50,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Você classifica mensagens em GRUPOS de WhatsApp de uma cidade.
Classifique em UMA categoria:
- question_recommendation: pergunta buscando recomendação de empresa/serviço/profissional
- sale_post: alguém vendendo/anunciando algo
- search_post: alguém procurando comprar/alugar algo
- general: conversa geral
Responda APENAS com a categoria.`,
        },
        { role: 'user', content: text },
      ],
    });
    return res.choices[0]?.message?.content?.trim()?.toLowerCase() || 'general';
  } catch {
    return 'general';
  }
}

async function isOnCooldown(groupJid: string): Promise<boolean> {
  const key = `bot:cooldown:${groupJid}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

async function setCooldown(groupJid: string): Promise<void> {
  await redis.set(`bot:cooldown:${groupJid}`, '1', 'EX', COOLDOWN_SECONDS);
}

async function checkDailyLimit(groupJid: string): Promise<boolean> {
  const result = await query(
    'SELECT daily_message_count, daily_limit FROM whatsapp_groups WHERE jid = $1',
    [groupJid]
  );
  if (result.rows.length === 0) return false;
  const row = result.rows[0];
  return (row.daily_message_count || 0) < (row.daily_limit || MAX_DAILY_MESSAGES);
}

async function incrementDailyCount(groupJid: string): Promise<void> {
  await query(
    'UPDATE whatsapp_groups SET daily_message_count = daily_message_count + 1 WHERE jid = $1',
    [groupJid]
  );
}

async function searchForRecommendation(text: string, cityId: string): Promise<string | null> {
  // Busca empresas relevantes
  const bizResult = await query(
    `SELECT name, phone, whatsapp, neighborhood, short_description FROM businesses
     WHERE city_id = $1 AND is_active = true
     AND (name ILIKE $2 OR short_description ILIKE $2 OR tags::text ILIKE $2)
     ORDER BY is_featured DESC, views DESC LIMIT 3`,
    [cityId, `%${text}%`]
  );

  // Busca profissionais
  const profResult = await query(
    `SELECT name, phone, whatsapp, specialty FROM professionals
     WHERE city_id = $1 AND is_active = true
     AND (name ILIKE $2 OR specialty ILIKE $2)
     ORDER BY created_at DESC LIMIT 3`,
    [cityId, `%${text}%`]
  );

  if (bizResult.rows.length === 0 && profResult.rows.length === 0) return null;

  let response = '💡 Posso ajudar! Encontrei no *Divulguei.Online*:\n';

  for (const b of bizResult.rows) {
    response += `\n🏪 *${b.name}*`;
    if (b.short_description) response += ` — ${b.short_description}`;
    if (b.phone) response += `\n   📞 ${b.phone}`;
    if (b.neighborhood) response += `\n   📍 ${b.neighborhood}`;
  }

  for (const p of profResult.rows) {
    response += `\n🔧 *${p.name}*`;
    if (p.specialty) response += ` — ${p.specialty}`;
    if (p.phone) response += `\n   📞 ${p.phone}`;
  }

  response += '\n\n🌐 Veja mais em divulguei.online';

  return response;
}

export async function handleGroupMessage(msg: proto.IWebMessageInfo, sock: WASocket): Promise<void> {
  const groupJid = msg.key.remoteJid!;
  const text = getTextFromMessage(msg);

  if (!text || text.length < 5) return;

  // Check if group is registered and active
  const groupResult = await query(
    'SELECT id, city_id, is_active FROM whatsapp_groups WHERE jid = $1 AND is_active = true',
    [groupJid]
  );

  if (groupResult.rows.length === 0) {
    // Auto-register new groups
    try {
      const metadata = await sock.groupMetadata(groupJid);
      await query(
        `INSERT INTO whatsapp_groups (city_id, jid, name, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (jid) DO UPDATE SET name = $3`,
        [DEFAULT_CITY_ID, groupJid, metadata.subject]
      );
    } catch { /* ignore */ }
    return;
  }

  const cityId = groupResult.rows[0].city_id || DEFAULT_CITY_ID;

  // Cooldown check
  if (await isOnCooldown(groupJid)) return;

  // Daily limit check
  if (!(await checkDailyLimit(groupJid))) return;

  // Classify message
  const classification = await classifyGroupMessage(text);

  if (classification === 'general') return;

  // Handle relevant messages
  switch (classification) {
    case 'question_recommendation': {
      const response = await searchForRecommendation(text, cityId);
      if (response) {
        await sendText(groupJid, response);
        await setCooldown(groupJid);
        await incrementDailyCount(groupJid);
      }
      break;
    }

    case 'sale_post': {
      // Encourage using the classified system
      await sendText(groupJid,
        `📢 *Dica:* Divulgue seu anúncio no *Divulguei.Online* para alcançar mais pessoas! 🌐\n\n` +
        `Envie uma mensagem privada para o bot ou acesse divulguei.online para publicar grátis.`
      );
      await setCooldown(groupJid);
      await incrementDailyCount(groupJid);
      break;
    }

    case 'search_post': {
      const response = await searchForRecommendation(text, cityId);
      if (response) {
        await sendText(groupJid, response);
        await setCooldown(groupJid);
        await incrementDailyCount(groupJid);
      }
      break;
    }
  }

  // Log interaction
  await query(
    `INSERT INTO interactions (city_id, module, query, source) VALUES ($1, 'group_message', $2, 'whatsapp_group')`,
    [cityId, text.slice(0, 200)]
  ).catch(() => {});
}
