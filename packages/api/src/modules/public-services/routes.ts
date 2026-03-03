import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error } from '../../utils/response';
import { cityContextMiddleware } from '../../middleware/city-context';
import { adminMiddleware } from '../../middleware/auth';
import { z } from 'zod';

const createPublicServiceSchema = z.object({
  category: z.enum(['emergency', 'pharmacy', 'health', 'government', 'transport', 'utility']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  opening_hours: z.any().optional(),
  extra_info: z.any().optional(),
  sort_order: z.number().optional(),
});

export async function publicServicesRoutes(app: FastifyInstance) {
  app.get('/api/:citySlug/public-services', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { category } = request.query as any;

    let where = 'city_id = $1 AND is_active = true';
    const params: any[] = [request.cityId];

    if (category) {
      where += ' AND category = $2';
      params.push(category);
    }

    const result = await query(
      `SELECT * FROM public_services WHERE ${where} ORDER BY category, sort_order, title`,
      params
    );

    // Group by category
    const grouped: Record<string, any[]> = {};
    for (const row of result.rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push(row);
    }

    return reply.send(success(grouped));
  });

  app.post('/api/admin/public-services', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const parsed = createPublicServiceSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(error(parsed.error.errors[0].message));

    const data = parsed.data;
    const { city_id } = request.body as any;

    if (!city_id) return reply.status(400).send(error('city_id é obrigatório'));

    const result = await query(
      `INSERT INTO public_services (city_id, category, title, description, phone, address, opening_hours, extra_info, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [city_id, data.category, data.title, data.description || null, data.phone || null,
       data.address || null, data.opening_hours ? JSON.stringify(data.opening_hours) : null,
       data.extra_info ? JSON.stringify(data.extra_info) : null, data.sort_order || 0]
    );

    return reply.status(201).send(success(result.rows[0]));
  });

  app.put('/api/admin/public-services/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const field of ['category', 'title', 'description', 'phone', 'address', 'sort_order', 'is_active']) {
      if (body[field] !== undefined) { fields.push(`${field} = $${idx++}`); values.push(body[field]); }
    }
    if (body.opening_hours !== undefined) { fields.push(`opening_hours = $${idx++}`); values.push(JSON.stringify(body.opening_hours)); }
    if (body.extra_info !== undefined) { fields.push(`extra_info = $${idx++}`); values.push(JSON.stringify(body.extra_info)); }

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(`UPDATE public_services SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) return reply.status(404).send(error('Serviço não encontrado'));
    return reply.send(success(result.rows[0]));
  });

  app.delete('/api/admin/public-services/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    await query('UPDATE public_services SET is_active = false WHERE id = $1', [id]);
    return reply.send(success({ deleted: true }));
  });
}
