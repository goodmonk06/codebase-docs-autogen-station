import { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';

const prisma = getPrismaClient();

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
      throw new NotFoundError('Run not found');
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
      throw new NotFoundError('Artifact not found');
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
