import { FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../config/database';

declare module 'fastify' {
  interface FastifyRequest {
    cityId?: string;
    citySlug?: string;
    cityName?: string;
  }
}

export async function cityContextMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const citySlug = (request.params as any).citySlug;
  if (!citySlug) return;

  const result = await query(
    'SELECT id, name, slug FROM cities WHERE slug = $1 AND is_active = true',
    [citySlug]
  );

  if (result.rows.length === 0) {
    return reply.status(404).send({ success: false, error: 'Cidade não encontrada' });
  }

  const city = result.rows[0];
  request.cityId = city.id;
  request.citySlug = city.slug;
  request.cityName = city.name;
}
