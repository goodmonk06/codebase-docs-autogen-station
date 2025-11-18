import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrismaClient } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../lib/errors';
import { AnalysisOrchestrator } from '../services/analysisOrchestrator';

const prisma = getPrismaClient();
const orchestrator = new AnalysisOrchestrator();

const CreateRepoSchema = z.object({
  name: z.string().min(1, 'Repository name is required'),
  githubUrl: z.string().url('Must be a valid URL').optional(),
  localPath: z.string().min(1).optional(),
  mainLanguage: z.string().optional(),
});

const UpdateRepoSchema = CreateRepoSchema.partial();

const TriggerAnalysisSchema = z.object({
  refName: z.string().min(1).default('main'),
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
      throw new NotFoundError('Repository not found');
    }

    return repo;
  });

  // Create new repo
  fastify.post('/repos', async (request, reply) => {
    const body = CreateRepoSchema.parse(request.body);

    if (!body.githubUrl && !body.localPath) {
      throw new BadRequestError('Either githubUrl or localPath must be provided');
    }

    const repo = await prisma.repoConfig.create({
      data: {
        name: body.name,
        githubUrl: body.githubUrl,
        localPath: body.localPath,
        mainLanguage: body.mainLanguage,
      },
    });

    reply.code(201);
    return repo;
  });

  // Update repo
  fastify.put('/repos/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateRepoSchema.parse(request.body);

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
      throw new NotFoundError('Repository not found');
    }

    const runId = await orchestrator.executeAnalysis(id, body.refName);

    reply.code(202);
    return { runId, message: 'Analysis started' };
  });
}
