import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { env } from './config/env';
import { pool } from './config/database';
import { redis } from './config/redis';

// Route imports
import { authRoutes } from './modules/auth/routes';
import { citiesRoutes } from './modules/cities/routes';
import { categoriesRoutes } from './modules/categories/routes';
import { businessesRoutes } from './modules/businesses/routes';
import { classifiedsRoutes } from './modules/classifieds/routes';
import { professionalsRoutes } from './modules/professionals/routes';
import { jobsRoutes } from './modules/jobs/routes';
import { eventsRoutes } from './modules/events/routes';
import { newsRoutes } from './modules/news/routes';
import { publicServicesRoutes } from './modules/public-services/routes';
import { alertsRoutes } from './modules/alerts/routes';
import { searchRoutes } from './modules/search/routes';
import { adminRoutes } from './modules/admin/routes';
import { subscriptionsRoutes } from './modules/subscriptions/routes';

async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
  });

  // Plugins
  await app.register(cors, {
    origin: env.NODE_ENV === 'production'
      ? ['https://divulguei.online', 'https://www.divulguei.online']
      : true,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
  });

  // Health check
  app.get('/api/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }));

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Dados inválidos',
        details: error.validation,
      });
    }

    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: statusCode === 500 ? 'Erro interno do servidor' : error.message,
    });
  });

  // Register routes
  await app.register(authRoutes);
  await app.register(citiesRoutes);
  await app.register(categoriesRoutes);
  await app.register(businessesRoutes);
  await app.register(classifiedsRoutes);
  await app.register(professionalsRoutes);
  await app.register(jobsRoutes);
  await app.register(eventsRoutes);
  await app.register(newsRoutes);
  await app.register(publicServicesRoutes);
  await app.register(alertsRoutes);
  await app.register(searchRoutes);
  await app.register(adminRoutes);
  await app.register(subscriptionsRoutes);

  // File upload endpoint
  app.post('/api/upload', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ success: false, error: 'Token inválido' });
    }

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: 'Nenhum arquivo enviado' });
    }

    const fs = await import('fs');
    const path = await import('path');
    const { v4: uuidv4 } = await import('uuid');

    const uploadDir = env.UPLOAD_DIR;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(data.filename) || '.jpg';
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    const buffer = await data.toBuffer();
    fs.writeFileSync(filepath, buffer);

    return reply.send({
      success: true,
      data: {
        url: `/uploads/${filename}`,
        filename,
        size: buffer.length,
      },
    });
  });

  return app;
}

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`🚀 Divulguei API running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    await app.close();
    await pool.end();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();

export { buildApp };
