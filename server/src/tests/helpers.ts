import bcrypt from 'bcryptjs';
import { PaymentMethod, type SupplierStatus } from '@prisma/client';
import { prisma } from '../db';
import { signAccessToken } from '../lib/tokens';

export const PASSWORD = 'Password123';
const passwordHash = bcrypt.hashSync(PASSWORD, 4);
let counter = 0;
const nextPhone = () => `+2547${String(10_000_000 + ++counter)}`;

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function resetDb() {
  await prisma.review.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.gasProduct.deleteMany();
  await prisma.waterProduct.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.address.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();
}

export async function createCustomer() {
  const user = await prisma.user.create({
    data: { phone: nextPhone(), passwordHash, fullName: 'Test Customer', role: 'CUSTOMER', customer: { create: {} } },
    include: { customer: true },
  });
  return { user, customerId: user.customer!.id, token: signAccessToken(user.id, user.role) };
}

export async function createSupplier(status: SupplierStatus = 'APPROVED') {
  const user = await prisma.user.create({
    data: {
      phone: nextPhone(),
      passwordHash,
      fullName: 'Test Supplier',
      role: 'SUPPLIER',
      supplier: { create: { businessName: 'Test Gas Ltd', businessPhone: '+254711111111', address: 'Test Road, Nairobi', status } },
    },
    include: { supplier: true },
  });
  return { user, supplierId: user.supplier!.id, token: signAccessToken(user.id, user.role) };
}

export async function createDriver(supplierId: string) {
  const user = await prisma.user.create({
    data: { phone: nextPhone(), passwordHash, fullName: 'Test Driver', role: 'DRIVER', driver: { create: { supplierId } } },
    include: { driver: true },
  });
  return { user, driverId: user.driver!.id, token: signAccessToken(user.id, user.role) };
}

export async function createAdmin() {
  const user = await prisma.user.create({
    data: { phone: nextPhone(), passwordHash, fullName: 'Test Admin', role: 'ADMIN' },
  });
  return { user, token: signAccessToken(user.id, user.role) };
}

export function createDelivery(p: { customerId: string; supplierId: string; driverId: string }) {
  return prisma.delivery.create({
    data: {
      driver: { connect: { id: p.driverId } },
      order: {
        create: {
          orderNumber: `T-${++counter}`,
          customerId: p.customerId,
          supplierId: p.supplierId,
          paymentMethod: PaymentMethod.MPESA,
          subtotal: 1000,
          deliveryFee: 100,
          total: 1100,
          deliveryAddressLine: 'Test address',
          deliveryPhone: '+254711111111',
        },
      },
    },
  });
}