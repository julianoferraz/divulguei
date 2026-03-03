import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error, paginated } from '../../utils/response';
import { parsePageParams } from '../../utils/helpers';
import { cityContextMiddleware } from '../../middleware/city-context';
import { authMiddleware } from '../../middleware/auth';
import { z } from 'zod';

const createProfessionalSchema = z.object({
  name: z.string().min(1).max(200),
  category_id: z.string().uuid().optional(),
  description: z.string().optional(),
  photo_url: z.string().optional(),
  services_offered: z.string().optional(),
  service_area: z.string().optional(),
  neighborhood: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
});

export async function professionalsRoutes(app: FastifyInstance) {
  app.get('/api/:citySlug/professionals', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { page, limit, offset } = parsePageParams(request.query as any);
    const { category_id, neighborhood, search } = request.query as any;

    let where = 'p.city_id = $1 AND p.is_active = true';
    const params: any[] = [request.cityId];
    let idx = 2;

    if (category_id) { where += ` AND p.category_id = $${idx}`; params.push(category_id); idx++; }
    if (neighborhood) { where += ` AND p.neighborhood ILIKE $${idx}`; params.push(`%${neighborhood}%`); idx++; }
    if (search) {
      where += ` AND (p.name ILIKE $${idx} OR p.services_offered ILIKE $${idx} OR c.name ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM professionals p LEFT JOIN categories c ON p.category_id = c.id WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT p.*, c.name as category_name, c.icon as category_icon
       FROM professionals p LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${where} ORDER BY p.name LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return reply.send(paginated(result.rows, total, page, limit));
  });

  app.get('/api/:citySlug/professionals/:id', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const result = await query(
      `SELECT p.*, c.name as category_name, c.icon as category_icon
       FROM professionals p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.city_id = $2`,
      [id, request.cityId]
    );

    if (result.rows.length === 0) return reply.status(404).send(error('Profissional não encontrado'));

    await query('UPDATE professionals SET views_count = views_count + 1 WHERE id = $1', [id]);
    await query(
      `INSERT INTO interactions (city_id, source, type) VALUES ($1, 'web', 'professional_view')`,
      [request.cityId]
    );

    return reply.send(success(result.rows[0]));
  });

  app.post('/api/:citySlug/professionals', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const parsed = createProfessionalSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(error(parsed.error.errors[0].message));

    const data = parsed.data;
    const user = request.user as any;

    const result = await query(
      `INSERT INTO professionals (city_id, category_id, user_id, name, description, photo_url, services_offered,
        service_area, neighborhood, phone, whatsapp, instagram)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [request.cityId, data.category_id || null, user.id, data.name, data.description || null,
       data.photo_url || null, data.services_offered || null, data.service_area || null,
       data.neighborhood || null, data.phone || null, data.whatsapp || null, data.instagram || null]
    );

    return reply.status(201).send(success(result.rows[0]));
  });

  app.put('/api/:citySlug/professionals/:id', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    const body = request.body as any;

    const existing = await query('SELECT * FROM professionals WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) return reply.status(404).send(error('Profissional não encontrado'));
    if (user.role !== 'admin' && existing.rows[0].user_id !== user.id) return reply.status(403).send(error('Sem permissão'));

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedFields = ['name', 'description', 'photo_url', 'services_offered', 'service_area', 'neighborhood', 'phone', 'whatsapp', 'instagram', 'category_id', 'is_active'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) { fields.push(`${field} = $${idx++}`); values.push(body[field]); }
    }
    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(`UPDATE professionals SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return reply.send(success(result.rows[0]));
  });

  app.delete('/api/:citySlug/professionals/:id', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;

    const existing = await query('SELECT * FROM professionals WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) return reply.status(404).send(error('Profissional não encontrado'));
    if (user.role !== 'admin' && existing.rows[0].user_id !== user.id) return reply.status(403).send(error('Sem permissão'));

    await query('UPDATE professionals SET is_active = false WHERE id = $1', [id]);
    return reply.send(success({ deleted: true }));
  });
}
