import { processContent } from '@/services/embedding-services';
import { AuthRequest } from '@/types/custom-express';
import { PrismaClient } from '@prisma/client';
import { Response } from 'express';

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

interface UpdateMemoryBody {
  content?: string;
  tags?: string[];
}

interface WhereCondition {
  userId?: string; // Make userId optional here
  tags?: { has: string };
  content?: {
    contains: string;
    mode: 'insensitive';
  };
  AND?: WhereCondition[];
}

export const searchMemories = async (
  req: AuthRequest<object, unknown, unknown, SearchQuery>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: User ID not found.' });
      return;
    }

    // Extract query parameters
    const limitParam = req.query.limit;
    const tag = req.query.tag;
    const keyword = req.query.keyword;

    // Handle limit parameter - undefined means no limit (infinite)
    let limit: number | undefined;
    if (limitParam) {
      limit = parseInt(limitParam); // Corrected: use limitParam
      if (isNaN(limit) || limit <= 0) {
        res.status(400).json({
          message: 'Invalid limit parameter. Must be a positive number.',
        });
        return;
      }
    }

    // Build where conditions for filtering
    const conditions: WhereCondition[] = [{ userId }]; // Always filter by userId

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

    const whereConditions: WhereCondition = { AND: conditions };

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
    console.log(
      `Found ${memories.length} memories for user ${userId} with filters:`,
      {
        limit: limit || 'infinite',
        tag: tag || 'none',
        keyword: keyword || 'none',
      }
    );

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
  req: AuthRequest<object, unknown, CreateMemoryBody>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: User ID not found.' });
      return;
    }

    const { content } = req.body;
    if (
      !content ||
      typeof content !== 'string' ||
      content.trim().length === 0
    ) {
      throw new Error('Invalid input: content must be a non-empty string.');
    }

    // Process content to get simplified content, embeddings, and tags
    const { simplifiedContent, embeddings, tags } =
      await processContent(content);

    console.log('Creating memory');
    const memory = await prisma.memory.create({
      data: {
        userId, // Associate memory with the authenticated user
        content: simplifiedContent, // Store original content
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

export const getMemoryById = async (
  req: AuthRequest<{ id: string }>, // Type req.params
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: User ID not found.' });
      return;
    }

    const { id } = req.params;
    const memory = await prisma.memory.findUnique({
      where: {
        id,
        userId, // Ensure memory belongs to the authenticated user
      },
      select: {
        id: true,
        content: true,
        tags: true,
        createdAt: true,
      },
    });

    if (!memory) {
      res
        .status(404)
        .json({ message: 'Memory not found or not accessible by user.' });
      return;
    }

    res.status(200).json(memory);
  } catch (error) {
    console.error('Error getting memory by ID:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateMemory = async (
  req: AuthRequest<{ id: string }, unknown, UpdateMemoryBody>, // Type req.params
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: User ID not found.' });
      return;
    }

    const { id } = req.params;
    const { content, tags } = req.body;

    if (!content && !tags) {
      res
        .status(400)
        .json({ message: 'No content or tags provided for update.' });
      return;
    }

    const updatedMemory = await prisma.memory.update({
      where: {
        id,
        userId, // Ensure memory belongs to the authenticated user
      },
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

    res
      .status(200)
      .json({ message: 'Memory updated successfully', data: updatedMemory });
  } catch (error) {
    console.error('Error updating memory:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteMemory = async (
  req: AuthRequest<{ id: string }>, // Type req.params
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized: User ID not found.' });
      return;
    }

    const { id } = req.params;

    await prisma.memory.delete({
      where: {
        id,
        userId, // Ensure memory belongs to the authenticated user
      },
    });

    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
