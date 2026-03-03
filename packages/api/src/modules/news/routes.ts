import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error, paginated } from '../../utils/response';
import { parsePageParams } from '../../utils/helpers';
import { cityContextMiddleware } from '../../middleware/city-context';

export async function newsRoutes(app: FastifyInstance) {
  app.get('/api/:citySlug/news', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { page, limit, offset } = parsePageParams(request.query as any);
    const { source_id } = request.query as any;

    let where = 'na.city_id = $1';
    const params: any[] = [request.cityId];
    let idx = 2;

    if (source_id) { where += ` AND na.source_id = $${idx}`; params.push(source_id); idx++; }

    const countResult = await query(`SELECT COUNT(*) FROM news_articles na WHERE ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT na.*, ns.name as source_name
       FROM news_articles na
       JOIN news_sources ns ON na.source_id = ns.id
       WHERE ${where}
       ORDER BY na.published_at DESC NULLS LAST
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return reply.send(paginated(result.rows, total, page, limit));
  });

  app.get('/api/:citySlug/news/:id', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { id } = request.params as any;
    const result = await query(
      `SELECT na.*, ns.name as source_name
       FROM news_articles na
       JOIN news_sources ns ON na.source_id = ns.id
       WHERE na.id = $1 AND na.city_id = $2`,
      [id, request.cityId]
    );

    if (result.rows.length === 0) return reply.status(404).send(error('Notícia não encontrada'));
    return reply.send(success(result.rows[0]));
  });
}
