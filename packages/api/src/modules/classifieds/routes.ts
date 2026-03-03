import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error, paginated } from '../../utils/response';
import { parsePageParams } from '../../utils/helpers';
import { cityContextMiddleware } from '../../middleware/city-context';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { improveClassifiedDescription } from '../../services/ai';
import { z } from 'zod';

const createClassifiedSchema = z.object({
  type: z.enum(['sell', 'buy', 'rent_offer', 'rent_search', 'service']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  description_original: z.string().optional(),
  category_id: z.string().uuid().optional(),
  price: z.number().min(0).optional(),
  is_negotiable: z.boolean().optional(),
  images: z.array(z.string()).optional(),
  contact_phone: z.string().optional(),
  contact_name: z.string().optional(),
  neighborhood: z.string().optional(),
});

export async function classifiedsRoutes(app: FastifyInstance) {
  // List classifieds
  app.get('/api/:citySlug/classifieds', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { page, limit, offset } = parsePageParams(request.query as any);
    const { type, category_id, neighborhood, search, min_price, max_price } = request.query as any;

    let where = "cl.city_id = $1 AND cl.status = 'active'";
    const params: any[] = [request.cityId];
    let idx = 2;

    if (type) { where += ` AND cl.type = $${idx}`; params.push(type); idx++; }
    if (category_id) { where += ` AND (cl.category_id = $${idx} OR cl.category_id IN (SELECT id FROM categories WHERE parent_id = $${idx}))`; params.push(category_id); idx++; }
    if (neighborhood) { where += ` AND cl.neighborhood ILIKE $${idx}`; params.push(`%${neighborhood}%`); idx++; }
    if (min_price) { where += ` AND cl.price >= $${idx}`; params.push(parseFloat(min_price)); idx++; }
    if (max_price) { where += ` AND cl.price <= $${idx}`; params.push(parseFloat(max_price)); idx++; }
    if (search) {
      where += ` AND (cl.title ILIKE $${idx} OR cl.description ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM classifieds cl WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT cl.*, c.name as category_name, c.icon as category_icon, u.name as user_name
       FROM classifieds cl
       LEFT JOIN categories c ON cl.category_id = c.id
       LEFT JOIN users u ON cl.user_id = u.id
       WHERE ${where}
       ORDER BY cl.is_featured DESC, cl.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return reply.send(paginated(result.rows, total, page, limit));
  });

  // Get classified detail
  app.get('/api/:citySlug/classifieds/:id', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;

    const result = await query(
      `SELECT cl.*, c.name as category_name, c.icon as category_icon, u.name as user_name
       FROM classifieds cl
       LEFT JOIN categories c ON cl.category_id = c.id
       LEFT JOIN users u ON cl.user_id = u.id
       WHERE cl.id = $1 AND cl.city_id = $2`,
      [id, request.cityId]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send(error('Classificado não encontrado'));
    }

    await query('UPDATE classifieds SET views_count = views_count + 1 WHERE id = $1', [id]);
    await query(
      `INSERT INTO interactions (city_id, source, type, classified_id) VALUES ($1, 'web', 'classified_view', $2)`,
      [request.cityId, id]
    );

    return reply.send(success(result.rows[0]));
  });

  // Create classified
  app.post('/api/:citySlug/classifieds', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const parsed = createClassifiedSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error(parsed.error.errors[0].message));
    }

    const data = parsed.data;
    const user = request.user as any;

    // If description_original is provided, improve with AI
    let description = data.description || '';
    let descriptionOriginal = data.description_original || null;

    if (descriptionOriginal) {
      description = await improveClassifiedDescription(descriptionOriginal);
    }

    const result = await query(
      `INSERT INTO classifieds (city_id, category_id, user_id, type, title, description, description_original,
        price, is_negotiable, images, contact_phone, contact_name, neighborhood)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        request.cityId, data.category_id || null, user.id, data.type, data.title,
        description, descriptionOriginal, data.price || null, data.is_negotiable || false,
        JSON.stringify(data.images || []), data.contact_phone || user.phone || null,
        data.contact_name || user.name || null, data.neighborhood || null,
      ]
    );

    // Log interaction
    await query(
      `INSERT INTO interactions (city_id, source, type, classified_id, user_phone) VALUES ($1, 'web', 'ad_created', $2, $3)`,
      [request.cityId, result.rows[0].id, user.phone]
    );

    return reply.status(201).send(success(result.rows[0]));
  });

  // AI improve description preview (no creation)
  app.post('/api/:citySlug/classifieds/improve', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { description } = request.body as any;
    if (!description || typeof description !== 'string') {
      return reply.status(400).send(error('Descrição é obrigatória'));
    }
    const improved = await improveClassifiedDescription(description);
    return reply.send(success({ description: improved }));
  });

  // Update classified
  app.put('/api/:citySlug/classifieds/:id', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    const body = request.body as any;

    const existing = await query('SELECT * FROM classifieds WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) return reply.status(404).send(error('Classificado não encontrado'));
    if (user.role !== 'admin' && existing.rows[0].user_id !== user.id) {
      return reply.status(403).send(error('Sem permissão'));
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedFields = ['title', 'description', 'price', 'is_negotiable', 'contact_phone', 'contact_name', 'neighborhood', 'category_id', 'type'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        values.push(body[field]);
      }
    }
    if (body.images !== undefined) {
      fields.push(`images = $${idx++}`);
      values.push(JSON.stringify(body.images));
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE classifieds SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return reply.send(success(result.rows[0]));
  });

  // Delete classified
  app.delete('/api/:citySlug/classifieds/:id', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;

    const existing = await query('SELECT * FROM classifieds WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) return reply.status(404).send(error('Classificado não encontrado'));
    if (user.role !== 'admin' && existing.rows[0].user_id !== user.id) {
      return reply.status(403).send(error('Sem permissão'));
    }

    await query("UPDATE classifieds SET status = 'removed' WHERE id = $1", [id]);
    return reply.send(success({ deleted: true }));
  });

  // Patch status
  app.patch('/api/:citySlug/classifieds/:id/status', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    const { status } = request.body as any;

    const validStatuses = ['active', 'sold', 'rented', 'removed'];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send(error('Status inválido'));
    }

    const existing = await query('SELECT * FROM classifieds WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) return reply.status(404).send(error('Classificado não encontrado'));
    if (user.role !== 'admin' && existing.rows[0].user_id !== user.id) {
      return reply.status(403).send(error('Sem permissão'));
    }

    // If renewing, reset expires_at
    let extraSql = '';
    if (status === 'active') {
      extraSql = ", expires_at = NOW() + INTERVAL '30 days'";
    }

    const result = await query(
      `UPDATE classifieds SET status = $1, updated_at = NOW()${extraSql} WHERE id = $2 RETURNING *`,
      [status, id]
    );

    return reply.send(success(result.rows[0]));
  });
}
