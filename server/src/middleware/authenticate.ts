import type { NextFunction, Request, Response } from 'express';
import type { Role, SupplierStatus } from '@prisma/client';
import { prisma } from '../db';
import { forbidden, unauthorized } from '../lib/errors';
import { verifyAccessToken } from '../lib/tokens';

export type AuthUser = {
  id: string;
  role: Role;
  customerId?: string;
  supplierId?: string;
  supplierStatus?: SupplierStatus;
  driverId?: string;
};

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw unauthorized();

    let userId: string;
    try {
      userId = verifyAccessToken(header.slice(7)).sub;
    } catch {
      throw unauthorized('Invalid or expired token', 'INVALID_TOKEN');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        customer: { select: { id: true } },
        supplier: { select: { id: true, status: true } },
        driver: { select: { id: true } },
      },
    });
    if (!user) throw unauthorized('Invalid or expired token', 'INVALID_TOKEN');
    if (user.status !== 'ACTIVE') throw forbidden('This account has been suspended', 'ACCOUNT_SUSPENDED');

    req.user = {
      id: user.id,
      role: user.role,
      customerId: user.customer?.id,
      supplierId: user.supplier?.id,
      supplierStatus: user.supplier?.status,
      driverId: user.driver?.id,
    };
    next();
  } catch (err) {
    next(err);
  }
}

export function requireUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}