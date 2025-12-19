import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@finvision.com' },
    update: {},
    create: {
      email: 'admin@finvision.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true,
    },
  });

  // Create payment gateways
  await prisma.paymentGateway.upsert({
    where: { gatewayName: 'esewa' },
    update: {},
    create: {
      gatewayName: 'esewa',
      isActive: true,
    },
  });

  await prisma.paymentGateway.upsert({
    where: { gatewayName: 'khalti' },
    update: {},
    create: {
      gatewayName: 'khalti',
      isActive: true,
    },
  });

  console.log('Seed data created:', { admin });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });















