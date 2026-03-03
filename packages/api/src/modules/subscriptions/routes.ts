import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success } from '../../utils/response';
import { adminMiddleware } from '../../middleware/auth';

export async function subscriptionsRoutes(app: FastifyInstance) {
  app.get('/api/admin/subscriptions', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const result = await query(
      `SELECT s.*, b.name as business_name, b.slug as business_slug, c.name as city_name
       FROM subscriptions s
       JOIN businesses b ON s.business_id = b.id
       JOIN cities c ON b.city_id = c.id
       ORDER BY s.created_at DESC`
    );
    return reply.send(success(result.rows));
  });

  app.post('/api/admin/subscriptions', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const body = request.body as any;
    const result = await query(
      `INSERT INTO subscriptions (business_id, plan, price, expires_at, payment_method, payment_reference)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [body.business_id, body.plan, body.price, body.expires_at,
       body.payment_method || null, body.payment_reference || null]
    );

    // Update business plan
    await query('UPDATE businesses SET plan = $1 WHERE id = $2', [body.plan, body.business_id]);

    return reply.status(201).send(success(result.rows[0]));
  });
}
