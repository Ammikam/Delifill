import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../db';
import { asyncHandler } from '../../lib/asyncHandler';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('ADMIN'));

const listUsersQuery = z.object({
  role: z.enum(['CUSTOMER', 'SUPPLIER', 'DRIVER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = listUsersQuery.parse(req.query);
    const where = {
      ...(q.role && { role: q.role }),
      ...(q.status && { status: q.status }),
      ...(q.search && {
        OR: [
          { fullName: { contains: q.search, mode: 'insensitive' as const } },
          { phone: { contains: q.search } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, fullName: true, phone: true, email: true, role: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ items, total, page: q.page, pageSize: q.pageSize });
  }),
);