import { PrismaClient, ProductType, ServiceType, Role, SupplierStatus, DriverStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Development only. Never use this password outside local seed data.
const DEV_PASSWORD = 'Password123!';

async function clean() {
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
  await prisma.user.deleteMany();
}

type ProductSpec =
  | { kind: 'gas'; brand: string; sizeKg: number; service: ServiceType; price: number; stock: number }
  | { kind: 'water'; sizeLitres: number; service: ServiceType; price: number; stock: number }
  | { kind: 'accessory'; name: string; price: number; stock: number };

const serviceLabel: Record<ServiceType, string> = {
  REFILL: 'Refill',
  EXCHANGE: 'Exchange',
  NEW: 'New cylinder with gas',
};

async function main() {
  await clean();
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  const admin = await prisma.user.create({
    data: { phone: '+254700000000', email: 'admin@delifill.test', passwordHash, fullName: 'Delifill Admin', role: Role.ADMIN },
  });

  const [gasCat, waterCat, accCat] = await Promise.all([
    prisma.productCategory.create({ data: { name: 'Cooking Gas', slug: 'cooking-gas', type: ProductType.GAS } }),
    prisma.productCategory.create({ data: { name: 'Drinking Water', slug: 'drinking-water', type: ProductType.WATER } }),
    prisma.productCategory.create({ data: { name: 'Accessories', slug: 'accessories', type: ProductType.ACCESSORY } }),
  ]);

  // Customers
  const customers = [
    { phone: '+254711000001', fullName: 'Wanjiru Kamau', line: 'Kilimani Road, Apartment 4B', estate: 'Kilimani', landmark: 'Near Yaya Centre' },
    { phone: '+254711000002', fullName: 'Brian Otieno', line: 'Gate C, Fedha Estate', estate: 'Embakasi', landmark: 'Opposite Fedha Stage' },
  ];
  for (const c of customers) {
    const user = await prisma.user.create({
      data: { phone: c.phone, passwordHash, fullName: c.fullName, role: Role.CUSTOMER },
    });
    await prisma.customer.create({
      data: {
        userId: user.id,
        addresses: {
          create: { label: 'Home', addressLine: c.line, estate: c.estate, landmark: c.landmark, isDefault: true },
        },
      },
    });
  }

  // Suppliers with drivers and products
  const suppliers: {
    phone: string; fullName: string; businessName: string; address: string; status: SupplierStatus;
    drivers: { phone: string; fullName: string; vehicleType: string; vehiclePlate: string }[];
    products: ProductSpec[];
  }[] = [
    {
      phone: '+254722000001', fullName: 'Peter Mwangi', businessName: 'Westlands Gas and Water',
      address: 'Ring Road Westlands, Nairobi', status: SupplierStatus.APPROVED,
      drivers: [
        { phone: '+254733000001', fullName: 'James Kiprop', vehicleType: 'Motorbike', vehiclePlate: 'KMFA 123A' },
        { phone: '+254733000002', fullName: 'Samuel Njoroge', vehicleType: 'Pickup', vehiclePlate: 'KDG 456B' },
      ],
      products: [
        { kind: 'gas', brand: 'K-Gas', sizeKg: 6, service: ServiceType.REFILL, price: 1050, stock: 40 },
        { kind: 'gas', brand: 'K-Gas', sizeKg: 13, service: ServiceType.REFILL, price: 2400, stock: 25 },
        { kind: 'gas', brand: 'Total', sizeKg: 6, service: ServiceType.EXCHANGE, price: 1150, stock: 30 },
        { kind: 'gas', brand: 'K-Gas', sizeKg: 6, service: ServiceType.NEW, price: 3600, stock: 12 },
        { kind: 'water', sizeLitres: 20, service: ServiceType.REFILL, price: 80, stock: 100 },
        { kind: 'water', sizeLitres: 20, service: ServiceType.NEW, price: 550, stock: 20 },
        { kind: 'accessory', name: 'Gas regulator', price: 650, stock: 15 },
      ],
    },
    {
      phone: '+254722000002', fullName: 'Grace Achieng', businessName: 'Embakasi Energy Supplies',
      address: 'Outer Ring Road, Embakasi, Nairobi', status: SupplierStatus.APPROVED,
      drivers: [{ phone: '+254733000003', fullName: 'Daniel Mutua', vehicleType: 'Motorbike', vehiclePlate: 'KMGB 789C' }],
      products: [
        { kind: 'gas', brand: 'Hashi Energy', sizeKg: 6, service: ServiceType.REFILL, price: 1000, stock: 35 },
        { kind: 'gas', brand: 'Hashi Energy', sizeKg: 13, service: ServiceType.REFILL, price: 2350, stock: 3 },
        { kind: 'gas', brand: 'ProGas', sizeKg: 6, service: ServiceType.EXCHANGE, price: 1100, stock: 20 },
        { kind: 'water', sizeLitres: 20, service: ServiceType.REFILL, price: 70, stock: 150 },
        { kind: 'water', sizeLitres: 20, service: ServiceType.EXCHANGE, price: 90, stock: 60 },
        { kind: 'accessory', name: 'Gas hose pipe with clips, 1.5 m', price: 350, stock: 25 },
      ],
    },
    {
      phone: '+254722000003', fullName: 'Hassan Ali', businessName: 'Pending Supplier (awaiting approval)',
      address: 'Eastleigh, Nairobi', status: SupplierStatus.PENDING, drivers: [], products: [],
    },
  ];

  for (const s of suppliers) {
    const user = await prisma.user.create({
      data: { phone: s.phone, passwordHash, fullName: s.fullName, role: Role.SUPPLIER },
    });
    const supplier = await prisma.supplier.create({
      data: {
        userId: user.id, businessName: s.businessName, businessPhone: s.phone,
        address: s.address, status: s.status,
      },
    });

    for (const d of s.drivers) {
      const driverUser = await prisma.user.create({
        data: { phone: d.phone, passwordHash, fullName: d.fullName, role: Role.DRIVER },
      });
      await prisma.driver.create({
        data: {
          userId: driverUser.id, supplierId: supplier.id, vehicleType: d.vehicleType,
          vehiclePlate: d.vehiclePlate, status: DriverStatus.AVAILABLE,
        },
      });
    }

    for (const p of s.products) {
      if (p.kind === 'gas') {
        await prisma.product.create({
          data: {
            supplierId: supplier.id, categoryId: gasCat.id, type: ProductType.GAS,
            name: `${p.brand} ${p.sizeKg} kg ${serviceLabel[p.service]}`, price: p.price,
            gasProduct: { create: { brand: p.brand, sizeKg: p.sizeKg, serviceType: p.service } },
            inventory: { create: { supplierId: supplier.id, quantity: p.stock } },
          },
        });
      } else if (p.kind === 'water') {
        await prisma.product.create({
          data: {
            supplierId: supplier.id, categoryId: waterCat.id, type: ProductType.WATER,
            name: `Drinking water ${p.sizeLitres} L ${p.service === 'NEW' ? 'New container' : serviceLabel[p.service]}`,
            price: p.price,
            waterProduct: { create: { sizeLitres: p.sizeLitres, serviceType: p.service } },
            inventory: { create: { supplierId: supplier.id, quantity: p.stock } },
          },
        });
      } else {
        await prisma.product.create({
          data: {
            supplierId: supplier.id, categoryId: accCat.id, type: ProductType.ACCESSORY,
            name: p.name, price: p.price,
            inventory: { create: { supplierId: supplier.id, quantity: p.stock } },
          },
        });
      }
    }
  }

  console.log(`Seeded. Admin login: ${admin.phone} / ${DEV_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());