import { Router } from 'express';
import { prisma } from '../../db';
import { asyncHandler } from '../../lib/asyncHandler';
import { forbidden, notFound } from '../../lib/errors';
import { authenticate, requireUser } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';

export const suppliersRouter = Router();
suppliersRouter.use(authenticate);

// A supplier can read only its own profile. Admins can read any.
suppliersRouter.get(
  '/:supplierId',
  requireRole('SUPPLIER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const { supplierId } = req.params;
    if (typeof supplierId !== 'string') throw notFound('Supplier not found');
    if (user.role === 'SUPPLIER' && user.supplierId !== supplierId) throw forbidden();

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true,
        businessName: true,
        description: true,
        businessPhone: true,
        address: true,
        latitude: true,
        longitude: true,
        status: true,
        createdAt: true,
      },
    });
    if (!supplier) throw notFound('Supplier not found');
    res.json(supplier);
  }),
);