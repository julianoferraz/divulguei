import 'dotenv/config';
import { startConnection } from './connection.js';
import { handlePrivateMessage } from './private.js';
import { handleGroupMessage } from './group.js';
import { startAllCronJobs } from './cron.js';
import { db, redis } from './config.js';

async function main() {
  console.log('🤖 Divulguei Bot starting...');

  // Test DB connection
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Database connected.');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  // Test Redis connection
  try {
    await redis.ping();
    console.log('✅ Redis connected.');
  } catch (err) {
    console.error('❌ Redis connection failed:', err);
    process.exit(1);
  }

  // Start WhatsApp connection
  await startConnection(handlePrivateMessage, handleGroupMessage);

  // Start cron jobs
  startAllCronJobs();

  console.log('🚀 Bot is running!');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await db.end();
  redis.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await db.end();
  redis.disconnect();
  process.exit(0);
});

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
