import memoryRoutes from '@/routes/memory';
import dotenv from 'dotenv';
import express from 'express';
// If prod use module-alias for path resolution in js
if (process.env.NODE_ENV === 'production') {
  require('module-alias/register');
}

// Load environment variables from .env file
dotenv.config();

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
