import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error } from '../../utils/response';

export async function categoriesRoutes(app: FastifyInstance) {
  // List categories by type
  app.get('/api/categories', async (request, reply) => {
    const { type } = request.query as any;
    let sql = 'SELECT * FROM categories WHERE is_active = true';
    const params: any[] = [];

    if (type) {
      sql += ' AND type = $1';
      params.push(type);
    }

    sql += ' ORDER BY sort_order, name';
    const result = await query(sql, params);

    // Nest children under parents
    const parents = result.rows.filter((c: any) => !c.parent_id);
    const children = result.rows.filter((c: any) => c.parent_id);

    const nested = parents.map((p: any) => ({
      ...p,
      children: children.filter((c: any) => c.parent_id === p.id),
    }));

    return reply.send(success(nested));
  });

  // Get single category
  app.get('/api/categories/:id', async (request, reply) => {
    const { id } = request.params as any;
    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return reply.status(404).send(error('Categoria não encontrada'));
    }

    return reply.send(success(result.rows[0]));
  });
}
