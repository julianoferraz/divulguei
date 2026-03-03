import { query } from '../../config/database';

export async function logInteraction(params: {
  cityId: string;
  source: 'web' | 'whatsapp_private' | 'whatsapp_group';
  type: string;
  query?: string;
  resultsCount?: number;
  businessId?: string;
  classifiedId?: string;
  groupId?: string;
  userPhone?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await query(
      `INSERT INTO interactions (city_id, source, type, query, results_count, business_id, classified_id, group_id, user_phone, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        params.cityId, params.source, params.type, params.query || null,
        params.resultsCount || null, params.businessId || null,
        params.classifiedId || null, params.groupId || null,
        params.userPhone || null, params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    );
  } catch (err) {
    console.error('Failed to log interaction:', err);
  }
}
