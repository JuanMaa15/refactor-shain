import 'dotenv/config';
import { PrismaClient, UserRole } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString =
  process.env.DATABASE_URL || process.env.DATABASE_URL_LOCAL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const roles = [
  { name: UserRole.ADMIN },
  { name: UserRole.SERVICE_PROVIDER },
  { name: UserRole.BUSINESS_OWNER },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        isActive: true,
      },
    });
  }

  console.log('Roles seeded successfully');

  const adminRole = await prisma.role.findUnique({
    where: { name: UserRole.ADMIN },
  });

  if (!adminRole) throw new Error('Admin role not found');

  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: { id: '9e24eae2-30d8-4f22-ad8b-b548d8470c21' },
    update: {},
    create: {
      id: '9e24eae2-30d8-4f22-ad8b-b548d8470c21',
      name: 'Admin',
      lastName: 'Shain',
      username: 'admin',
      email: 'admin@shain.finance',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  console.log('Admin user seeded successfully');
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
