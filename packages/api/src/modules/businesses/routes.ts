import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error, paginated } from '../../utils/response';
import { parsePageParams, slugify } from '../../utils/helpers';
import { cityContextMiddleware } from '../../middleware/city-context';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { z } from 'zod';

const createBusinessSchema = z.object({
  name: z.string().min(1).max(200),
  category_id: z.string().uuid().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  neighborhood: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),
  opening_hours: z.any().optional(),
  menu_url: z.string().optional(),
  logo_url: z.string().optional(),
  cover_url: z.string().optional(),
  images: z.array(z.string()).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  is_featured: z.boolean().optional(),
  source: z.enum(['manual', 'instagram', 'facebook', 'google_business', 'import']).optional(),
  plan: z.enum(['free', 'basic', 'premium']).optional(),
});

export async function businessesRoutes(app: FastifyInstance) {
  // List businesses for a city
  app.get('/api/:citySlug/businesses', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { page, limit, offset } = parsePageParams(request.query as any);
    const { category_id, neighborhood, search, is_featured } = request.query as any;

    let where = 'b.city_id = $1 AND b.is_active = true';
    const params: any[] = [request.cityId];
    let idx = 2;

    if (category_id) { where += ` AND (b.category_id = $${idx} OR b.category_id IN (SELECT id FROM categories WHERE parent_id = $${idx}))`; params.push(category_id); idx++; }
    if (neighborhood) { where += ` AND b.neighborhood ILIKE $${idx}`; params.push(`%${neighborhood}%`); idx++; }
    if (is_featured === 'true') { where += ' AND b.is_featured = true'; }
    if (search) {
      where += ` AND (b.name ILIKE $${idx} OR b.description ILIKE $${idx} OR c.name ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const countResult = await query(
      `SELECT COUNT(*) FROM businesses b LEFT JOIN categories c ON b.category_id = c.id WHERE ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT b.*, c.name as category_name, c.icon as category_icon
       FROM businesses b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE ${where}
       ORDER BY b.is_featured DESC, b.name
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return reply.send(paginated(result.rows, total, page, limit));
  });

  // Get business detail
  app.get('/api/:citySlug/businesses/:slug', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { slug } = request.params as any;

    const result = await query(
      `SELECT b.*, c.name as category_name, c.icon as category_icon, u.name as owner_name
       FROM businesses b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN users u ON b.owner_id = u.id
       WHERE b.city_id = $1 AND b.slug = $2 AND b.is_active = true`,
      [request.cityId, slug]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send(error('Empresa não encontrada'));
    }

    // Increment views
    await query('UPDATE businesses SET views_count = views_count + 1 WHERE id = $1', [result.rows[0].id]);

    // Log interaction
    await query(
      `INSERT INTO interactions (city_id, source, type, business_id) VALUES ($1, 'web', 'business_view', $2)`,
      [request.cityId, result.rows[0].id]
    );

    return reply.send(success(result.rows[0]));
  });

  // Create business (admin)
  app.post('/api/:citySlug/businesses', { preHandler: [cityContextMiddleware, adminMiddleware] }, async (request, reply) => {
    const parsed = createBusinessSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(error(parsed.error.errors[0].message));
    }

    const data = parsed.data;
    const slug = slugify(data.name);

    const result = await query(
      `INSERT INTO businesses (city_id, category_id, name, slug, description, address, neighborhood,
        phone, whatsapp, instagram, facebook, website, opening_hours, menu_url, logo_url, cover_url,
        images, latitude, longitude, is_featured, source, plan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [
        request.cityId, data.category_id || null, data.name, slug, data.description || null,
        data.address || null, data.neighborhood || null, data.phone || null, data.whatsapp || null,
        data.instagram || null, data.facebook || null, data.website || null,
        data.opening_hours ? JSON.stringify(data.opening_hours) : null,
        data.menu_url || null, data.logo_url || null, data.cover_url || null,
        JSON.stringify(data.images || []), data.latitude || null, data.longitude || null,
        data.is_featured || false, data.source || 'manual', data.plan || 'free',
      ]
    );

    return reply.status(201).send(success(result.rows[0]));
  });

  // Update business (admin or owner)
  app.put('/api/:citySlug/businesses/:id', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    const body = request.body as any;

    // Check ownership or admin
    const existing = await query('SELECT * FROM businesses WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (existing.rows.length === 0) {
      return reply.status(404).send(error('Empresa não encontrada'));
    }

    if (user.role !== 'admin' && existing.rows[0].owner_id !== user.id) {
      return reply.status(403).send(error('Sem permissão para editar esta empresa'));
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedFields = [
      'name', 'description', 'address', 'neighborhood', 'phone', 'whatsapp',
      'instagram', 'facebook', 'website', 'menu_url', 'logo_url', 'cover_url',
      'category_id', 'latitude', 'longitude', 'is_featured', 'is_active', 'plan',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        values.push(body[field]);
      }
    }

    if (body.opening_hours !== undefined) {
      fields.push(`opening_hours = $${idx++}`);
      values.push(JSON.stringify(body.opening_hours));
    }
    if (body.images !== undefined) {
      fields.push(`images = $${idx++}`);
      values.push(JSON.stringify(body.images));
    }

    if (body.name) {
      fields.push(`slug = $${idx++}`);
      values.push(slugify(body.name));
    }

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(
      `UPDATE businesses SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return reply.send(success(result.rows[0]));
  });

  // Delete business (admin)
  app.delete('/api/:citySlug/businesses/:id', { preHandler: [cityContextMiddleware, adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    await query('UPDATE businesses SET is_active = false WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    return reply.send(success({ deleted: true }));
  });

  // Claim business
  app.post('/api/:citySlug/businesses/:id/claim', { preHandler: [cityContextMiddleware, authMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const user = request.user as any;
    const { proof_url, message } = request.body as any;

    // Check business exists
    const biz = await query('SELECT id FROM businesses WHERE id = $1 AND city_id = $2', [id, request.cityId]);
    if (biz.rows.length === 0) {
      return reply.status(404).send(error('Empresa não encontrada'));
    }

    // Check if already claimed
    const existingClaim = await query(
      'SELECT id FROM business_claims WHERE business_id = $1 AND user_id = $2 AND status = $3',
      [id, user.id, 'pending']
    );
    if (existingClaim.rows.length > 0) {
      return reply.status(409).send(error('Você já tem uma reivindicação pendente para esta empresa'));
    }

    const result = await query(
      `INSERT INTO business_claims (business_id, user_id, proof_url, message) VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, user.id, proof_url || null, message || null]
    );

    return reply.status(201).send(success(result.rows[0]));
  });

  // Admin: list claims
  app.get('/api/admin/claims', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { status } = request.query as any;
    let sql = `SELECT bc.*, b.name as business_name, b.slug as business_slug, u.name as user_name, u.phone as user_phone
               FROM business_claims bc
               JOIN businesses b ON bc.business_id = b.id
               JOIN users u ON bc.user_id = u.id`;
    const params: any[] = [];

    if (status) {
      sql += ' WHERE bc.status = $1';
      params.push(status);
    }

    sql += ' ORDER BY bc.created_at DESC';
    const result = await query(sql, params);
    return reply.send(success(result.rows));
  });

  // Admin: approve/reject claim
  app.put('/api/admin/claims/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const { status } = request.body as any;
    const user = request.user as any;

    if (!['approved', 'rejected'].includes(status)) {
      return reply.status(400).send(error('Status deve ser approved ou rejected'));
    }

    const claimResult = await query(
      `UPDATE business_claims SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3 RETURNING *`,
      [status, user.id, id]
    );

    if (claimResult.rows.length === 0) {
      return reply.status(404).send(error('Reivindicação não encontrada'));
    }

    const claim = claimResult.rows[0];

    // If approved, update business
    if (status === 'approved') {
      await query(
        'UPDATE businesses SET is_claimed = true, owner_id = $1 WHERE id = $2',
        [claim.user_id, claim.business_id]
      );
      await query(
        "UPDATE users SET role = 'business_owner' WHERE id = $1 AND role = 'resident'",
        [claim.user_id]
      );
    }

    return reply.send(success(claimResult.rows[0]));
  });
}
