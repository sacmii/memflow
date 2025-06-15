import {
  generateEmbeddings,
  generateTags,
} from '@/services/embedding-services';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

// Type definitions for better type safety
interface SearchQuery {
  limit?: string;
  tag?: string;
  keyword?: string;
}

interface CreateMemoryBody {
  content: string;
}

interface WhereCondition {
  tags?: { has: string };
  content?: {
    contains: string;
    mode: 'insensitive';
  };
  AND?: WhereCondition[];
}

export const searchMemories = async (
  req: Request<object, unknown, unknown, SearchQuery>,
  res: Response
): Promise<void> => {
  try {
    // Extract query parameters
    const limitParam = req.query.limit;
    const tag = req.query.tag;
    const keyword = req.query.keyword;
    // Handle limit parameter - undefined means no limit (infinite)
    let limit: number | undefined;
    if (limitParam) {
      limit = parseInt(limitParam);
      if (isNaN(limit) || limit <= 0) {
        res.status(400).json({
          message: 'Invalid limit parameter. Must be a positive number.',
        });
        return;
      }
    }
    // Build where conditions for filtering
    let whereConditions: WhereCondition = {};
    // Collect all conditions in an array for explicit AND logic
    const conditions: WhereCondition[] = [];
    // Filter by tag if provided
    if (tag) {
      conditions.push({ tags: { has: tag } });
    }
    // Filter by keyword in content if provided
    if (keyword) {
      conditions.push({
        content: {
          contains: keyword,
          mode: 'insensitive', // Case-insensitive search
        },
      });
    }
    // Use explicit AND logic if we have conditions
    if (conditions.length > 0) {
      whereConditions =
        conditions.length === 1 ? conditions[0] : { AND: conditions };
    }
    // Build query options
    const queryOptions: {
      where: WhereCondition;
      orderBy: { createdAt: 'desc' };
      select: {
        id: true;
        content: true;
        tags: true;
        createdAt: true;
      };
      take?: number;
    } = {
      where: whereConditions,
      orderBy: { createdAt: 'desc' }, // Most recent first
      select: {
        id: true,
        content: true,
        tags: true,
        createdAt: true,
      },
    };
    // Only add 'take' if limit is specified
    if (limit !== undefined) {
      queryOptions.take = limit;
    }
    // Query the database
    const memories = await prisma.memory.findMany(queryOptions);
    // Log search info
    console.log(`Found ${memories.length} memories with filters:`, {
      limit: limit || 'infinite',
      tag: tag || 'none',
      keyword: keyword || 'none',
    });
    // Return the memories
    res.status(200).json(memories);
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({
      message: 'Internal server error while searching memories',
    });
  }
};

export const createMemory = async (
  req: Request<object, unknown, CreateMemoryBody>,
  res: Response
): Promise<void> => {
  try {
    const { content } = req.body;
    if (
      !content ||
      typeof content !== 'string' ||
      content.trim().length === 0
    ) {
      throw new Error('Invalid input: content must be a non-empty string.');
    }
    // Generate embeddings
    const embeddings = await generateEmbeddings(content);
    if (!embeddings) {
      throw new Error('Failed to generate embeddings for the content.');
    }
    // Tags generation
    const tags = await generateTags(content);
    console.log('Creating memory');
    const memory = await prisma.memory.create({
      data: {
        content,
        tags,
      },
      select: {
        id: true,
        content: true,
        tags: true,
        createdAt: true,
      },
    });
    // Update with embedding using raw query
    await prisma.$executeRaw`
      UPDATE memory
      SET embedding = ${embeddings}::vector
      WHERE id = ${memory.id}
     `;
    res.status(201).json({
      message: 'Memory created successfully',
      data: memory,
    });
  } catch (error: unknown) {
    console.error('Error creating memory:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ message: errorMessage });
  }
};
