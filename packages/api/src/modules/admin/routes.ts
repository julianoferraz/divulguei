import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error } from '../../utils/response';
import { adminMiddleware } from '../../middleware/auth';

export async function adminRoutes(app: FastifyInstance) {
  // Dashboard metrics
  app.get('/api/admin/dashboard', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { city_id } = request.query as any;

    const baseWhere = city_id ? 'WHERE city_id = $1' : '';
    const params = city_id ? [city_id] : [];

    const [businesses, classifieds, professionals, jobs, events, interactionsToday, interactionsWeek, topSearches] = await Promise.all([
      query(`SELECT COUNT(*) FROM businesses ${baseWhere.replace('city_id', 'city_id')} ${city_id ? 'AND' : 'WHERE'} is_active = true`, params),
      query(`SELECT COUNT(*) FROM classifieds ${baseWhere} ${city_id ? 'AND' : 'WHERE'} status = 'active'`, params),
      query(`SELECT COUNT(*) FROM professionals ${baseWhere} ${city_id ? 'AND' : 'WHERE'} is_active = true`, params),
      query(`SELECT COUNT(*) FROM jobs ${baseWhere} ${city_id ? 'AND' : 'WHERE'} status = 'active'`, params),
      query(`SELECT COUNT(*) FROM events ${baseWhere} ${city_id ? 'AND' : 'WHERE'} is_approved = true AND starts_at >= NOW()`, params),
      query(
        `SELECT COUNT(*) FROM interactions ${baseWhere} ${city_id ? 'AND' : 'WHERE'} created_at >= CURRENT_DATE`,
        params
      ),
      query(
        `SELECT COUNT(*) FROM interactions ${baseWhere} ${city_id ? 'AND' : 'WHERE'} created_at >= CURRENT_DATE - INTERVAL '7 days'`,
        params
      ),
      query(
        `SELECT query, COUNT(*) as count FROM interactions
         ${baseWhere} ${city_id ? 'AND' : 'WHERE'} type = 'search' AND query IS NOT NULL AND created_at >= CURRENT_DATE - INTERVAL '7 days'
         GROUP BY query ORDER BY count DESC LIMIT 20`,
        params
      ),
    ]);

    return reply.send(success({
      businesses: parseInt(businesses.rows[0].count, 10),
      classifieds: parseInt(classifieds.rows[0].count, 10),
      professionals: parseInt(professionals.rows[0].count, 10),
      jobs: parseInt(jobs.rows[0].count, 10),
      events: parseInt(events.rows[0].count, 10),
      interactions_today: parseInt(interactionsToday.rows[0].count, 10),
      interactions_week: parseInt(interactionsWeek.rows[0].count, 10),
      top_searches: topSearches.rows,
    }));
  });

  // Admin: manage cities
  app.post('/api/admin/cities', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const body = request.body as any;
    const result = await query(
      `INSERT INTO cities (name, slug, state, country, population, latitude, longitude, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [body.name, body.slug, body.state, body.country || 'BR', body.population || null,
       body.latitude || null, body.longitude || null, body.is_active || false]
    );
    return reply.status(201).send(success(result.rows[0]));
  });

  app.put('/api/admin/cities/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const f of ['name', 'slug', 'state', 'country', 'population', 'latitude', 'longitude', 'is_active']) {
      if (body[f] !== undefined) { fields.push(`${f} = $${idx++}`); values.push(body[f]); }
    }
    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(`UPDATE cities SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) return reply.status(404).send(error('Cidade não encontrada'));
    return reply.send(success(result.rows[0]));
  });

  // Admin: manage categories
  app.post('/api/admin/categories', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const body = request.body as any;
    const result = await query(
      `INSERT INTO categories (name, slug, type, icon, parent_id, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [body.name, body.slug, body.type, body.icon || null, body.parent_id || null, body.sort_order || 0]
    );
    return reply.status(201).send(success(result.rows[0]));
  });

  app.put('/api/admin/categories/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const f of ['name', 'slug', 'type', 'icon', 'parent_id', 'sort_order', 'is_active']) {
      if (body[f] !== undefined) { fields.push(`${f} = $${idx++}`); values.push(body[f]); }
    }
    values.push(id);

    const result = await query(`UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) return reply.status(404).send(error('Categoria não encontrada'));
    return reply.send(success(result.rows[0]));
  });

  app.delete('/api/admin/categories/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    await query('UPDATE categories SET is_active = false WHERE id = $1', [id]);
    return reply.send(success({ deleted: true }));
  });

  // Admin: manage whatsapp groups
  app.get('/api/admin/groups', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const result = await query(
      `SELECT wg.*, c.name as city_name FROM whatsapp_groups wg JOIN cities c ON wg.city_id = c.id ORDER BY wg.created_at DESC`
    );
    return reply.send(success(result.rows));
  });

  app.post('/api/admin/groups', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const body = request.body as any;
    const result = await query(
      `INSERT INTO whatsapp_groups (city_id, group_jid, group_name, group_type, cooldown_minutes, max_daily_responses)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [body.city_id, body.group_jid, body.group_name || null, body.group_type || 'general',
       body.cooldown_minutes || 10, body.max_daily_responses || 15]
    );
    return reply.status(201).send(success(result.rows[0]));
  });

  app.put('/api/admin/groups/:id', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const body = request.body as any;
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const f of ['group_name', 'group_type', 'is_active', 'cooldown_minutes', 'max_daily_responses', 'blacklisted', 'blacklisted_reason']) {
      if (body[f] !== undefined) { fields.push(`${f} = $${idx++}`); values.push(body[f]); }
    }
    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await query(`UPDATE whatsapp_groups SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) return reply.status(404).send(error('Grupo não encontrado'));
    return reply.send(success(result.rows[0]));
  });

  // Admin: manage news sources
  app.get('/api/admin/news-sources', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const result = await query('SELECT * FROM news_sources ORDER BY name');
    return reply.send(success(result.rows));
  });

  app.post('/api/admin/news-sources', { preHandler: [adminMiddleware] }, async (request, reply) => {
    const body = request.body as any;
    const result = await query(
      `INSERT INTO news_sources (city_id, name, feed_url, feed_type, category)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [body.city_id, body.name, body.feed_url || null,
       body.feed_type || 'rss', body.category || null]
    );
    return reply.status(201).send(success(result.rows[0]));
  });

}
