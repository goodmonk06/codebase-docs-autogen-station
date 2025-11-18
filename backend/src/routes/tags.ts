import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getPrismaClient } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import { eventBus } from '../lib/events/DomainEvents';
import { logger } from '../lib/logger';

const prisma = getPrismaClient();

const CreateTagSchema = z.object({
  tag: z.string().min(1, 'Tag name is required'),
  category: z.enum(['general', 'team', 'project', 'language', 'domain']).default('general'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function tagRoutes(fastify: FastifyInstance) {
  // Get all tags for a repository
  fastify.get('/repos/:repoId/tags', async (request, reply) => {
    const { repoId } = request.params as { repoId: string };

    const tags = await prisma.repoTag.findMany({
      where: { repoId },
      orderBy: [{ category: 'asc' }, { tag: 'asc' }],
    });

    return tags;
  });

  // Add tag to repository
  fastify.post('/repos/:repoId/tags', async (request, reply) => {
    const { repoId } = request.params as { repoId: string };
    const body = CreateTagSchema.parse(request.body);

    const repo = await prisma.repoConfig.findUnique({
      where: { id: repoId },
    });

    if (!repo) {
      throw new NotFoundError('Repository not found');
    }

    const tag = await prisma.repoTag.create({
      data: {
        repoId,
        ...body,
      },
    });

    logger.info('Tag added to repository', { repoId, tag: body.tag, category: body.category });

    await eventBus.publish({
      type: 'tag.added',
      timestamp: new Date(),
      aggregateId: repoId,
      data: {
        repoId,
        tag: body.tag,
        category: body.category,
      },
    });

    reply.code(201);
    return tag;
  });

  // Remove tag from repository
  fastify.delete('/repos/:repoId/tags/:tagId', async (request, reply) => {
    const { repoId, tagId } = request.params as { repoId: string; tagId: string };

    const tag = await prisma.repoTag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundError('Tag not found');
    }

    if (tag.repoId !== repoId) {
      throw new NotFoundError('Tag not found for this repository');
    }

    await prisma.repoTag.delete({
      where: { id: tagId },
    });

    logger.info('Tag removed from repository', { repoId, tagId, tag: tag.tag });

    await eventBus.publish({
      type: 'tag.removed',
      timestamp: new Date(),
      aggregateId: repoId,
      data: {
        repoId,
        tag: tag.tag,
      },
    });

    return { success: true };
  });

  // Search repositories by tag
  fastify.get('/tags/search', async (request, reply) => {
    const { tag, category } = request.query as { tag?: string; category?: string };

    const where: any = {};
    if (tag) {
      where.tag = { contains: tag, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }

    const tags = await prisma.repoTag.findMany({
      where,
      include: {
        repo: {
          select: {
            id: true,
            name: true,
            mainLanguage: true,
            lastAnalyzedAt: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { tag: 'asc' }],
    });

    return tags;
  });

  // Get all unique tags
  fastify.get('/tags/all', async (request, reply) => {
    const tags = await prisma.repoTag.findMany({
      distinct: ['tag', 'category'],
      select: {
        tag: true,
        category: true,
        color: true,
      },
      orderBy: [{ category: 'asc' }, { tag: 'asc' }],
    });

    // Group by category
    const grouped = tags.reduce((acc, tag) => {
      if (!acc[tag.category]) {
        acc[tag.category] = [];
      }
      acc[tag.category].push(tag);
      return acc;
    }, {} as Record<string, typeof tags>);

    return grouped;
  });

  // Bulk tag operations
  fastify.post('/repos/:repoId/tags/bulk', async (request, reply) => {
    const { repoId } = request.params as { repoId: string };
    const { tags } = request.body as { tags: Array<{ tag: string; category?: string; color?: string }> };

    const repo = await prisma.repoConfig.findUnique({
      where: { id: repoId },
    });

    if (!repo) {
      throw new NotFoundError('Repository not found');
    }

    const created = await Promise.all(
      tags.map((tagData) =>
        prisma.repoTag.create({
          data: {
            repoId,
            tag: tagData.tag,
            category: tagData.category || 'general',
            color: tagData.color,
          },
        })
      )
    );

    logger.info('Bulk tags added to repository', { repoId, count: created.length });

    return { success: true, created: created.length, tags: created };
  });
}
