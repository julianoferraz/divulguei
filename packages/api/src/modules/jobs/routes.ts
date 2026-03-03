import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error, paginated } from '../../utils/response';
import { parsePageParams } from '../../utils/helpers';
import { cityContextMiddleware } from '../../middleware/city-context';
import { authMiddleware } from '../../middleware/auth';
import { z } from 'zod';

const createJobSchema = z.object({
  title: z.string().min(1).max(200),
  category_id: z.string().uuid().optional(),
  business_id: z.string().uuid().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  salary_info: z.string().optional(),
  job_type: z.enum(['clt', 'temporary', 'freelance', 'internship']).optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
});

export async function jobsRoutes(app: FastifyInstance) {
  app.get('/api/:citySlug/jobs', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { page, limit, offset } = parsePageParams(request.query as any);
    const { category_id, job_type, search } = request.query as any;

    let where = "j.city_id = $1 AND j.status = 'active'";
    const params: any[] = [request.cityId];
    let idx = 2;

    if (category_id) { where += ` AND j.category_id = $${idx}`; params.push(category_id); idx++; }
    if (job_type) { where += ` AND j.job_type = $${idx}`; params.push(job_type); idx++; }
    if (search) {
      where += ` AND (j.title ILIKE $${idx} OR j.description ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    const countResult = await query(`SELECT COUNT(*) FROM jobs j WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT j.*, c.name as category_name, b.name as business_name
       FROM jobs j
       LEFT JOIN categories c ON j.category_id = c.id
       LEFT JOIN businesses b ON j.business_id = b.id
       WHERE ${where} ORDER BY j.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return reply.send(paginated(result.rows, total, page, limit));
  });

  app.get('/api/:citySlug/jobs/:id', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const result = await query(
      `SELECT j.*, c.name as category_name, b.name as business_name
       FROM jobs j LEFT JOIN categories c ON j.category_id = c.id LEFT JOIN businesses b ON j.business_id = b.id
       WHERE j.id = $1 AND j.city_id = $2`,
      [id, request.cityId]
    );

    if (result.rows.length === 0) return reply.status(404).send(error('Vaga não encontrada'));

    await query('UPDATE jobs SET views_count = views_count + 1 WHERE id = $1', [id]);
    await query(`INSERT INTO interactions (city_id, source, type) VALUES ($1, 'web', 'job_view')`, [request.cityId]);

    return reply.send(success(result.rows[0]));
  });

  app.post('/api/:citySlug/jobs', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const parsed = createJobSchema.safeParse(request.body);
    if (!parsed.success) return reply.status(400).send(error(parsed.error.errors[0].message));

    const data = parsed.data;
    const user = request.user as any;

    const result = await query(
      `INSERT INTO jobs (city_id, category_id, business_id, user_id, title, description, requirements,
        salary_info, job_type, contact_phone, contact_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [request.cityId, data.category_id || null, data.business_id || null, user.id,
       data.title, data.description || null, data.requirements || null,
       data.salary_info || null, data.job_type || 'clt', data.contact_phone || null, data.contact_email || null]
    );

    return reply.status(201).send(success(result.rows[0]));
  });

  app.put('/api/:citySlug/jobs/:id', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    const body = request.body as any;

    const existing = await query('SELECT * FROM jobs WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) return reply.status(404).send(error('Vaga não encontrada'));
    if (user.role !== 'admin' && existing.rows[0].user_id !== user.id) return reply.status(403).send(error('Sem permissão'));

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const field of ['title', 'description', 'requirements', 'salary_info', 'job_type', 'contact_phone', 'contact_email', 'category_id', 'business_id', 'status']) {
      if (body[field] !== undefined) { fields.push(`${field} = $${idx++}`); values.push(body[field]); }
    }
    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(`UPDATE jobs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return reply.send(success(result.rows[0]));
  });

  app.delete('/api/:citySlug/jobs/:id', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;

    const existing = await query('SELECT * FROM jobs WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) return reply.status(404).send(error('Vaga não encontrada'));
    if (user.role !== 'admin' && existing.rows[0].user_id !== user.id) return reply.status(403).send(error('Sem permissão'));

    await query("UPDATE jobs SET status = 'removed' WHERE id = $1", [id]);
    return reply.send(success({ deleted: true }));
  });
}
