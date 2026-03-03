import { proto, WASocket, downloadMediaMessage } from '@whiskeysockets/baileys';
import { openai } from './config.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Transcribe audio message using OpenAI Whisper
 */
export async function transcribeAudio(msg: proto.IWebMessageInfo, sock: WASocket): Promise<string | null> {
  const tmpFile = path.join(os.tmpdir(), `audio_${Date.now()}.ogg`);
  try {
    const buffer = await downloadMediaMessage(msg, 'buffer', {});
    if (!buffer) return null;

    // Write to temp file
    fs.writeFileSync(tmpFile, buffer as Buffer);

    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: fs.createReadStream(tmpFile),
      language: 'pt',
    });

    return transcription.text || null;
  } catch (err) {
    console.error('Whisper transcription error:', err);
    return null;
  } finally {
    // Always cleanup temp file
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

/**
 * Extract text/information from image using GPT-4o Vision
 */
export async function extractTextFromImage(msg: proto.IWebMessageInfo, sock: WASocket): Promise<string | null> {
  try {
    const buffer = await downloadMediaMessage(msg, 'buffer', {});
    if (!buffer) return null;

    const base64 = (buffer as Buffer).toString('base64');
    const mimeType = msg.message?.imageMessage?.mimetype || 'image/jpeg';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'Extraia as informações principais da imagem. Se for um produto à venda, extraia: nome do produto, preço, descrição. Se for um cartaz de evento, extraia: nome, data, local. Se for uma busca, extraia o que a pessoa procura. Responda de forma concisa em português.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    });

    return response.choices[0]?.message?.content || null;
  } catch (err) {
    console.error('Vision extraction error:', err);
    return null;
  }
}
