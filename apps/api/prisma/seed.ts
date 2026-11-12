import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const seedUserPassword = process.env.SEED_USER_PASSWORD;
  if (!seedUserPassword) {
    throw new Error('SEED_USER_PASSWORD must be set before running the seed');
  }
  const hashedPassword = await bcrypt.hash(seedUserPassword, 10);

  // Créer un utilisateur Admin de test
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      phone: '+21600000001',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      preferredLang: 'FR',
      displayName: { fr: 'Admin Test', en: 'Admin Test', ar: 'مسؤول اختبار' },
      mfaEnabled: false,
    },
  });

  console.log('✅ Admin créé:', admin.email);
  console.log('   👤 Role: ADMIN');

  // Créer un utilisateur Client de test
  const client = await prisma.user.upsert({
    where: { email: 'client@test.com' },
    update: {},
    create: {
      email: 'client@test.com',
      phone: '+21600000002',
      passwordHash: hashedPassword,
      role: 'CLIENT',
      status: 'ACTIVE',
      preferredLang: 'FR',
      displayName: { fr: 'Client Test', en: 'Test Client', ar: 'عميل اختبار' },
    },
  });

  console.log('✅ Client créé:', client.email);
  console.log('   👤 Role: CLIENT');

  console.log('\n🎉 Seeding terminé avec succès!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur de seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
