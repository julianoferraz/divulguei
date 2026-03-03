import cron from 'node-cron';
import RSSParser from 'rss-parser';
import { query, redis } from './config.js';
import { sendText, getSocket } from './connection.js';

const parser = new RSSParser();
const DEFAULT_CITY_ID = process.env.DEFAULT_CITY_ID || '';

/**
 * Expire old classifieds (30 days default)
 * Runs daily at 3:00 AM
 */
export function scheduleClassifiedExpiry() {
  cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Running classified expiry job...');
    try {
      const result = await query(
        `UPDATE classifieds SET status = 'expired'
         WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < NOW()
         RETURNING id, title, contact_phone`
      );
      console.log(`📦 ${result.rowCount} classifieds expired.`);

      // Notify owners
      const sock = getSocket();
      if (sock) {
        for (const row of result.rows) {
          if (row.contact_phone) {
            try {
              await sendText(
                `${row.contact_phone}@s.whatsapp.net`,
                `⏰ Seu anúncio "*${row.title}*" expirou.\n\nPara renovar, acesse divulguei.online ou nos envie uma mensagem.`
              );
            } catch { /* ignore send failures */ }
          }
        }
      }
    } catch (err) {
      console.error('Classified expiry error:', err);
    }
  });
}

/**
 * Reset daily WhatsApp group message counters
 * Runs daily at midnight
 */
export function scheduleDailyReset() {
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Resetting daily group message counters...');
    try {
      await query('UPDATE whatsapp_groups SET daily_message_count = 0');
      console.log('✅ Counters reset.');
    } catch (err) {
      console.error('Daily reset error:', err);
    }
  });
}

/**
 * Fetch news from RSS feeds
 * Runs every 2 hours
 */
export function scheduleNewsFetcher() {
  cron.schedule('0 */2 * * *', async () => {
    console.log('📰 Fetching news from RSS sources...');
    try {
      const sources = await query(
        'SELECT id, name, feed_url, city_id FROM news_sources WHERE is_active = true AND feed_url IS NOT NULL'
      );

      for (const source of sources.rows) {
        try {
          const feed = await parser.parseURL(source.feed_url);

          for (const item of feed.items.slice(0, 10)) {
            if (!item.title || !item.link) continue;

            // Check if article already exists
            const existing = await query(
              'SELECT id FROM news_articles WHERE original_url = $1',
              [item.link]
            );
            if (existing.rows.length > 0) continue;

            await query(
              `INSERT INTO news_articles (source_id, city_id, title, summary, original_url, image_url, published_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7)
               ON CONFLICT (original_url) DO NOTHING`,
              [
                source.id,
                source.city_id,
                item.title.slice(0, 255),
                item.contentSnippet?.slice(0, 500) || '',
                item.link,
                item.enclosure?.url || null,
                item.isoDate ? new Date(item.isoDate) : new Date(),
              ]
            );
          }
        } catch (err) {
          console.error(`RSS fetch error for ${source.name}:`, err);
        }
      }
      console.log('✅ News fetch complete.');
    } catch (err) {
      console.error('News fetcher error:', err);
    }
  });
}

/**
 * Check for new items matching user alerts and notify via WhatsApp
 * Runs every 30 minutes
 */
export function scheduleAlertNotifier() {
  cron.schedule('*/30 * * * *', async () => {
    console.log('🔔 Checking alerts...');
    try {
      const alerts = await query(
        `SELECT a.id, a.keyword, a.user_id, a.city_id, u.phone
         FROM alerts a
         JOIN users u ON u.id = a.user_id
         WHERE a.is_active = true AND u.phone IS NOT NULL`
    );
    /* NOTE: keyword is called 'keywords' in the DB schema */
    // TODO: rename 'keyword' in queries below if column name differs
      );

      const sock = getSocket();
      if (!sock) return;

      const lastCheck = await redis.get('bot:alert:last_check');
      const since = lastCheck ? new Date(lastCheck) : new Date(Date.now() - 30 * 60 * 1000);

      for (const alert of alerts.rows) {
        const keyword = `%${alert.keyword}%`;

        // Check new classifieds
        const newClassifieds = await query(
          `SELECT title, price FROM classifieds
           WHERE city_id = $1 AND status = 'active' AND created_at > $2
           AND (title ILIKE $3 OR description ILIKE $3)
           LIMIT 3`,
          [alert.city_id, since, keyword]
        );

        // Check new businesses
        const newBusinesses = await query(
          `SELECT name FROM businesses
           WHERE city_id = $1 AND is_active = true AND created_at > $2
           AND (name ILIKE $3 OR description ILIKE $3)
           LIMIT 3`,
          [alert.city_id, since, keyword]
        );

        const items: string[] = [];
        for (const c of newClassifieds.rows) {
          items.push(`📦 ${c.title}${c.price ? ` — R$ ${Number(c.price).toFixed(2)}` : ''}`);
        }
        for (const b of newBusinesses.rows) {
          items.push(`🏪 ${b.name}`);
        }

        if (items.length > 0 && alert.phone) {
          try {
            await sendText(
              `${alert.phone}@s.whatsapp.net`,
              `🔔 *Alerta: "${alert.keyword}"*\n\nNovas publicações encontradas:\n\n${items.join('\n')}\n\n🌐 Veja mais em divulguei.online`
            );
          } catch { /* ignore */ }
        }
      }

      await redis.set('bot:alert:last_check', new Date().toISOString());
      console.log('✅ Alert check complete.');
    } catch (err) {
      console.error('Alert notifier error:', err);
    }
  });
}

export function startAllCronJobs() {
  scheduleClassifiedExpiry();
  scheduleDailyReset();
  scheduleNewsFetcher();
  scheduleAlertNotifier();
  console.log('⏰ All cron jobs scheduled.');
}
