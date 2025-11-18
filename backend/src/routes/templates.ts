import { FastifyInstance } from 'fastify';
<parameter name="z } from 'zod';
import { getPrismaClient } from '../lib/prisma';
import { NotFoundError, BadRequestError } from '../lib/errors';
import { eventBus } from '../lib/events/DomainEvents';
import { logger } from '../lib/logger';

const prisma = getPrismaClient();

const CreateTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  focusAreas: z.array(z.string()).optional(),
  architecturePrompt: z.string().optional(),
  apiPrompt: z.string().optional(),
  readmePrompt: z.string().optional(),
  diagramStyle: z.enum(['standard', 'detailed', 'minimal']).default('standard'),
  includeMetrics: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  createdBy: z.string().optional(),
});

const UpdateTemplateSchema = CreateTemplateSchema.partial();

export async function templateRoutes(fastify: FastifyInstance) {
  // List all templates
  fastify.get('/templates', async (request, reply) => {
    const { isPublic } = request.query as { isPublic?: string };

    const where: any = {};
    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const templates = await prisma.analysisTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            repos: true,
            runs: true,
          },
        },
      },
    });

    return templates;
  });

  // Get single template
  fastify.get('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const template = await prisma.analysisTemplate.findUnique({
      where: { id },
      include: {
        repos: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            runs: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    return template;
  });

  // Create template
  fastify.post('/templates', async (request, reply) => {
    const body = CreateTemplateSchema.parse(request.body);

    const template = await prisma.analysisTemplate.create({
      data: body,
    });

    logger.info('Template created', { templateId: template.id, name: template.name });

    reply.code(201);
    return template;
  });

  // Update template
  fastify.put('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = UpdateTemplateSchema.parse(request.body);

    const template = await prisma.analysisTemplate.update({
      where: { id },
      data: body,
    });

    logger.info('Template updated', { templateId: template.id, name: template.name });

    return template;
  });

  // Delete template
  fastify.delete('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Check if template is in use
    const template = await prisma.analysisTemplate.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            repos: true,
            runs: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    if (template._count.repos > 0) {
      throw new BadRequestError(
        `Template is in use by ${template._count.repos} repositories. Remove template from repos first.`
      );
    }

    await prisma.analysisTemplate.delete({
      where: { id },
    });

    logger.info('Template deleted', { templateId: id, name: template.name });

    return { success: true };
  });

  // Apply template to repository
  fastify.post('/repos/:repoId/template/:templateId', async (request, reply) => {
    const { repoId, templateId } = request.params as { repoId: string; templateId: string };

    const repo = await prisma.repoConfig.findUnique({
      where: { id: repoId },
    });

    if (!repo) {
      throw new NotFoundError('Repository not found');
    }

    const template = await prisma.analysisTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundError('Template not found');
    }

    const updatedRepo = await prisma.repoConfig.update({
      where: { id: repoId },
      data: { templateId },
    });

    logger.info('Template applied to repository', {
      repoId,
      templateId,
      templateName: template.name,
    });

    await eventBus.publish({
      type: 'template.applied',
      timestamp: new Date(),
      aggregateId: repoId,
      data: {
        repoId,
        templateId,
        templateName: template.name,
      },
    });

    return updatedRepo;
  });

  // Remove template from repository
  fastify.delete('/repos/:repoId/template', async (request, reply) => {
    const { repoId } = request.params as { repoId: string };

    const repo = await prisma.repoConfig.findUnique({
      where: { id: repoId },
    });

    if (!repo) {
      throw new NotFoundError('Repository not found');
    }

    const updatedRepo = await prisma.repoConfig.update({
      where: { id: repoId },
      data: { templateId: null },
    });

    logger.info('Template removed from repository', { repoId });

    return updatedRepo;
  });
}
