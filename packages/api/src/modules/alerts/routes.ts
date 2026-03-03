import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error } from '../../utils/response';
import { cityContextMiddleware } from '../../middleware/city-context';
import { authMiddleware } from '../../middleware/auth';
import { z } from 'zod';

const createAlertSchema = z.object({
  alert_type: z.enum(['classified', 'job', 'event', 'business_promotion']),
  keywords: z.string().optional(),
  category_id: z.string().uuid().optional(),
  filters: z.any().optional(),
});

export async function alertsRoutes(app: FastifyInstance) {
  // Create alert
  app.post('/api/:citySlug/alerts', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const parsed = createAlertSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(error(parsed.error.errors[0].message));

    const data = parsed.data;
    const user = request.user as any;

    const result = await query(
      `INSERT INTO alerts (city_id, user_id, user_phone, alert_type, keywords, category_id, filters)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [request.cityId, user.id, user.phone || '', data.alert_type,
       data.keywords || null, data.category_id || null,
       data.filters ? JSON.stringify(data.filters) : null]
    );

    await query(
      `INSERT INTO interactions (city_id, source, type, user_phone) VALUES ($1, 'web', 'alert_created', $2)`,
      [request.cityId, user.phone]
    );

    return reply.status(201).send(success(result.rows[0]));
  });

  // List my alerts
  app.get('/api/me/alerts', { preHandler: [authMiddleware] }, async (request, reply) => {
    const user = request.user as any;
    const result = await query(
      `SELECT a.*, c.name as category_name
       FROM alerts a LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.user_id = $1 ORDER BY a.created_at DESC`,
      [user.id]
    );
    return reply.send(success(result.rows));
  });

  // Delete my alert
  app.delete('/api/me/alerts/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;

    const result = await query('DELETE FROM alerts WHERE id = $1 AND user_id = $2 RETURNING id', [id, user.id]);
    if (result.rows.length === 0) return reply.status(404).send(error('Alerta não encontrado'));
    return reply.send(success({ deleted: true }));
  });
}
