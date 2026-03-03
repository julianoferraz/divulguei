import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error } from '../../utils/response';

export async function citiesRoutes(app: FastifyInstance) {
  // List active cities
  app.get('/api/cities', async (request, reply) => {
    const result = await query(
      'SELECT id, name, slug, state, country, population, latitude, longitude FROM cities WHERE is_active = true ORDER BY name'
    );
    return reply.send(success(result.rows));
  });

  // Get city by slug
  app.get('/api/cities/:slug', async (request, reply) => {
    const { slug } = request.params as any;
    const result = await query(
      'SELECT * FROM cities WHERE slug = $1 AND is_active = true',
      [slug]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send(error('Cidade não encontrada'));
    }

    return reply.send(success(result.rows[0]));
  });
}
