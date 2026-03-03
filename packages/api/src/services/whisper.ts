import OpenAI from 'openai';
import { env } from '../config/env';

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string = 'audio/ogg'): Promise<string> {
  try {
    // Convert buffer to a File-like object for the API
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'webm';
    const file = new File([audioBuffer], `audio.${ext}`, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'pt',
    });

    return transcription.text;
  } catch (err) {
    console.error('Error transcribing audio:', err);
    throw new Error('Falha ao transcrever áudio');
  }
}
