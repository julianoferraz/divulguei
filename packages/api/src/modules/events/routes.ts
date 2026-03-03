import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error, paginated } from '../../utils/response';
import { parsePageParams } from '../../utils/helpers';
import { cityContextMiddleware } from '../../middleware/city-context';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { z } from 'zod';

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  category_id: z.string().uuid().optional(),
  description: z.string().optional(),
  image_url: z.string().optional(),
  venue_name: z.string().optional(),
  venue_address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  starts_at: z.string().min(1),
  ends_at: z.string().optional(),
  entry_price: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_whatsapp: z.string().optional(),
});

export async function eventsRoutes(app: FastifyInstance) {
  app.get('/api/:citySlug/events', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { page, limit, offset } = parsePageParams(request.query as any);
    const { category_id, date_from, date_to } = request.query as any;

    let where = 'e.city_id = $1 AND e.is_approved = true AND e.starts_at >= NOW()';
    const params: any[] = [request.cityId];
    let idx = 2;

    if (category_id) { where += ` AND e.category_id = $${idx}`; params.push(category_id); idx++; }
    if (date_from) { where += ` AND e.starts_at >= $${idx}`; params.push(date_from); idx++; }
    if (date_to) { where += ` AND e.starts_at <= $${idx}`; params.push(date_to); idx++; }

    const countResult = await query(`SELECT COUNT(*) FROM events e WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon
       FROM events e LEFT JOIN categories c ON e.category_id = c.id
       WHERE ${where} ORDER BY e.starts_at ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return reply.send(paginated(result.rows, total, page, limit));
  });

  app.get('/api/:citySlug/events/:id', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const result = await query(
      `SELECT e.*, c.name as category_name, c.icon as category_icon
       FROM events e LEFT JOIN categories c ON e.category_id = c.id
       WHERE e.id = $1 AND e.city_id = $2`,
      [id, request.cityId]
    );

    if (result.rows.length === 0) return reply.status(404).send(error('Evento não encontrado'));

    await query('UPDATE events SET views_count = views_count + 1 WHERE id = $1', [id]);
    await query(`INSERT INTO interactions (city_id, source, type) VALUES ($1, 'web', 'event_view')`, [request.cityId]);

    return reply.send(success(result.rows[0]));
  });

  app.post('/api/:citySlug/events', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const parsed = createEventSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(error(parsed.error.errors[0].message));

    const data = parsed.data;
    const user = request.user as any;

    const result = await query(
      `INSERT INTO events (city_id, category_id, user_id, title, description, image_url,
        venue_name, venue_address, latitude, longitude, starts_at, ends_at,
        entry_price, contact_phone, contact_whatsapp, is_approved)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [request.cityId, data.category_id || null, user.id, data.title,
       data.description || null, data.image_url || null, data.venue_name || null,
       data.venue_address || null, data.latitude || null, data.longitude || null,
       data.starts_at, data.ends_at || null, data.entry_price || null,
       data.contact_phone || null, data.contact_whatsapp || null,
       user.role === 'admin']
    );

    return reply.status(201).send(success(result.rows[0]));
  });

  app.put('/api/:citySlug/events/:id', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    const body = request.body as any;

    const existing = await query('SELECT * FROM events WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) return reply.status(404).send(error('Evento não encontrado'));
    if (user.role !== 'admin' && existing.rows[0].user_id !== user.id) return reply.status(403).send(error('Sem permissão'));

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const field of ['title', 'description', 'image_url', 'venue_name', 'venue_address', 'latitude', 'longitude', 'starts_at', 'ends_at', 'entry_price', 'contact_phone', 'contact_whatsapp', 'category_id', 'is_featured']) {
      if (body[field] !== undefined) { fields.push(`${field} = $${idx++}`); values.push(body[field]); }
    }
    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(`UPDATE events SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return reply.send(success(result.rows[0]));
  });

  // Admin: approve event
  app.put('/api/admin/events/:id/approve', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const result = await query('UPDATE events SET is_approved = true WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return reply.status(404).send(error('Evento não encontrado'));
    return reply.send(success(result.rows[0]));
  });

  app.delete('/api/:citySlug/events/:id', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;

    const existing = await query('SELECT * FROM events WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) return reply.status(404).send(error('Evento não encontrado'));
    if (user.role !== 'admin' && existing.rows[0].user_id !== user.id) return reply.status(403).send(error('Sem permissão'));

    await query('DELETE FROM events WHERE id = $1', [id]);
    return reply.send(success({ deleted: true }));
  });
}
