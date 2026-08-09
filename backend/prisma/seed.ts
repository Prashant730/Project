import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── Users ────────────────────────────────────────────────────────────────
  console.log('\n📦 Seeding users...');
  const userDefs = [
    { name: 'Admin User',       email: 'admin@test.com',     role: 'ADMIN'     as const },
    { name: 'Sales Rep',        email: 'sales@test.com',     role: 'SALES'     as const },
    { name: 'Warehouse Staff',  email: 'warehouse@test.com', role: 'WAREHOUSE' as const },
    { name: 'Accounts User',    email: 'accounts@test.com',  role: 'ACCOUNTS'  as const },
  ];
  const users: Record<string, any> = {};
  for (const u of userDefs) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      users[u.role] = await prisma.user.create({ data: { ...u, passwordHash } });
      console.log(`  ✅ Created: ${u.email}`);
    } else {
      users[u.role] = existing;
      console.log(`  ⏭  Exists:  ${u.email}`);
    }
  }

  // ─── Challan Sequence ─────────────────────────────────────────────────────
  const existingSeq = await prisma.sequence.findUnique({ where: { id: 'challan' } });
  if (!existingSeq) {
    await prisma.sequence.create({ data: { id: 'challan', value: 0 } });
  }

  const adminId = users['ADMIN'].id;
  const salesId = users['SALES'].id;

  // ─── Customers ────────────────────────────────────────────────────────────
  console.log('\n👥 Seeding customers...');
  const customerDefs = [
    {
      name: 'Arjun Mehta',        mobile: '9876543210', email: 'arjun@acmecorp.in',
      businessName: 'Acme Corp',   gstNumber: '27ACMEC1234A1Z5', customerType: 'WHOLESALE' as const,
      status: 'ACTIVE' as const,   address: '42 Industrial Estate, Pune, Maharashtra 411001',
      followUpDate: new Date('2026-09-01'),
    },
    {
      name: 'Priya Sharma',        mobile: '9123456780', email: 'priya@brightgoods.com',
      businessName: 'Bright Goods', gstNumber: '06BRTGD5678B2Z3', customerType: 'DISTRIBUTOR' as const,
      status: 'ACTIVE' as const,   address: '15 Connaught Place, New Delhi 110001',
      followUpDate: new Date('2026-08-20'),
    },
    {
      name: 'Rohan Desai',         mobile: '9988776655', email: 'rohan.desai@retail.co',
      businessName: null,           gstNumber: null, customerType: 'RETAIL' as const,
      status: 'LEAD' as const,      address: '8 MG Road, Bengaluru, Karnataka 560001',
      followUpDate: new Date('2026-08-15'),
    },
    {
      name: 'Kavita Nair',         mobile: '9812345678', email: 'kavita@horizonmart.in',
      businessName: 'Horizon Mart', gstNumber: '32HRZMT9012C3Z8', customerType: 'WHOLESALE' as const,
      status: 'ACTIVE' as const,   address: '22 Marine Drive, Mumbai, Maharashtra 400002',
      followUpDate: null,
    },
    {
      name: 'Deepak Patel',        mobile: '9701234567', email: null,
      businessName: 'Patel Traders', gstNumber: null, customerType: 'RETAIL' as const,
      status: 'INACTIVE' as const,  address: '5 CG Road, Ahmedabad, Gujarat 380009',
      followUpDate: null,
    },
    {
      name: 'Sunita Rao',          mobile: '9456781234', email: 'sunita@sunenterprises.com',
      businessName: 'Sun Enterprises', gstNumber: '36SUNE3456D4Z1', customerType: 'DISTRIBUTOR' as const,
      status: 'ACTIVE' as const,   address: '9 Jubilee Hills, Hyderabad, Telangana 500033',
      followUpDate: new Date('2026-09-10'),
    },
  ];

  const customers: any[] = [];
  for (const c of customerDefs) {
    const existing = await prisma.customer.findFirst({ where: { mobile: c.mobile } });
    if (!existing) {
      const created = await prisma.customer.create({
        data: { ...c, createdById: salesId },
      });
      customers.push(created);
      console.log(`  ✅ ${c.name}`);
    } else {
      customers.push(existing);
      console.log(`  ⏭  ${c.name} already exists`);
    }
  }

  // Seed a few notes on the first customer
  if (customers[0]) {
    const noteCount = await prisma.customerNote.count({ where: { customerId: customers[0].id } });
    if (noteCount === 0) {
      await prisma.customerNote.createMany({
        data: [
          { customerId: customers[0].id, note: 'Met at trade fair – very interested in bulk order for Q3.', createdById: salesId },
          { customerId: customers[0].id, note: 'Requested credit period of 45 days. Escalate to admin for approval.', createdById: salesId },
        ],
      });
    }
  }

  // ─── Products ─────────────────────────────────────────────────────────────
  console.log('\n📦 Seeding products...');
  const productDefs = [
    { name: 'Wireless Bluetooth Earbuds',  sku: 'BT-EARBUDS-01', unitPrice: 1299.00, currentStock: 150, minStockAlert: 20, category: 'Electronics' },
    { name: 'USB-C Fast Charger 65W',       sku: 'USB-CHG-65W',   unitPrice: 899.00,  currentStock: 200, minStockAlert: 30, category: 'Electronics' },
    { name: 'Ergonomic Laptop Stand',       sku: 'LAP-STAND-01',  unitPrice: 1899.00, currentStock: 75,  minStockAlert: 15, category: 'Accessories' },
    { name: 'Mechanical Keyboard TKL',      sku: 'KB-MECH-TKL',   unitPrice: 3499.00, currentStock: 40,  minStockAlert: 10, category: 'Electronics' },
    { name: 'Webcam 1080p HD',              sku: 'CAM-1080P-01',  unitPrice: 2199.00, currentStock: 8,   minStockAlert: 10, category: 'Electronics' },   // Low stock
    { name: 'Desk Organizer Set',           sku: 'ORG-DESK-SET',  unitPrice: 499.00,  currentStock: 300, minStockAlert: 50, category: 'Stationery'  },
    { name: 'Premium Notebook A5 (Pack 3)', sku: 'NB-A5-PACK3',   unitPrice: 299.00,  currentStock: 5,   minStockAlert: 20, category: 'Stationery'  },   // Low stock
    { name: 'Smart LED Desk Lamp',          sku: 'LAMP-LED-DESK', unitPrice: 1599.00, currentStock: 60,  minStockAlert: 10, category: 'Electronics' },
    { name: 'Mouse Pad XL (90cm)',          sku: 'MP-XL-90CM',    unitPrice: 649.00,  currentStock: 120, minStockAlert: 25, category: 'Accessories' },
    { name: 'HDMI 2.1 Cable 2m',           sku: 'HDMI-2M-21',    unitPrice: 349.00,  currentStock: 180, minStockAlert: 30, category: 'Accessories' },
  ];

  const products: any[] = [];
  for (const p of productDefs) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      const created = await prisma.product.create({
        data: { ...p, createdById: adminId },
      });
      // Record opening stock movement
      await prisma.stockMovement.create({
        data: {
          productId: created.id,
          quantity: p.currentStock,
          movementType: 'IN',
          reason: 'Opening stock',
          createdById: adminId,
        },
      });
      products.push(created);
      console.log(`  ✅ ${p.name} (Stock: ${p.currentStock})`);
    } else {
      products.push(existing);
      console.log(`  ⏭  ${p.sku} already exists`);
    }
  }

  // ─── Challans ─────────────────────────────────────────────────────────────
  console.log('\n🧾 Seeding challans...');

  const existingChallans = await prisma.challan.count();
  if (existingChallans > 0) {
    console.log('  ⏭  Challans already exist, skipping.');
  } else {
    // Helper to get next challan number
    const nextChallanNumber = async () => {
      const seq = await prisma.sequence.update({
        where: { id: 'challan' },
        data: { value: { increment: 1 } },
      });
      return `CHN-${String(seq.value).padStart(5, '0')}`;
    };

    // Challan 1 — CONFIRMED (Acme Corp)
    const ch1Items = [
      { product: products[0], quantity: 10 },
      { product: products[1], quantity: 5  },
    ];
    const ch1Subtotals = ch1Items.map(i => i.quantity * Number(i.product.unitPrice));
    const ch1 = await prisma.challan.create({
      data: {
        challanNumber: await nextChallanNumber(),
        customerId: customers[0].id,
        createdById: salesId,
        status: 'CONFIRMED',
        totalQuantity: ch1Items.reduce((s, i) => s + i.quantity, 0),
        items: {
          create: ch1Items.map((i, idx) => ({
            productId: i.product.id,
            productNameSnapshot: i.product.name,
            productSkuSnapshot: i.product.sku,
            unitPriceSnapshot: i.product.unitPrice,
            quantity: i.quantity,
            subtotal: ch1Subtotals[idx],
          })),
        },
      },
    });
    // Deduct stock for confirmed challan
    for (const item of ch1Items) {
      await prisma.product.update({
        where: { id: item.product.id },
        data: { currentStock: { decrement: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: {
          productId: item.product.id,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: `Challan ${ch1.challanNumber}`,
          createdById: salesId,
        },
      });
    }
    console.log(`  ✅ ${ch1.challanNumber} — CONFIRMED (Acme Corp)`);

    // Challan 2 — CONFIRMED (Bright Goods)
    const ch2Items = [
      { product: products[3], quantity: 5  },
      { product: products[8], quantity: 20 },
    ];
    const ch2Subtotals = ch2Items.map(i => i.quantity * Number(i.product.unitPrice));
    const ch2 = await prisma.challan.create({
      data: {
        challanNumber: await nextChallanNumber(),
        customerId: customers[1].id,
        createdById: salesId,
        status: 'CONFIRMED',
        totalQuantity: ch2Items.reduce((s, i) => s + i.quantity, 0),
        items: {
          create: ch2Items.map((i, idx) => ({
            productId: i.product.id,
            productNameSnapshot: i.product.name,
            productSkuSnapshot: i.product.sku,
            unitPriceSnapshot: i.product.unitPrice,
            quantity: i.quantity,
            subtotal: ch2Subtotals[idx],
          })),
        },
      },
    });
    for (const item of ch2Items) {
      await prisma.product.update({
        where: { id: item.product.id },
        data: { currentStock: { decrement: item.quantity } },
      });
      await prisma.stockMovement.create({
        data: {
          productId: item.product.id,
          quantity: item.quantity,
          movementType: 'OUT',
          reason: `Challan ${ch2.challanNumber}`,
          createdById: salesId,
        },
      });
    }
    console.log(`  ✅ ${ch2.challanNumber} — CONFIRMED (Bright Goods)`);

    // Challan 3 — DRAFT (Horizon Mart)
    const ch3Items = [
      { product: products[2], quantity: 3 },
      { product: products[7], quantity: 6 },
      { product: products[9], quantity: 10 },
    ];
    const ch3 = await prisma.challan.create({
      data: {
        challanNumber: await nextChallanNumber(),
        customerId: customers[3].id,
        createdById: salesId,
        status: 'DRAFT',
        totalQuantity: ch3Items.reduce((s, i) => s + i.quantity, 0),
        items: {
          create: ch3Items.map(i => ({
            productId: i.product.id,
            productNameSnapshot: i.product.name,
            productSkuSnapshot: i.product.sku,
            unitPriceSnapshot: i.product.unitPrice,
            quantity: i.quantity,
            subtotal: i.quantity * Number(i.product.unitPrice),
          })),
        },
      },
    });
    console.log(`  ✅ ${ch3.challanNumber} — DRAFT (Horizon Mart)`);

    // Challan 4 — CANCELLED (Rohan Desai)
    const ch4Items = [{ product: products[5], quantity: 50 }];
    const ch4 = await prisma.challan.create({
      data: {
        challanNumber: await nextChallanNumber(),
        customerId: customers[2].id,
        createdById: salesId,
        status: 'CANCELLED',
        totalQuantity: 50,
        items: {
          create: ch4Items.map(i => ({
            productId: i.product.id,
            productNameSnapshot: i.product.name,
            productSkuSnapshot: i.product.sku,
            unitPriceSnapshot: i.product.unitPrice,
            quantity: i.quantity,
            subtotal: i.quantity * Number(i.product.unitPrice),
          })),
        },
      },
    });
    console.log(`  ✅ ${ch4.challanNumber} — CANCELLED (Rohan Desai)`);
  }

  console.log('\n✨ All seeding complete!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

