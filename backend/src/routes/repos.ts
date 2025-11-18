import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AnalysisOrchestrator } from '../services/analysisOrchestrator';

const prisma = new PrismaClient();
const orchestrator = new AnalysisOrchestrator();

const CreateRepoSchema = z.object({
  name: z.string().min(1),
  githubUrl: z.string().url().optional(),
  localPath: z.string().optional(),
  mainLanguage: z.string().optional(),
});

const TriggerAnalysisSchema = z.object({
  refName: z.string().default('main'),
});

export async function repoRoutes(fastify: FastifyInstance) {
  // List all repos
  fastify.get('/repos', async (request, reply) => {
    const repos = await prisma.repoConfig.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
      },
    });
    return repos;
  });

  // Get single repo
  fastify.get('/repos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const repo = await prisma.repoConfig.findUnique({
      where: { id },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!repo) {
      reply.code(404).send({ error: 'Repository not found' });
      return;
    }

    return repo;
  });

  // Create new repo
  fastify.post('/repos', async (request, reply) => {
    const body = CreateRepoSchema.parse(request.body);

    if (!body.githubUrl && !body.localPath) {
      reply.code(400).send({ error: 'Either githubUrl or localPath must be provided' });
      return;
    }

    const repo = await prisma.repoConfig.create({
      data: {
        name: body.name,
        githubUrl: body.githubUrl,
        localPath: body.localPath,
        mainLanguage: body.mainLanguage,
      },
    });

    return repo;
  });

  // Update repo
  fastify.put('/repos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = CreateRepoSchema.partial().parse(request.body);

    const repo = await prisma.repoConfig.update({
      where: { id },
      data: body,
    });

    return repo;
  });

  // Delete repo
  fastify.delete('/repos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await prisma.repoConfig.delete({
      where: { id },
    });

    return { success: true };
  });

  // Trigger analysis
  fastify.post('/repos/:id/analyze', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = TriggerAnalysisSchema.parse(request.body);

    const repo = await prisma.repoConfig.findUnique({
      where: { id },
    });

    if (!repo) {
      reply.code(404).send({ error: 'Repository not found' });
      return;
    }

    const runId = await orchestrator.executeAnalysis(id, body.refName);

    return { runId, message: 'Analysis started' };
  });
}
