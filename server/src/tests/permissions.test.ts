import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app';
import { prisma } from '../db';
import { bearer, createAdmin, createCustomer, createDelivery, createDriver, createSupplier, resetDb } from './helpers';

type Ctx = Awaited<ReturnType<typeof setup>>;
let c: Ctx;

async function setup() {
  await resetDb();
  const customerA = await createCustomer();
  const customerB = await createCustomer();
  const supplierA = await createSupplier();
  const supplierB = await createSupplier();
  const driverA = await createDriver(supplierA.supplierId);
  const driverB = await createDriver(supplierB.supplierId);
  const admin = await createAdmin();
  const delivery = await createDelivery({
    customerId: customerA.customerId,
    supplierId: supplierA.supplierId,
    driverId: driverA.driverId,
  });
  return { customerA, customerB, supplierA, supplierB, driverA, driverB, admin, delivery };
}

beforeAll(async () => {
  c = await setup();
});
afterAll(() => prisma.$disconnect());

describe('admin endpoints', () => {
  it('rejects anonymous requests', async () => {
    expect((await request(app).get('/api/v1/admin/users')).status).toBe(401);
  });
  it('forbids customers, suppliers and drivers', async () => {
    for (const actor of [c.customerA, c.supplierA, c.driverA]) {
      expect((await request(app).get('/api/v1/admin/users').set(bearer(actor.token))).status).toBe(403);
    }
  });
  it('allows admins', async () => {
    const res = await request(app).get('/api/v1/admin/users').set(bearer(c.admin.token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(7);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });
});

describe('supplier data', () => {
  const path = (id: string) => `/api/v1/suppliers/${id}`;

  it('forbids customers and drivers from supplier endpoints', async () => {
    expect((await request(app).get(path(c.supplierA.supplierId)).set(bearer(c.customerA.token))).status).toBe(403);
    expect((await request(app).get(path(c.supplierA.supplierId)).set(bearer(c.driverA.token))).status).toBe(403);
  });
  it('lets a supplier read only its own profile', async () => {
    expect((await request(app).get(path(c.supplierA.supplierId)).set(bearer(c.supplierA.token))).status).toBe(200);
    expect((await request(app).get(path(c.supplierB.supplierId)).set(bearer(c.supplierA.token))).status).toBe(403);
  });
  it('lets an admin read any supplier and reports missing ones', async () => {
    expect((await request(app).get(path(c.supplierB.supplierId)).set(bearer(c.admin.token))).status).toBe(200);
    expect((await request(app).get(path(randomUUID())).set(bearer(c.admin.token))).status).toBe(404);
  });
});

describe('deliveries', () => {
  const id = () => c.delivery.id;

  it('shows a driver only their own assigned deliveries', async () => {
    const a = await request(app).get('/api/v1/deliveries/mine').set(bearer(c.driverA.token));
    expect(a.status).toBe(200);
    expect(a.body.items).toHaveLength(1);
    const b = await request(app).get('/api/v1/deliveries/mine').set(bearer(c.driverB.token));
    expect(b.body.items).toHaveLength(0);
  });
  it('forbids non-drivers from the driver list', async () => {
    expect((await request(app).get('/api/v1/deliveries/mine').set(bearer(c.customerA.token))).status).toBe(403);
    expect((await request(app).get('/api/v1/deliveries/mine').set(bearer(c.supplierA.token))).status).toBe(403);
  });
  it('lets the assigned driver open the delivery but not another driver', async () => {
    expect((await request(app).get(`/api/v1/deliveries/${id()}`).set(bearer(c.driverA.token))).status).toBe(200);
    expect((await request(app).get(`/api/v1/deliveries/${id()}`).set(bearer(c.driverB.token))).status).toBe(404);
  });
  it('limits customers and suppliers to their own orders', async () => {
    expect((await request(app).get(`/api/v1/deliveries/${id()}`).set(bearer(c.customerA.token))).status).toBe(200);
    expect((await request(app).get(`/api/v1/deliveries/${id()}`).set(bearer(c.customerB.token))).status).toBe(404);
    expect((await request(app).get(`/api/v1/deliveries/${id()}`).set(bearer(c.supplierA.token))).status).toBe(200);
    expect((await request(app).get(`/api/v1/deliveries/${id()}`).set(bearer(c.supplierB.token))).status).toBe(404);
  });
  it('lets admins open any delivery and never exposes the OTP hash', async () => {
    const res = await request(app).get(`/api/v1/deliveries/${id()}`).set(bearer(c.admin.token));
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('otpHash');
  });
});