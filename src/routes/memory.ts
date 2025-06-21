import {
  createMemory,
  deleteMemory,
  getMemoryById,
  searchMemories,
  updateMemory,
} from '@/controllers/memory-controller';
import express from 'express';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// GET /memory - Search memories
router.get('/', authMiddleware, searchMemories);

// POST /memory - Create new memory
router.post('/', authMiddleware, createMemory);

// GET /memory/:id - Get memory by ID
router.get('/:id', authMiddleware, getMemoryById);

// PUT /memory/:id - Update memory by ID
router.put('/:id', authMiddleware, updateMemory);

// DELETE /memory/:id - Delete memory by ID
router.delete('/:id', authMiddleware, deleteMemory);

export default router;
