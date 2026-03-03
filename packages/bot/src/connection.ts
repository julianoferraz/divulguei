import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeInMemoryStore,
  WASocket,
  BaileysEventMap,
  proto,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import path from 'path';

const logger = pino({ level: 'warn' });

let sock: WASocket | null = null;
const AUTH_DIR = process.env.BOT_AUTH_DIR || './auth_info';

const store = makeInMemoryStore({ logger });

export async function startConnection(
  onMessage: (msg: proto.IWebMessageInfo, sock: WASocket) => void,
  onGroupMessage: (msg: proto.IWebMessageInfo, sock: WASocket) => void,
): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: true,
    browser: ['Divulguei Bot', 'Chrome', '1.0.0'],
    syncFullHistory: false,
  });

  store.bind(sock.ev);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📱 Escaneie o QR Code acima para conectar o bot');
    }

    if (connection === 'close') {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log(`❌ Conexão fechada. Motivo: ${reason}. Reconectando: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(() => startConnection(onMessage, onGroupMessage), 5000);
      } else {
        console.log('🔒 Bot deslogado. Escaneie o QR Code novamente.');
      }
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado ao WhatsApp!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message) continue;
      if (msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid) continue;

      try {
        if (jid.endsWith('@g.us')) {
          // Group message
          await onGroupMessage(msg, sock!);
        } else if (jid.endsWith('@s.whatsapp.net')) {
          // Private message
          await onMessage(msg, sock!);
        }
      } catch (err) {
        console.error('❌ Erro ao processar mensagem:', err);
      }
    }
  });

  return sock;
}

export function getSocket(): WASocket | null {
  return sock;
}

export async function sendText(jid: string, text: string): Promise<void> {
  if (!sock) throw new Error('Bot não conectado');
  await sock.sendMessage(jid, { text });
}

export async function sendImage(jid: string, url: string, caption?: string): Promise<void> {
  if (!sock) throw new Error('Bot não conectado');
  await sock.sendMessage(jid, { image: { url }, caption });
}

export async function sendButtons(jid: string, text: string, buttons: { id: string; text: string }[]): Promise<void> {
  if (!sock) throw new Error('Bot não conectado');
  // Baileys v6: Buttons deprecated by WhatsApp — use sections/list message instead
  const sections = [{
    title: '',
    rows: buttons.map(b => ({ title: b.text, rowId: b.id })),
  }];
  await sock.sendMessage(jid, {
    text,
    footer: 'Divulguei.Online',
    title: '',
    buttonText: 'Opções',
    sections,
  } as any);
}
