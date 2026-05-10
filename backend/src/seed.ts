import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ 
  connectionString,
  ssl: connectionString?.includes('neon.tech') ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding data...');

  // Create Categories
  const cat1 = await prisma.category.upsert({
    where: { name: 'เครื่องเขียน' },
    update: {},
    create: { name: 'เครื่องเขียน' },
  });

  const cat2 = await prisma.category.upsert({
    where: { name: 'ขนม/เครื่องดื่ม' },
    update: {},
    create: { name: 'ขนม/เครื่องดื่ม' },
  });

  // Create Products
  await prisma.product.upsert({
    where: { barcode: '8850000000001' },
    update: {},
    create: {
      name: 'สมุดโรงเรียน (เส้นเดี่ยว)',
      barcode: '8850000000001',
      price: 15,
      costPrice: 10,
      stockQty: 50,
      lowStockThreshold: 10,
      isShortcut: true,
      categoryId: cat1.id,
    },
  });

  await prisma.product.upsert({
    where: { barcode: '8850000000002' },
    update: {},
    create: {
      name: 'ดินสอ 2B',
      barcode: '8850000000002',
      price: 5,
      costPrice: 2,
      stockQty: 100,
      lowStockThreshold: 20,
      isShortcut: true,
      categoryId: cat1.id,
    },
  });

  await prisma.product.upsert({
    where: { barcode: '8850000000003' },
    update: {},
    create: {
      name: 'น้ำดื่ม 600ml',
      barcode: '8850000000003',
      price: 7,
      costPrice: 4,
      stockQty: 5, // Low stock for testing
      lowStockThreshold: 10,
      isShortcut: true,
      categoryId: cat2.id,
    },
  });

  // Create or Upgrade Admin User
  await prisma.user.upsert({
    where: { username: 'admin@shoppp.com' },
    update: {
      role: 'ADMIN', // Force upgrade if already exists
    },
    create: {
      username: 'admin@shoppp.com',
      password: 'ADMIN_PASSWORD', 
      name: 'คุณครูดูแลระบบ',
      role: 'ADMIN',
    },
  });

  console.log('Seeding finished.');
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
