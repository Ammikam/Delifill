import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../db';
import { asyncHandler } from '../../lib/asyncHandler';
import { forbidden, notFound } from '../../lib/errors';
import { authenticate, requireUser } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/authorize';

export const deliveriesRouter = Router();
deliveriesRouter.use(authenticate);

// Never select otpHash here.
const deliverySelect = {
  id: true,
  status: true,
  driverId: true,
  assignedAt: true,
  pickedUpAt: true,
  deliveredAt: true,
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      customerId: true,
      supplierId: true,
      total: true,
      notes: true,
      deliveryAddressLine: true,
      deliveryLatitude: true,
      deliveryLongitude: true,
      deliveryPhone: true,
      items: { select: { productName: true, quantity: true } },
    },
  },
} satisfies Prisma.DeliverySelect;

// A driver sees only deliveries assigned to them.
deliveriesRouter.get(
  '/mine',
  requireRole('DRIVER'),
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    // Guard is essential: an undefined filter in Prisma would match every delivery.
    if (!user.driverId) throw forbidden();
    const items = await prisma.delivery.findMany({
      where: { driverId: user.driverId },
      select: deliverySelect,
      orderBy: { assignedAt: 'desc' },
    });
    res.json({ items });
  }),
);

// Single delivery: visible to the assigned driver, the supplier and customer on the order, and admins.
// Anyone else gets 404, so the existence of other people's deliveries is not revealed.
deliveriesRouter.get(
  '/:deliveryId',
  asyncHandler(async (req, res) => {
    const user = requireUser(req);
    const deliveryId = req.params.deliveryId;
    if (typeof deliveryId !== 'string') throw notFound('Delivery not found');

    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: deliverySelect,
    });
    if (!delivery) throw notFound('Delivery not found');

    const allowed =
      user.role === 'ADMIN' ||
      (user.role === 'DRIVER' && !!user.driverId && delivery.driverId === user.driverId) ||
      (user.role === 'SUPPLIER' && !!user.supplierId && delivery.order.supplierId === user.supplierId) ||
      (user.role === 'CUSTOMER' && !!user.customerId && delivery.order.customerId === user.customerId);
    if (!allowed) throw notFound('Delivery not found');

    res.json(delivery);
  }),
);