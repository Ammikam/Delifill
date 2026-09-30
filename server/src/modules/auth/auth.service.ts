import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../db';
import { badRequest, conflict, forbidden, notFound, unauthorized } from '../../lib/errors';
import { generateOpaqueToken, hashToken, signAccessToken } from '../../lib/tokens';
import { messenger } from '../../services/messenger';
import type { RegisterCustomerInput, RegisterSupplierInput } from './auth.schemas';

const DAY_MS = 86_400_000;
// Compared against when the phone number is unknown, so response time does not reveal it.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', env.BCRYPT_COST);

const userSelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  role: true,
  status: true,
  customer: { select: { id: true } },
  supplier: { select: { id: true, status: true, businessName: true } },
  driver: { select: { id: true, supplierId: true } },
} satisfies Prisma.UserSelect;

async function issueTokens(userId: string, role: Role) {
  const refreshToken = generateOpaqueToken();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    },
  });
  return {
    accessToken: signAccessToken(userId, role),
    refreshToken,
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  };
}

function rethrowUnique(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw conflict('An account with this phone number or email already exists', 'ACCOUNT_EXISTS');
  }
  throw err;
}

export async function getSessionUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  if (!user) throw notFound('User not found');
  return user;
}

export async function registerCustomer(input: RegisterCustomerInput) {
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_COST);
  try {
    const user = await prisma.user.create({
      data: {
        phone: input.phone,
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        role: Role.CUSTOMER,
        customer: { create: {} },
      },
      select: userSelect,
    });
    return { user, tokens: await issueTokens(user.id, user.role) };
  } catch (err) {
    return rethrowUnique(err);
  }
}

export async function registerSupplier(input: RegisterSupplierInput) {
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_COST);
  try {
    const user = await prisma.user.create({
      data: {
        phone: input.phone,
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        role: Role.SUPPLIER,
        supplier: {
          create: {
            businessName: input.businessName,
            businessPhone: input.businessPhone ?? input.phone,
            address: input.address,
          },
        },
      },
      select: userSelect,
    });
    return { user, tokens: await issueTokens(user.id, user.role) };
  } catch (err) {
    return rethrowUnique(err);
  }
}

export async function login(phone: string, password: string) {
  const found = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, role: true, status: true, passwordHash: true },
  });
  const passwordOk = await bcrypt.compare(password, found?.passwordHash ?? DUMMY_HASH);
  if (!found || !passwordOk) {
    throw unauthorized('Incorrect phone number or password', 'INVALID_CREDENTIALS');
  }
  if (found.status !== 'ACTIVE') {
    throw forbidden('This account has been suspended', 'ACCOUNT_SUSPENDED');
  }
  return { user: await getSessionUser(found.id), tokens: await issueTokens(found.id, found.role) };
}

export async function refreshSession(token: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { role: true, status: true } } },
  });
  if (!record) throw unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');

  if (record.revokedAt) {
    // A revoked token was presented again: assume theft and end every session for this user.
    await prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw unauthorized('Session is no longer valid. Please sign in again.', 'REFRESH_TOKEN_REUSED');
  }
  if (record.expiresAt < new Date()) {
    throw unauthorized('Session expired. Please sign in again.', 'REFRESH_TOKEN_EXPIRED');
  }
  if (record.user.status !== 'ACTIVE') {
    throw forbidden('This account has been suspended', 'ACCOUNT_SUSPENDED');
  }

  const claimed = await prisma.refreshToken.updateMany({
    where: { id: record.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (claimed.count !== 1) throw unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');

  return issueTokens(record.userId, record.user.role);
}

export async function logout(token: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function requestPasswordReset(phone: string) {
  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, status: true } });
  if (!user || user.status !== 'ACTIVE') return; // Same outward behavior either way.

  const token = generateOpaqueToken();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60_000),
      },
    }),
  ]);

  try {
    await messenger.sendPasswordReset(phone, token);
  } catch {
    console.error('Failed to send password reset message');
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw badRequest('This reset code is invalid or has expired', 'INVALID_RESET_TOKEN');
  }
  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_COST);

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw badRequest('This reset code is invalid or has expired', 'INVALID_RESET_TOKEN');
    }
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });
}