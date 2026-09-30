import { Router } from 'express';
import { prisma } from '../db';

export const healthRouter = Router();

healthRouter.get('/health', async (_req, res) => {
  const timestamp = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'up', timestamp });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'down', timestamp });
  }
});