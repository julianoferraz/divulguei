import { FastifyInstance } from 'fastify';
import { redis } from '../../config/redis';
import { query } from '../../config/database';
import { requestCodeSchema, verifyCodeSchema } from './schema';
import { generateRandomCode } from '../../utils/helpers';
import { success, error } from '../../utils/response';

export async function authRoutes(app: FastifyInstance) {
  // Request WhatsApp verification code
  app.post('/api/auth/whatsapp/request-code', async (request, reply) => {
    const parsed = requestCodeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error(parsed.error.errors[0].message));
    }

    const { phone } = parsed.data;
    const code = generateRandomCode(6);

    // Store code in Redis with 5-minute TTL
    await redis.set(`auth:code:${phone}`, code, 'EX', 300);

    // In production, the bot would send this code via WhatsApp
    // For now, log it (the bot service will pick it up from Redis)
    console.log(`[AUTH] Code for ${phone}: ${code}`);

    // Queue the message for the bot to send
    await redis.lpush('bot:send-code', JSON.stringify({ phone, code }));

    return reply.send(success({ message: 'Código enviado via WhatsApp' }));
  });

  // Verify WhatsApp code
  app.post('/api/auth/whatsapp/verify-code', async (request, reply) => {
    const parsed = verifyCodeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error(parsed.error.errors[0].message));
    }

    const { phone, code } = parsed.data;
    const storedCode = await redis.get(`auth:code:${phone}`);

    if (!storedCode || storedCode !== code) {
      return reply.status(401).send(error('Código inválido ou expirado'));
    }

    // Delete the code
    await redis.del(`auth:code:${phone}`);

    // Find or create user
    let userResult = await query('SELECT * FROM users WHERE phone = $1', [phone]);

    if (userResult.rows.length === 0) {
      userResult = await query(
        `INSERT INTO users (phone, role, auth_provider) VALUES ($1, 'resident', 'whatsapp') RETURNING *`,
        [phone]
      );
    }

    const user = userResult.rows[0];

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Generate JWT
    const token = app.jwt.sign(
      { id: user.id, phone: user.phone, role: user.role, city_id: user.city_id },
      { expiresIn: '30d' }
    );

    return reply.send(success({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        city_id: user.city_id,
      },
    }));
  });

  // Google OAuth
  app.post('/api/auth/google', async (request, reply) => {
    const body = request.body as any;
    if (!body?.token) {
      return reply.status(400).send(error('Token do Google é obrigatório'));
    }

    try {
      // Verify Google token by calling Google's tokeninfo endpoint
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${body.token}`);
      if (!response.ok) {
        return reply.status(401).send(error('Token do Google inválido'));
      }

      const googleUser = await response.json() as any;
      const email = googleUser.email;
      const name = googleUser.name;

      if (!email) {
        return reply.status(401).send(error('Email não encontrado no token'));
      }

      // Find or create user
      let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (userResult.rows.length === 0) {
        userResult = await query(
          `INSERT INTO users (name, email, auth_provider, avatar_url) VALUES ($1, $2, 'google', $3) RETURNING *`,
          [name, email, googleUser.picture || null]
        );
      }

      const user = userResult.rows[0];
      await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

      const token = app.jwt.sign(
        { id: user.id, email: user.email, role: user.role, city_id: user.city_id },
        { expiresIn: '30d' }
      );

      return reply.send(success({
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          city_id: user.city_id,
        },
      }));
    } catch (err) {
      console.error('Google auth error:', err);
      return reply.status(500).send(error('Erro ao autenticar com Google'));
    }
  });

  // Get current user profile
  app.get('/api/me', { preHandler: [async (req, rep) => { await req.jwtVerify(); }] }, async (request, reply) => {
    const user = request.user as any;
    const result = await query('SELECT id, name, phone, email, role, avatar_url, city_id, created_at FROM users WHERE id = $1', [user.id]);

    if (result.rows.length === 0) {
      return reply.status(404).send(error('Usuário não encontrado'));
    }

    return reply.send(success(result.rows[0]));
  });

  // Update current user profile
  app.put('/api/me', { preHandler: [async (req, rep) => { await req.jwtVerify(); }] }, async (request, reply) => {
    const user = request.user as any;
    const body = request.body as any;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.name !== undefined) { fields.push(`name = $${idx++}`); values.push(body.name); }
    if (body.email !== undefined) { fields.push(`email = $${idx++}`); values.push(body.email); }
    if (body.city_id !== undefined) { fields.push(`city_id = $${idx++}`); values.push(body.city_id); }
    if (body.avatar_url !== undefined) { fields.push(`avatar_url = $${idx++}`); values.push(body.avatar_url); }

    if (fields.length === 0) {
      return reply.status(400).send(error('Nenhum campo para atualizar'));
    }

    fields.push(`updated_at = NOW()`);
    values.push(user.id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, phone, email, role, avatar_url, city_id`,
      values
    );

    return reply.send(success(result.rows[0]));
  });
}
