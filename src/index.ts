import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
// Rest part of the code
import memoryRoutes from '@/routes/memory';
import express from 'express';
// If prod use module-alias for path resolution in js
if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Add /memory route
app.use('/memory', memoryRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
