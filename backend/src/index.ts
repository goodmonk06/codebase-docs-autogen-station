import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { repoRoutes } from './routes/repos';
import { runRoutes } from './routes/runs';
import { templateRoutes } from './routes/templates';
import { tagRoutes } from './routes/tags';
import { createErrorHandler } from './lib/errors';
import { disconnectPrisma } from './lib/prisma';
import { logger } from './lib/logger';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

async function start() {
  try {
    // Register error handler
    fastify.setErrorHandler(createErrorHandler());

    // Register CORS
    await fastify.register(cors, {
      origin: true,
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await fastify.register(repoRoutes, { prefix: '/api' });
    await fastify.register(runRoutes, { prefix: '/api' });
    await fastify.register(templateRoutes, { prefix: '/api' });
    await fastify.register(tagRoutes, { prefix: '/api' });

    logger.info('All routes registered');

    // Start server
    await fastify.listen({ port: config.port, host: '0.0.0.0' });

    logger.info('Server started successfully', {
      port: config.port,
      environment: config.nodeEnv,
      workspace: config.workspace.dir,
    });

    console.log(`
🚀 Server ready at http://localhost:${config.port}
📊 Environment: ${config.nodeEnv}
📁 Workspace: ${config.workspace.dir}
🎯 Phase 3 features enabled: Templates, Tags, Events, Metrics
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectPrisma();
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectPrisma();
  await fastify.close();
  process.exit(0);
});

start();
