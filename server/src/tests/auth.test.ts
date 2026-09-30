import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../app';
import { env } from '../config/env';
import { prisma } from '../db';
import { messenger } from '../services/messenger';
import { PASSWORD, bearer, createCustomer, resetDb } from './helpers';

const customerBody = { fullName: 'Amina Wanjiku', phone: '0712345678', password: 'Secret123' };

beforeEach(async () => {
  await resetDb();
  vi.restoreAllMocks();
});
afterAll(() => prisma.$disconnect());

describe('registration', () => {
  it('registers a customer, normalizes the phone and never returns the hash', async () => {
    const res = await request(app).post('/api/v1/auth/register/customer').send(customerBody);
    expect(res.status).toBe(201);
    expect(res.body.user.phone).toBe('+254712345678');
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.tokens.accessToken).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rejects a duplicate phone number in a different format', async () => {
    await request(app).post('/api/v1/auth/register/customer').send(customerBody);
    const res = await request(app)
      .post('/api/v1/auth/register/customer')
      .send({ ...customerBody, phone: '+254 712 345 678' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ACCOUNT_EXISTS');
  });

  it('rejects weak passwords and invalid phones', async () => {
    const weak = await request(app).post('/api/v1/auth/register/customer').send({ ...customerBody, password: 'short' });
    expect(weak.status).toBe(400);
    const badPhone = await request(app).post('/api/v1/auth/register/customer').send({ ...customerBody, phone: '12345' });
    expect(badPhone.status).toBe(400);
  });

  it('registers a supplier as PENDING', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register/supplier')
      .send({ ...customerBody, businessName: 'Kilimani Gas', address: 'Argwings Kodhek Road' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('SUPPLIER');
    expect(res.body.user.supplier.status).toBe('PENDING');
  });
});

describe('login', () => {
  it('logs in with any accepted phone format', async () => {
    await request(app).post('/api/v1/auth/register/customer').send(customerBody);
    const res = await request(app).post('/api/v1/auth/login').send({ phone: '254712345678', password: 'Secret123' });
    expect(res.status).toBe(200);
    expect(res.body.tokens.refreshToken).toBeTruthy();
  });

  it('gives the same error for a wrong password and an unknown phone', async () => {
    await request(app).post('/api/v1/auth/register/customer').send(customerBody);
    const wrong = await request(app).post('/api/v1/auth/login').send({ phone: '0712345678', password: 'Wrong1234' });
    const unknown = await request(app).post('/api/v1/auth/login').send({ phone: '0799999999', password: 'Wrong1234' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('blocks suspended users at login and on existing tokens', async () => {
    const { user, token } = await createCustomer();
    await prisma.user.update({ where: { id: user.id }, data: { status: 'SUSPENDED' } });
    const login = await request(app).post('/api/v1/auth/login').send({ phone: user.phone, password: PASSWORD });
    expect(login.status).toBe(403);
    const me = await request(app).get('/api/v1/auth/me').set(bearer(token));
    expect(me.status).toBe(403);
  });
});

describe('access tokens', () => {
  it('requires a valid token', async () => {
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me').set(bearer('garbage'))).status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const { user } = await createCustomer();
    const expired = jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, { subject: user.id, expiresIn: -10 });
    expect((await request(app).get('/api/v1/auth/me').set(bearer(expired))).status).toBe(401);
  });

  it('returns the current user', async () => {
    const { user, token } = await createCustomer();
    const res = await request(app).get('/api/v1/auth/me').set(bearer(token));
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });
});

describe('refresh tokens', () => {
  async function session() {
    await request(app).post('/api/v1/auth/register/customer').send(customerBody);
    const res = await request(app).post('/api/v1/auth/login').send({ phone: '0712345678', password: 'Secret123' });
    return res.body.tokens.refreshToken as string;
  }

  it('rotates the refresh token', async () => {
    const first = await session();
    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: first });
    expect(res.status).toBe(200);
    expect(res.body.tokens.refreshToken).not.toBe(first);
  });

  it('treats reuse of a rotated token as theft and revokes the whole session', async () => {
    const first = await session();
    const rotated = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: first });
    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: first });
    expect(reuse.status).toBe(401);
    const newest = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: rotated.body.tokens.refreshToken });
    expect(newest.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const token = await session();
    expect((await request(app).post('/api/v1/auth/logout').send({ refreshToken: token })).status).toBe(204);
    expect((await request(app).post('/api/v1/auth/refresh').send({ refreshToken: token })).status).toBe(401);
  });
});

describe('password reset', () => {
  it('resets the password once and ends existing sessions', async () => {
    const send = vi.spyOn(messenger, 'sendPasswordReset').mockResolvedValue();
    const reg = await request(app).post('/api/v1/auth/register/customer').send(customerBody);
    const oldRefresh = reg.body.tokens.refreshToken as string;

    const forgot = await request(app).post('/api/v1/auth/forgot-password').send({ phone: '0712345678' });
    expect(forgot.status).toBe(202);
    expect(send).toHaveBeenCalledOnce();
    const code = send.mock.calls[0][1];

    const reset = await request(app).post('/api/v1/auth/reset-password').send({ token: code, password: 'Newpass123' });
    expect(reset.status).toBe(204);

    expect((await request(app).post('/api/v1/auth/login').send({ phone: '0712345678', password: 'Newpass123' })).status).toBe(200);
    expect((await request(app).post('/api/v1/auth/login').send({ phone: '0712345678', password: 'Secret123' })).status).toBe(401);
    expect((await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldRefresh })).status).toBe(401);

    const again = await request(app).post('/api/v1/auth/reset-password').send({ token: code, password: 'Another123' });
    expect(again.status).toBe(400);
  });

  it('answers identically for unknown numbers and sends nothing', async () => {
    const send = vi.spyOn(messenger, 'sendPasswordReset').mockResolvedValue();
    const res = await request(app).post('/api/v1/auth/forgot-password').send({ phone: '0799999999' });
    expect(res.status).toBe(202);
    expect(send).not.toHaveBeenCalled();
  });
});