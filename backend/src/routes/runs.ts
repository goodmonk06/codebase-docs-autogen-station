import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function runRoutes(fastify: FastifyInstance) {
  // List all runs
  fastify.get('/runs', async (request, reply) => {
    const runs = await prisma.analysisRun.findMany({
      orderBy: { startedAt: 'desc' },
      include: {
        repo: true,
        artifacts: true,
      },
    });
    return runs;
  });

  // Get single run with artifacts
  fastify.get('/runs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const run = await prisma.analysisRun.findUnique({
      where: { id },
      include: {
        repo: true,
        artifacts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!run) {
      reply.code(404).send({ error: 'Run not found' });
      return;
    }

    return run;
  });

  // Get specific artifact
  fastify.get('/runs/:id/artifacts/:artifactId', async (request, reply) => {
    const { artifactId } = request.params as { artifactId: string };

    const artifact = await prisma.generatedArtifact.findUnique({
      where: { id: artifactId },
    });

    if (!artifact) {
      reply.code(404).send({ error: 'Artifact not found' });
      return;
    }

    return artifact;
  });

  // Get artifacts by type
  fastify.get('/runs/:id/artifacts', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { type } = request.query as { type?: string };

    const where: any = { runId: id };
    if (type) {
      where.type = type;
    }

    const artifacts = await prisma.generatedArtifact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return artifacts;
  });
}
