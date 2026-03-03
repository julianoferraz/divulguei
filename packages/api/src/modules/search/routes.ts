import { FastifyInstance } from 'fastify';
import { query } from '../../config/database';
import { success, error } from '../../utils/response';
import { cityContextMiddleware } from '../../middleware/city-context';
import { classifyIntent, IntentResult } from '../../services/ai';

export async function searchRoutes(app: FastifyInstance) {
  app.post('/api/:citySlug/search', { preHandler: [cityContextMiddleware] }, async (request, reply) => {
    const { query: searchQuery, source } = request.body as any;

    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length === 0) {
      return reply.status(400).send(error('Query de busca é obrigatória'));
    }

    const cityId = request.cityId!;
    const cityName = request.cityName!;

    // 1. Classify intent with AI
    const intent = await classifyIntent(searchQuery.trim(), cityName);

    // 2. Search based on intent
    const results: any = { intent: intent.intent, sections: [] };

    try {
      switch (intent.intent) {
        case 'business_search': {
          const section = await searchBusinesses(cityId, intent);
          if (section.items.length > 0) results.sections.push(section);
          break;
        }
        case 'classified_search': {
          const section = await searchClassifieds(cityId, intent);
          if (section.items.length > 0) results.sections.push(section);
          break;
        }
        case 'professional_search': {
          const section = await searchProfessionals(cityId, intent);
          if (section.items.length > 0) results.sections.push(section);
          break;
        }
        case 'job_search': {
          const section = await searchJobs(cityId, intent);
          if (section.items.length > 0) results.sections.push(section);
          break;
        }
        case 'event_search': {
          const section = await searchEvents(cityId, intent);
          if (section.items.length > 0) results.sections.push(section);
          break;
        }
        case 'public_service_search': {
          const section = await searchPublicServices(cityId, intent);
          if (section.items.length > 0) results.sections.push(section);
          break;
        }
        default: {
          // General: search across all
          const [biz, cls, prof, jobs, events] = await Promise.all([
            searchBusinesses(cityId, intent),
            searchClassifieds(cityId, intent),
            searchProfessionals(cityId, intent),
            searchJobs(cityId, intent),
            searchEvents(cityId, intent),
          ]);
          if (biz.items.length > 0) results.sections.push(biz);
          if (cls.items.length > 0) results.sections.push(cls);
          if (prof.items.length > 0) results.sections.push(prof);
          if (jobs.items.length > 0) results.sections.push(jobs);
          if (events.items.length > 0) results.sections.push(events);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    }

    // 3. Log interaction
    const totalResults = results.sections.reduce((sum: number, s: any) => sum + s.items.length, 0);
    await query(
      `INSERT INTO interactions (city_id, source, type, query, results_count)
       VALUES ($1, $2, 'search', $3, $4)`,
      [cityId, source || 'web', searchQuery, totalResults]
    );

    return reply.send(success(results));
  });
}

async function searchBusinesses(cityId: string, intent: IntentResult) {
  const keywords = intent.keywords;
  let where = 'b.city_id = $1 AND b.is_active = true';
  const params: any[] = [cityId];
  let idx = 2;

  if (keywords.length > 0) {
    const conditions = keywords.map((_, i) => `(b.name ILIKE $${idx + i} OR b.description ILIKE $${idx + i} OR c.name ILIKE $${idx + i})`);
    where += ` AND (${conditions.join(' OR ')})`;
    keywords.forEach(k => params.push(`%${k}%`));
    idx += keywords.length;
  }

  if (intent.filters.neighborhood) {
    where += ` AND b.neighborhood ILIKE $${idx}`;
    params.push(`%${intent.filters.neighborhood}%`);
    idx++;
  }

  const result = await query(
    `SELECT b.id, b.name, b.slug, b.address, b.neighborhood, b.phone, b.whatsapp, b.opening_hours,
            b.logo_url, b.is_featured, c.name as category_name, c.icon as category_icon
     FROM businesses b LEFT JOIN categories c ON b.category_id = c.id
     WHERE ${where}
     ORDER BY b.is_featured DESC, b.views_count DESC
     LIMIT 10`,
    params
  );

  return { type: 'businesses', label: 'Empresas', items: result.rows };
}

async function searchClassifieds(cityId: string, intent: IntentResult) {
  const keywords = intent.keywords;
  let where = "cl.city_id = $1 AND cl.status = 'active'";
  const params: any[] = [cityId];
  let idx = 2;

  if (keywords.length > 0) {
    const conditions = keywords.map((_, i) => `(cl.title ILIKE $${idx + i} OR cl.description ILIKE $${idx + i})`);
    where += ` AND (${conditions.join(' OR ')})`;
    keywords.forEach(k => params.push(`%${k}%`));
    idx += keywords.length;
  }

  if (intent.filters.type) {
    where += ` AND cl.type = $${idx}`;
    params.push(intent.filters.type);
    idx++;
  }
  if (intent.filters.neighborhood) {
    where += ` AND cl.neighborhood ILIKE $${idx}`;
    params.push(`%${intent.filters.neighborhood}%`);
    idx++;
  }
  if (intent.filters.price_min) {
    where += ` AND cl.price >= $${idx}`;
    params.push(intent.filters.price_min);
    idx++;
  }
  if (intent.filters.price_max) {
    where += ` AND cl.price <= $${idx}`;
    params.push(intent.filters.price_max);
    idx++;
  }

  const result = await query(
    `SELECT cl.id, cl.title, cl.description, cl.price, cl.type, cl.is_negotiable,
            cl.images, cl.neighborhood, cl.contact_phone, cl.created_at,
            c.name as category_name
     FROM classifieds cl LEFT JOIN categories c ON cl.category_id = c.id
     WHERE ${where}
     ORDER BY cl.created_at DESC
     LIMIT 10`,
    params
  );

  return { type: 'classifieds', label: 'Classificados', items: result.rows };
}

async function searchProfessionals(cityId: string, intent: IntentResult) {
  const keywords = intent.keywords;
  let where = 'p.city_id = $1 AND p.is_active = true';
  const params: any[] = [cityId];
  let idx = 2;

  if (keywords.length > 0) {
    const conditions = keywords.map((_, i) => `(p.name ILIKE $${idx + i} OR p.services_offered ILIKE $${idx + i} OR c.name ILIKE $${idx + i})`);
    where += ` AND (${conditions.join(' OR ')})`;
    keywords.forEach(k => params.push(`%${k}%`));
    idx += keywords.length;
  }

  if (intent.filters.neighborhood) {
    where += ` AND p.neighborhood ILIKE $${idx}`;
    params.push(`%${intent.filters.neighborhood}%`);
  }

  const result = await query(
    `SELECT p.id, p.name, p.phone, p.whatsapp, p.neighborhood, p.services_offered, p.photo_url,
            c.name as category_name, c.icon as category_icon
     FROM professionals p LEFT JOIN categories c ON p.category_id = c.id
     WHERE ${where}
     ORDER BY p.views_count DESC
     LIMIT 10`,
    params
  );

  return { type: 'professionals', label: 'Profissionais', items: result.rows };
}

async function searchJobs(cityId: string, intent: IntentResult) {
  const keywords = intent.keywords;
  let where = "j.city_id = $1 AND j.status = 'active'";
  const params: any[] = [cityId];
  let idx = 2;

  if (keywords.length > 0) {
    const conditions = keywords.map((_, i) => `(j.title ILIKE $${idx + i} OR j.description ILIKE $${idx + i})`);
    where += ` AND (${conditions.join(' OR ')})`;
    keywords.forEach(k => params.push(`%${k}%`));
    idx += keywords.length;
  }

  const result = await query(
    `SELECT j.id, j.title, j.description, j.salary_info, j.job_type, j.created_at,
            c.name as category_name, b.name as business_name
     FROM jobs j LEFT JOIN categories c ON j.category_id = c.id LEFT JOIN businesses b ON j.business_id = b.id
     WHERE ${where}
     ORDER BY j.created_at DESC
     LIMIT 10`,
    params
  );

  return { type: 'jobs', label: 'Vagas', items: result.rows };
}

async function searchEvents(cityId: string, intent: IntentResult) {
  const keywords = intent.keywords;
  let where = 'e.city_id = $1 AND e.is_approved = true AND e.starts_at >= NOW()';
  const params: any[] = [cityId];
  let idx = 2;

  if (keywords.length > 0) {
    const conditions = keywords.map((_, i) => `(e.title ILIKE $${idx + i} OR e.description ILIKE $${idx + i})`);
    where += ` AND (${conditions.join(' OR ')})`;
    keywords.forEach(k => params.push(`%${k}%`));
    idx += keywords.length;
  }

  const result = await query(
    `SELECT e.id, e.title, e.description, e.venue_name, e.starts_at, e.ends_at,
            e.entry_price, e.image_url, c.name as category_name
     FROM events e LEFT JOIN categories c ON e.category_id = c.id
     WHERE ${where}
     ORDER BY e.starts_at ASC
     LIMIT 10`,
    params
  );

  return { type: 'events', label: 'Eventos', items: result.rows };
}

async function searchPublicServices(cityId: string, intent: IntentResult) {
  const keywords = intent.keywords;
  let where = 'ps.city_id = $1 AND ps.is_active = true';
  const params: any[] = [cityId];
  let idx = 2;

  if (keywords.length > 0) {
    const conditions = keywords.map((_, i) => `(ps.title ILIKE $${idx + i} OR ps.description ILIKE $${idx + i})`);
    where += ` AND (${conditions.join(' OR ')})`;
    keywords.forEach(k => params.push(`%${k}%`));
    idx += keywords.length;
  }

  const result = await query(
    `SELECT ps.id, ps.title, ps.description, ps.phone, ps.address, ps.category, ps.opening_hours
     FROM public_services ps
     WHERE ${where}
     ORDER BY ps.sort_order
     LIMIT 10`,
    params
  );

  return { type: 'public_services', label: 'Utilidade Pública', items: result.rows };
}
