import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { repoRoutes } from './routes/repos';
import { runRoutes } from './routes/runs';

const fastify = Fastify({
  logger: {
    level: config.nodeEnv === 'development' ? 'info' : 'warn',
  },
});

async function start() {
  try {
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

    // Start server
    await fastify.listen({ port: config.port, host: '0.0.0.0' });

    console.log(`
🚀 Server ready at http://localhost:${config.port}
📊 Environment: ${config.nodeEnv}
📁 Workspace: ${config.workspace.dir}
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
