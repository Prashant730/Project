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

  const users = [
    { name: 'Admin User', email: 'admin@test.com', role: 'ADMIN' as const },
    { name: 'Sales Rep', email: 'sales@test.com', role: 'SALES' as const },
    { name: 'Warehouse Staff', email: 'warehouse@test.com', role: 'WAREHOUSE' as const },
    { name: 'Accounts User', email: 'accounts@test.com', role: 'ACCOUNTS' as const },
  ];

  console.log('Seeding users...');
  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          ...user,
          passwordHash,
        },
      });
      console.log(`Created user: ${user.email} (Role: ${user.role})`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  // Initialize Challan Sequence
  const existingSeq = await prisma.sequence.findUnique({ where: { id: 'challan' } });
  if (!existingSeq) {
    await prisma.sequence.create({
      data: {
        id: 'challan',
        value: 0
      }
    });
    console.log('Initialized challan sequence counter.');
  } else {
    console.log('Challan sequence counter already exists.');
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
