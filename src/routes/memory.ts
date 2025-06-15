import { createMemory, searchMemories } from '@/controllers/memory-controller';
import express from 'express';

const router = express.Router();

// GET /memory - Search memories
router.get('/', searchMemories);

// POST /memory - Create new memory
router.post('/', createMemory);

export default router;
