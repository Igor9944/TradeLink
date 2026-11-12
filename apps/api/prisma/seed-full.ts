import { PrismaClient, Role, UserStatus, KycStatus, OrderStatus, InvoiceStatus, PaymentStatus, ShipmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TradeLink database with realistic data...\n');

  const seedUserPassword = process.env.SEED_USER_PASSWORD;
  if (!seedUserPassword) {
    throw new Error('SEED_USER_PASSWORD must be set before running the seed');
  }
  const hashedPassword = await bcrypt.hash(seedUserPassword, 10);

  // ============================================================
  // 0. NETTOYAGE DES DONNÉES EXISTANTES
  // ============================================================
  console.log('🧹 Cleaning existing data...');
  
  // Ordre de suppression important à cause des foreign keys
  await prisma.auditLog.deleteMany({});
  await prisma.systemConfig.deleteMany({});
  await prisma.floatingButton.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.ticketMessage.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.roomChatMessage.deleteMany({});
  await prisma.roomParticipant.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.voiceCommandLog.deleteMany({});
  await prisma.aiAssistantConfig.deleteMany({});
  await prisma.dynamicFieldSchema.deleteMany({});
  await prisma.ocrDocument.deleteMany({});
  await prisma.generatedDocument.deleteMany({});
  await prisma.accountingEntry.deleteMany({});
  await prisma.calculationPeriod.deleteMany({});
  await prisma.calculationRule.deleteMany({});
  await prisma.proofOfDelivery.deleteMany({});
  await prisma.shipmentEvent.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productTranslation.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.kycDocument.deleteMany({});
  await prisma.kycRecord.deleteMany({});
  await prisma.otpCode.deleteMany({});
  await prisma.userDevice.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('✅ Database cleaned\n');

  // ============================================================
  // 1. UTILISATEURS
  // ============================================================
  console.log('👥 Creating users...');

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tradelink.com' },
    update: {},
    create: {
      email: 'admin@tradelink.com',
      phone: '+21650000001',
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      preferredLang: 'FR',
      displayName: { fr: 'Administrateur Principal', en: 'Main Administrator', ar: 'المدير الرئيسي' },
      mfaEnabled: true,
      timezone: 'Africa/Tunis',
    },
  });

  // Clients
  const client1 = await prisma.user.upsert({
    where: { email: 'mohamed.ben.ali@gmail.com' },
    update: {},
    create: {
      email: 'mohamed.ben.ali@gmail.com',
      phone: '+21651234567',
      passwordHash: hashedPassword,
      role: Role.CLIENT,
      status: UserStatus.ACTIVE,
      preferredLang: 'FR',
      displayName: { fr: 'Mohamed Ben Ali', en: 'Mohamed Ben Ali', ar: 'محمد بن علي' },
      timezone: 'Africa/Tunis',
      kycValidatedAt: new Date(),
    },
  });

  const client2 = await prisma.user.upsert({
    where: { email: 'fatima.diop@outlook.com' },
    update: {},
    create: {
      email: 'fatima.diop@outlook.com',
      phone: '+221771234567',
      passwordHash: hashedPassword,
      role: Role.CLIENT,
      status: UserStatus.ACTIVE,
      preferredLang: 'FR',
      displayName: { fr: 'Fatima Diop', en: 'Fatima Diop', ar: 'فاطمة ضيوف' },
      timezone: 'Africa/Dakar',
      kycValidatedAt: new Date(),
    },
  });

  const client3 = await prisma.user.upsert({
    where: { email: 'ahmed.hassan@yahoo.com' },
    update: {},
    create: {
      email: 'ahmed.hassan@yahoo.com',
      phone: '+20201234567890',
      passwordHash: hashedPassword,
      role: Role.CLIENT,
      status: UserStatus.PENDING_KYC,
      preferredLang: 'AR',
      displayName: { fr: 'Ahmed Hassan', en: 'Ahmed Hassan', ar: 'أحمد حسن' },
      timezone: 'Africa/Cairo',
      kycDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Dans 5 jours
    },
  });

  // Fournisseurs
  const supplier1 = await prisma.user.upsert({
    where: { email: 'contact@africanfood.tn' },
    update: {},
    create: {
      email: 'contact@africanfood.tn',
      phone: '+21671234567',
      passwordHash: hashedPassword,
      role: Role.SUPPLIER,
      status: UserStatus.ACTIVE,
      preferredLang: 'FR',
      displayName: { fr: 'African Food Supply', en: 'African Food Supply', ar: 'شركة الغذاء الأفريقي' },
      timezone: 'Africa/Tunis',
      kycValidatedAt: new Date(),
    },
  });

  const supplier2 = await prisma.user.upsert({
    where: { email: 'sales@techafrique.com' },
    update: {},
    create: {
      email: 'sales@techafrique.com',
      phone: '+225070123456',
      passwordHash: hashedPassword,
      role: Role.SUPPLIER,
      status: UserStatus.ACTIVE,
      preferredLang: 'FR',
      displayName: { fr: 'Tech Afrique Electronics', en: 'Tech Afrique Electronics', ar: 'تك أفريقيا للإلكترونيات' },
      timezone: 'Africa/Abidjan',
      kycValidatedAt: new Date(),
    },
  });

  // Transporteurs
  const transporter1 = await prisma.user.upsert({
    where: { email: 'dispatch@rapidlogistics.tn' },
    update: {},
    create: {
      email: 'dispatch@rapidlogistics.tn',
      phone: '+21622345678',
      passwordHash: hashedPassword,
      role: Role.TRANSPORTER,
      status: UserStatus.ACTIVE,
      preferredLang: 'FR',
      displayName: { fr: 'Rapid Logistics Tunisie', en: 'Rapid Logistics Tunisia', ar: 'لوجستيات السريعة تونس' },
      timezone: 'Africa/Tunis',
      kycValidatedAt: new Date(),
    },
  });

  const transporter2 = await prisma.user.upsert({
    where: { email: 'ops@africanexpress.com' },
    update: {},
    create: {
      email: 'ops@africanexpress.com',
      phone: '+233240123456',
      passwordHash: hashedPassword,
      role: Role.TRANSPORTER,
      status: UserStatus.ACTIVE,
      preferredLang: 'EN',
      displayName: { fr: 'African Express Delivery', en: 'African Express Delivery', ar: 'توصيل أفريكان إكسبريس' },
      timezone: 'Africa/Accra',
      kycValidatedAt: new Date(),
    },
  });

  // Support
  const support = await prisma.user.upsert({
    where: { email: 'support@tradelink.com' },
    update: {},
    create: {
      email: 'support@tradelink.com',
      phone: '+21650000002',
      passwordHash: hashedPassword,
      role: Role.SUPPORT,
      status: UserStatus.ACTIVE,
      preferredLang: 'FR',
      displayName: { fr: 'Support TradeLink', en: 'TradeLink Support', ar: 'دعم تريد لينك' },
      timezone: 'Africa/Tunis',
    },
  });

  // Comptable
  const accountant = await prisma.user.upsert({
    where: { email: 'finance@tradelink.com' },
    update: {},
    create: {
      email: 'finance@tradelink.com',
      phone: '+21650000003',
      passwordHash: hashedPassword,
      role: Role.ACCOUNTANT,
      status: UserStatus.ACTIVE,
      preferredLang: 'FR',
      displayName: { fr: 'Service Comptabilité', en: 'Accounting Department', ar: 'قسم المحاسبة' },
      timezone: 'Africa/Tunis',
    },
  });

  console.log(`✅ Created ${9} users`);

  // ============================================================
  // 2. KYC RECORDS
  // ============================================================
  console.log('\n📄 Creating KYC records...');

  await prisma.kycRecord.create({
    data: {
      userId: client1.id,
      status: KycStatus.APPROVED,
      submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      reviewedById: admin.id,
      adminNotes: 'Documents conformes, identité vérifiée.',
      documents: {
        create: [
          {
            documentType: 'NATIONAL_ID',
            fileUrl: 'https://storage.tradelink.com/kyc/client1-cin.pdf',
            fileName: 'cin-mohamed-benali.pdf',
            fileSizeBytes: 245678,
            mimeType: 'application/pdf',
            isVerified: true,
            verifiedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  await prisma.kycRecord.create({
    data: {
      userId: client2.id,
      status: KycStatus.APPROVED,
      submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      reviewedById: admin.id,
      adminNotes: 'Tous les documents sont valides.',
      documents: {
        create: [
          {
            documentType: 'NATIONAL_ID',
            fileUrl: 'https://storage.tradelink.com/kyc/client2-passport.pdf',
            fileName: 'passport-fatima-diop.pdf',
            fileSizeBytes: 189234,
            mimeType: 'application/pdf',
            isVerified: true,
            verifiedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  await prisma.kycRecord.create({
    data: {
      userId: supplier1.id,
      status: KycStatus.APPROVED,
      submittedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      reviewedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      reviewedById: admin.id,
      adminNotes: 'Société vérifiée, RNE validé.',
      documents: {
        create: [
          {
            documentType: 'MANAGER_ID',
            fileUrl: 'https://storage.tradelink.com/kyc/supplier1-manager-id.pdf',
            fileName: 'cin-gerant-africanfood.pdf',
            fileSizeBytes: 234567,
            mimeType: 'application/pdf',
            isVerified: true,
            verifiedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
          },
          {
            documentType: 'COMPANY_REGISTRATION',
            fileUrl: 'https://storage.tradelink.com/kyc/supplier1-rne.pdf',
            fileName: 'rne-africanfood.pdf',
            fileSizeBytes: 456789,
            mimeType: 'application/pdf',
            isVerified: true,
            verifiedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  console.log(`✅ Created 3 KYC records`);

  // ============================================================
  // 3. CATÉGORIES
  // ============================================================
  console.log('\n📂 Creating categories...');

  const catFood = await prisma.category.create({
    data: {
      name: { fr: 'Alimentation', en: 'Food & Beverages', ar: 'الأغذية والمشروبات' },
      slug: 'alimentation',
    },
  });

  const catFoodCereals = await prisma.category.create({
    data: {
      name: { fr: 'Céréales et Légumineuses', en: 'Cereals & Legumes', ar: 'الحبوب والبقوليات' },
      slug: 'cereales-legumineuses',
      parentId: catFood.id,
    },
  });

  const catFoodSpices = await prisma.category.create({
    data: {
      name: { fr: 'Épices', en: 'Spices', ar: 'التوابل' },
      slug: 'epices',
      parentId: catFood.id,
    },
  });

  const catElectronics = await prisma.category.create({
    data: {
      name: { fr: 'Électronique', en: 'Electronics', ar: 'الإلكترونيات' },
      slug: 'electronique',
    },
  });

  const catElectronicsPhones = await prisma.category.create({
    data: {
      name: { fr: 'Téléphones et Accessoires', en: 'Phones & Accessories', ar: 'الهواتف والإكسسوارات' },
      slug: 'telephones-accessoires',
      parentId: catElectronics.id,
    },
  });

  const catElectronicsComputers = await prisma.category.create({
    data: {
      name: { fr: 'Informatique', en: 'Computers', ar: 'الحواسيب' },
      slug: 'informatique',
      parentId: catElectronics.id,
    },
  });

  const catTextile = await prisma.category.create({
    data: {
      name: { fr: 'Textile et Vêtements', en: 'Textile & Clothing', ar: 'المنسوجات والملابس' },
      slug: 'textile-vetements',
    },
  });

  console.log(`✅ Created 7 categories`);

  // ============================================================
  // 4. PRODUITS
  // ============================================================
  console.log('\n📦 Creating products...');

  // Produits Alimentaires
  const prodRice = await prisma.product.create({
    data: {
      supplierId: supplier1.id,
      sku: 'FOOD-RICE-001',
      name: { fr: 'Riz Basmati Premium', en: 'Premium Basmati Rice', ar: 'أرز بسمتي فاخر' },
      slug: 'riz-basmati-premium',
      categoryId: catFoodCereals.id,
      priceHT: 2.50,
      taxRate: 0.19,
      stockQuantity: 5000,
      stockAlertLevel: 500,
      unit: 'kg',
      isActive: true,
      isPublic: true,
      images: {
        create: [
          {
            url: 'https://storage.tradelink.com/products/rice-basmati-1.jpg',
            altText: { fr: 'Riz Basmati 1kg', en: 'Basmati Rice 1kg', ar: 'أرز بسمتي 1 كجم' },
            position: 0,
          },
        ],
      },
      translations: {
        create: [
          {
            lang: 'FR',
            description: 'Riz Basmati de qualité supérieure importé d\'Inde. Grains longs et parfumés.',
            specs: 'Origine: Inde | Conditionnement: Sacs de 25kg | Conservation: Lieu sec',
          },
          {
            lang: 'EN',
            description: 'Premium Basmati rice imported from India. Long and fragrant grains.',
            specs: 'Origin: India | Packaging: 25kg bags | Storage: Dry place',
          },
        ],
      },
    },
  });

  const prodLentils = await prisma.product.create({
    data: {
      supplierId: supplier1.id,
      sku: 'FOOD-LENTILS-001',
      name: { fr: 'Lentilles Corail Bio', en: 'Organic Red Lentils', ar: 'عدس أحمر عضوي' },
      slug: 'lentilles-corail-bio',
      categoryId: catFoodCereals.id,
      priceHT: 3.20,
      taxRate: 0.19,
      stockQuantity: 2000,
      stockAlertLevel: 200,
      unit: 'kg',
      isActive: true,
      isPublic: true,
      translations: {
        create: [
          {
            lang: 'FR',
            description: 'Lentilles corail biologiques, idéales pour soupes et plats orientaux.',
            specs: 'Origine: Turquie | Label: Agriculture Biologique | Protéines: 25g/100g',
          },
        ],
      },
    },
  });

  const prodCumin = await prisma.product.create({
    data: {
      supplierId: supplier1.id,
      sku: 'FOOD-SPICE-CUMIN-001',
      name: { fr: 'Cumin Moulu', en: 'Ground Cumin', ar: 'كمون مطحون' },
      slug: 'cumin-moulu',
      categoryId: catFoodSpices.id,
      priceHT: 12.00,
      taxRate: 0.19,
      stockQuantity: 500,
      stockAlertLevel: 50,
      unit: 'kg',
      isActive: true,
      isPublic: true,
    },
  });

  // Produits Électroniques
  const prodPhone = await prisma.product.create({
    data: {
      supplierId: supplier2.id,
      sku: 'ELEC-PHONE-SAMSUNG-A54',
      name: { fr: 'Samsung Galaxy A54 5G', en: 'Samsung Galaxy A54 5G', ar: 'سامسونج جالاكسي A54 5G' },
      slug: 'samsung-galaxy-a54-5g',
      categoryId: catElectronicsPhones.id,
      priceHT: 320.00,
      taxRate: 0.19,
      stockQuantity: 150,
      stockAlertLevel: 20,
      unit: 'pièce',
      isActive: true,
      isPublic: true,
      images: {
        create: [
          {
            url: 'https://storage.tradelink.com/products/samsung-a54-black.jpg',
            altText: { fr: 'Samsung A54 Noir', en: 'Samsung A54 Black', ar: 'سامسونج A54 أسود' },
            position: 0,
          },
        ],
      },
      translations: {
        create: [
          {
            lang: 'FR',
            description: 'Smartphone 5G avec écran AMOLED 120Hz, batterie 5000mAh.',
            specs: 'Écran: 6.4" FHD+ | RAM: 8GB | Stockage: 256GB | Appareil photo: 50MP',
          },
          {
            lang: 'EN',
            description: '5G Smartphone with 120Hz AMOLED display, 5000mAh battery.',
            specs: 'Display: 6.4" FHD+ | RAM: 8GB | Storage: 256GB | Camera: 50MP',
          },
        ],
      },
      variants: {
        create: [
          {
            name: { fr: 'Noir 128GB', en: 'Black 128GB', ar: 'أسود 128 جيجا' },
            sku: 'ELEC-PHONE-SAMSUNG-A54-BLK-128',
            priceHT: 320.00,
            stockQuantity: 80,
          },
          {
            name: { fr: 'Violet 256GB', en: 'Purple 256GB', ar: 'بنفسجي 256 جيجا' },
            sku: 'ELEC-PHONE-SAMSUNG-A54-PUR-256',
            priceHT: 350.00,
            stockQuantity: 70,
          },
        ],
      },
    },
  });

  const prodLaptop = await prisma.product.create({
    data: {
      supplierId: supplier2.id,
      sku: 'ELEC-LAPTOP-HP-PROBOOK',
      name: { fr: 'HP ProBook 450 G9', en: 'HP ProBook 450 G9', ar: 'HP ProBook 450 G9' },
      slug: 'hp-probook-450-g9',
      categoryId: catElectronicsComputers.id,
      priceHT: 650.00,
      taxRate: 0.19,
      stockQuantity: 50,
      stockAlertLevel: 10,
      unit: 'pièce',
      isActive: true,
      isPublic: true,
      translations: {
        create: [
          {
            lang: 'FR',
            description: 'Ordinateur portable professionnel Intel Core i5, 16GB RAM, SSD 512GB.',
            specs: 'Processeur: Intel Core i5-1235U | RAM: 16GB DDR4 | Écran: 15.6" FHD',
          },
        ],
      },
    },
  });

  console.log(`✅ Created 5 products with variants and images`);

  // ============================================================
  // 5. COMMANDES
  // ============================================================
  console.log('\n🛒 Creating orders...');

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'CMD-2026-00001',
      clientId: client1.id,
      supplierId: supplier1.id,
      status: OrderStatus.DELIVERED,
      isQuote: false,
      totalHT: 1250.00,
      totalTax: 237.50,
      totalTTC: 1487.50,
      currency: 'TND',
      deliveryAddress: {
        street: '15 Avenue Habib Bourguiba',
        city: 'Tunis',
        postalCode: '1001',
        country: 'Tunisie',
      },
      clientNotes: 'Livraison avant 17h si possible',
      confirmedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodRice.id,
            quantity: 500,
            unitPriceHT: 2.50,
            taxRate: 0.19,
            totalHT: 1250.00,
            totalTTC: 1487.50,
            productNameSnapshot: prodRice.name,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'CMD-2026-00002',
      clientId: client2.id,
      supplierId: supplier2.id,
      status: OrderStatus.SHIPPED,
      isQuote: false,
      totalHT: 1920.00,
      totalTax: 364.80,
      totalTTC: 2284.80,
      currency: 'XOF',
      deliveryAddress: {
        street: 'Route de Ouakam, Immeuble Ndiaye',
        city: 'Dakar',
        postalCode: '12500',
        country: 'Sénégal',
      },
      confirmedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodPhone.id,
            quantity: 6,
            unitPriceHT: 320.00,
            taxRate: 0.19,
            totalHT: 1920.00,
            totalTTC: 2284.80,
            productNameSnapshot: prodPhone.name,
          },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      orderNumber: 'CMD-2026-00003',
      clientId: client1.id,
      supplierId: supplier2.id,
      status: OrderStatus.CONFIRMED,
      isQuote: false,
      totalHT: 2600.00,
      totalTax: 494.00,
      totalTTC: 3094.00,
      currency: 'TND',
      deliveryAddress: {
        street: '15 Avenue Habib Bourguiba',
        city: 'Tunis',
        postalCode: '1001',
        country: 'Tunisie',
      },
      confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          {
            productId: prodLaptop.id,
            quantity: 4,
            unitPriceHT: 650.00,
            taxRate: 0.19,
            totalHT: 2600.00,
            totalTTC: 3094.00,
            productNameSnapshot: prodLaptop.name,
          },
        ],
      },
    },
  });

  // Devis (Quote)
  const quote1 = await prisma.order.create({
    data: {
      orderNumber: 'DEVIS-2026-00001',
      clientId: client2.id,
      supplierId: supplier1.id,
      status: OrderStatus.PENDING,
      isQuote: true,
      totalHT: 6400.00,
      totalTax: 1216.00,
      totalTTC: 7616.00,
      currency: 'XOF',
      deliveryAddress: {
        street: 'Route de Ouakam',
        city: 'Dakar',
        postalCode: '12500',
        country: 'Sénégal',
      },
      items: {
        create: [
          {
            productId: prodRice.id,
            quantity: 2000,
            unitPriceHT: 2.50,
            taxRate: 0.19,
            totalHT: 5000.00,
            totalTTC: 5950.00,
            productNameSnapshot: prodRice.name,
          },
          {
            productId: prodLentils.id,
            quantity: 500,
            unitPriceHT: 3.20,
            taxRate: 0.19,
            totalHT: 1600.00,
            totalTTC: 1904.00,
            productNameSnapshot: prodLentils.name,
          },
        ],
      },
    },
  });

  console.log(`✅ Created 4 orders (3 orders + 1 quote)`);

  // ============================================================
  // 6. FACTURES
  // ============================================================
  console.log('\n💰 Creating invoices...');

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-2026-00001',
      orderId: order1.id,
      status: InvoiceStatus.PAID,
      issuedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      totalHT: 1250.00,
      totalTax: 237.50,
      totalTTC: 1487.50,
      currency: 'TND',
      pdfUrl: 'https://storage.tradelink.com/invoices/FAC-2026-00001.pdf',
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-2026-00002',
      orderId: order2.id,
      status: InvoiceStatus.SENT,
      issuedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      totalHT: 1920.00,
      totalTax: 364.80,
      totalTTC: 2284.80,
      currency: 'XOF',
      pdfUrl: 'https://storage.tradelink.com/invoices/FAC-2026-00002.pdf',
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'FAC-2026-00003',
      orderId: order3.id,
      status: InvoiceStatus.DRAFT,
      totalHT: 2600.00,
      totalTax: 494.00,
      totalTTC: 3094.00,
      currency: 'TND',
    },
  });

  console.log(`✅ Created 3 invoices`);

  // ============================================================
  // 7. PAIEMENTS
  // ============================================================
  console.log('\n💳 Creating payments...');

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      orderId: order1.id,
      provider: 'STRIPE',
      stripePaymentIntentId: 'pi_3MockStripePaymentIntent123',
      amount: 1487.50,
      currency: 'TND',
      status: PaymentStatus.SUCCEEDED,
      paidAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      metadata: {
        clientEmail: client1.email,
        clientPhone: client1.phone,
      },
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      orderId: order2.id,
      provider: 'FEDAPAY',
      externalPaymentId: 'fedapay_tx_mock123456',
      amount: 2284.80,
      currency: 'XOF',
      status: PaymentStatus.PENDING,
      metadata: {
        clientEmail: client2.email,
        clientPhone: client2.phone,
      },
    },
  });

  console.log(`✅ Created 2 payments`);

  // ============================================================
  // 8. EXPÉDITIONS
  // ============================================================
  console.log('\n🚚 Creating shipments...');

  const shipment1 = await prisma.shipment.create({
    data: {
      shipmentNumber: 'EXP-2026-00001',
      orderId: order1.id,
      transporterId: transporter1.id,
      status: ShipmentStatus.DELIVERED,
      estimatedDelivery: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      deliveredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      pickupAddress: {
        street: 'Zone Industrielle de Ben Arous',
        city: 'Ben Arous',
        postalCode: '2013',
        country: 'Tunisie',
      },
      deliveryAddress: {
        street: '15 Avenue Habib Bourguiba',
        city: 'Tunis',
        postalCode: '1001',
        country: 'Tunisie',
      },
      vehiclePlate: '123 TU 4567',
      vehicleType: 'Camion 3.5T',
      events: {
        create: [
          {
            status: ShipmentStatus.ASSIGNED,
            location: 'Ben Arous',
            notes: 'Mission assignée au transporteur',
            timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          },
          {
            status: ShipmentStatus.PICKED_UP,
            location: 'Ben Arous - Entrepôt African Food',
            notes: 'Marchandise enlevée',
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
          {
            status: ShipmentStatus.IN_TRANSIT,
            location: 'Route Tunis',
            notes: 'En route vers Tunis',
            timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
          },
          {
            status: ShipmentStatus.DELIVERED,
            location: 'Tunis - Avenue Habib Bourguiba',
            notes: 'Livraison effectuée, signature client obtenue',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          },
        ],
      },
      proofOfDelivery: {
        create: {
          photoUrls: [
            'https://storage.tradelink.com/pod/exp-00001-photo1.jpg',
            'https://storage.tradelink.com/pod/exp-00001-photo2.jpg',
          ],
          signatureUrl: 'https://storage.tradelink.com/pod/exp-00001-signature.png',
          receiverName: 'M. Mohamed Ben Ali',
          notes: 'Livraison conforme, cartons en bon état',
          capturedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const shipment2 = await prisma.shipment.create({
    data: {
      shipmentNumber: 'EXP-2026-00002',
      orderId: order2.id,
      transporterId: transporter2.id,
      status: ShipmentStatus.IN_TRANSIT,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      pickupAddress: {
        street: 'Zone Franche Industrielle',
        city: 'Abidjan',
        postalCode: '01 BP 234',
        country: 'Côte d\'Ivoire',
      },
      deliveryAddress: {
        street: 'Route de Ouakam, Immeuble Ndiaye',
        city: 'Dakar',
        postalCode: '12500',
        country: 'Sénégal',
      },
      vehiclePlate: 'CI-AB-1234',
      vehicleType: 'Camion Frigorifique',
      events: {
        create: [
          {
            status: ShipmentStatus.ASSIGNED,
            location: 'Abidjan',
            notes: 'Mission acceptée',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            status: ShipmentStatus.PICKED_UP,
            location: 'Abidjan - Zone Franche',
            notes: 'Colis récupéré',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
          {
            status: ShipmentStatus.IN_TRANSIT,
            location: 'Frontière Côte d\'Ivoire - Guinée',
            notes: 'Passage frontière en cours',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  console.log(`✅ Created 2 shipments with tracking events`);

  // ============================================================
  // 9. TICKETS SUPPORT
  // ============================================================
  console.log('\n🎫 Creating support tickets...');

  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00001',
      createdById: client1.id,
      assignedToId: support.id,
      subject: 'Question sur la facturation',
      status: 'RESOLVED',
      priority: 'MEDIUM',
      category: 'BILLING',
      contextType: 'INVOICE',
      contextId: invoice1.id,
      resolvedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      messages: {
        create: [
          {
            senderId: client1.id,
            message: 'Bonjour, j\'ai une question concernant la facture FAC-2026-00001. Le montant de la TVA semble incorrect.',
            sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          {
            senderId: support.id,
            message: 'Bonjour M. Ben Ali, merci pour votre message. J\'ai vérifié la facture et le calcul de la TVA à 19% est correct : 1250 TND HT + 237.50 TND TVA = 1487.50 TND TTC.',
            isAiSuggestion: false,
            sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
          {
            senderId: client1.id,
            message: 'Merci pour la clarification ! Tout est clair maintenant.',
            sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00002',
      createdById: client2.id,
      assignedToId: support.id,
      subject: 'Suivi de livraison',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      category: 'LOGISTICS',
      contextType: 'SHIPMENT',
      contextId: shipment2.id,
      messages: {
        create: [
          {
            senderId: client2.id,
            message: 'Bonjour, pouvez-vous me donner un update sur ma livraison EXP-2026-00002 ? Elle devait arriver hier.',
            sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            senderId: support.id,
            message: 'Bonjour Mme Diop, je vérifie immédiatement avec le transporteur. Votre colis est actuellement à la frontière et devrait arriver dans les 48h.',
            sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2026-00003',
      createdById: client3.id,
      subject: 'Problème de connexion',
      status: 'OPEN',
      priority: 'LOW',
      category: 'TECHNICAL',
      messages: {
        create: [
          {
            senderId: client3.id,
            message: 'Je n\'arrive pas à me connecter avec mon nouveau mot de passe.',
            sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  console.log(`✅ Created 3 support tickets`);

  // ============================================================
  // 10. NOTIFICATIONS
  // ============================================================
  console.log('\n🔔 Creating notifications...');

  await prisma.notification.create({
    data: {
      userId: client1.id,
      title: { fr: 'Commande livrée', en: 'Order delivered', ar: 'تم تسليم الطلب' },
      body: { fr: 'Votre commande CMD-2026-00001 a été livrée avec succès !', en: 'Your order CMD-2026-00001 has been delivered!', ar: 'تم تسليم طلبك CMD-2026-00001 بنجاح!' },
      channel: 'IN_APP',
      status: 'READ',
      actionUrl: '/orders/CMD-2026-00001',
      contextType: 'ORDER',
      contextId: order1.id,
      isRead: true,
      readAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      sentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notification.create({
    data: {
      userId: client2.id,
      title: { fr: 'Facture disponible', en: 'Invoice available', ar: 'الفاتورة متاحة' },
      body: { fr: 'Votre facture FAC-2026-00002 est disponible', en: 'Your invoice FAC-2026-00002 is available', ar: 'فاتورتك FAC-2026-00002 متاحة' },
      channel: 'EMAIL',
      status: 'SENT',
      actionUrl: '/invoices/FAC-2026-00002',
      contextType: 'INVOICE',
      contextId: invoice2.id,
      isRead: false,
      sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notification.create({
    data: {
      userId: client3.id,
      title: { fr: 'Rappel KYC', en: 'KYC reminder', ar: 'تذكير KYC' },
      body: { fr: 'Il vous reste 5 jours pour soumettre vos documents KYC', en: 'You have 5 days left to submit your KYC documents', ar: 'لديك 5 أيام لتقديم وثائق KYC' },
      channel: 'SMS',
      status: 'SENT',
      actionUrl: '/kyc',
      isRead: false,
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Created 3 notifications`);

  // ============================================================
  // 11. BOUTONS FLOTTANTS
  // ============================================================
  console.log('\n🎛️ Creating floating buttons...');

  await prisma.floatingButton.create({
    data: {
      title: { fr: 'Calculatrice', en: 'Calculator', ar: 'آلة حاسبة' },
      icon: 'calculator',
      color: '#1D4ED8',
      targetUrl: '/accounting/calculator',
      targetRole: 'ALL',
      isActive: true,
      positionOrder: 0,
    },
  });

  await prisma.floatingButton.create({
    data: {
      title: { fr: 'Support', en: 'Support', ar: 'الدعم' },
      icon: 'headset',
      color: '#10B981',
      targetUrl: '/tickets',
      targetRole: 'ALL',
      isActive: true,
      positionOrder: 1,
    },
  });

  await prisma.floatingButton.create({
    data: {
      title: { fr: 'Admin Dashboard', en: 'Admin Dashboard', ar: 'لوحة الإدارة' },
      icon: 'shield',
      color: '#EF4444',
      targetUrl: '/admin/dashboard',
      targetRole: 'ADMIN',
      isActive: true,
      positionOrder: 2,
    },
  });

  console.log(`✅ Created 3 floating buttons`);

  // ============================================================
  // 12. RÈGLES DE CALCUL COMPTABLE
  // ============================================================
  console.log('\n🧮 Creating calculation rules...');

  const rule1 = await prisma.calculationRule.create({
    data: {
      name: { fr: 'Intérêts simples', en: 'Simple interest', ar: 'فائدة بسيطة' },
      description: { fr: 'Calcul d\'intérêts simples sur une période donnée', en: 'Simple interest calculation over a period', ar: 'حساب الفائدة البسيطة على فترة' },
      baseDays: 365,
      formula: 'amount * (rate/100) * (days/baseDays)',
      isActive: true,
    },
  });

  const rule2 = await prisma.calculationRule.create({
    data: {
      name: { fr: 'Escompte commercial', en: 'Trade discount', ar: 'خصم تجاري' },
      description: { fr: 'Calcul d\'escompte pour paiement anticipé', en: 'Discount calculation for early payment', ar: 'حساب الخصم للدفع المبكر' },
      baseDays: 365,
      formula: 'amount * (rate/100) * (days/baseDays)',
      isActive: true,
    },
  });

  console.log(`✅ Created 2 calculation rules`);

  // ============================================================
  // 13. AUDIT LOGS
  // ============================================================
  console.log('\n📋 Creating audit logs...');

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'KYC_APPROVED',
      targetType: 'USER',
      targetId: client1.id,
      metadata: {
        userName: 'Mohamed Ben Ali',
        kycRecordId: 'xxx',
        decision: 'APPROVED',
        notes: 'Documents conformes',
      },
      ipAddress: '41.230.xxx.xxx',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: client1.id,
      action: 'LOGIN',
      targetType: 'USER',
      targetId: client1.id,
      metadata: {
        device: 'Desktop',
        browser: 'Chrome',
      },
      ipAddress: '41.230.xxx.xxx',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'CREATE',
      targetType: 'PRODUCT',
      targetId: prodPhone.id,
      metadata: {
        productSku: 'ELEC-PHONE-SAMSUNG-A54',
        productName: 'Samsung Galaxy A54 5G',
        price: 320.00,
      },
      ipAddress: '41.230.xxx.xxx',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    },
  });

  console.log(`✅ Created 3 audit logs`);

  // ============================================================
  // 14. CONFIGURATION SYSTÈME
  // ============================================================
  console.log('\n⚙️ Creating system configs...');

  await prisma.systemConfig.create({
    data: {
      key: 'kyc_deadline_days',
      value: '7',
      description: 'Nombre de jours pour soumettre le KYC après inscription',
      isSecret: false,
      updatedById: admin.id,
    },
  });

  await prisma.systemConfig.create({
    data: {
      key: 'default_currency',
      value: 'TND',
      description: 'Devise par défaut de la plateforme',
      isSecret: false,
      updatedById: admin.id,
    },
  });

  await prisma.systemConfig.create({
    data: {
      key: 'smtp_host',
      value: 'smtp-relay.brevo.com',
      description: 'Serveur SMTP pour les emails',
      isSecret: false,
      updatedById: admin.id,
    },
  });

  await prisma.systemConfig.create({
    data: {
      key: 'stripe_webhook_secret',
      value: 'replace-with-a-webhook-secret',
      description: 'Secret webhook Stripe',
      isSecret: true,
      updatedById: admin.id,
    },
  });

  console.log(`✅ Created 4 system configs`);

  // ============================================================
  // RÉSUMÉ
  // ============================================================
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🎉 SEEDING TERMINÉ AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Données créées :');
  console.log('   ✅ 9 utilisateurs (Admin, Clients, Fournisseurs, Transporteurs, Support, Comptable)');
  console.log('   ✅ 3 dossiers KYC avec documents');
  console.log('   ✅ 7 catégories de produits');
  console.log('   ✅ 5 produits avec images, traductions et variantes');
  console.log('   ✅ 4 commandes (3 commandes + 1 devis)');
  console.log('   ✅ 3 factures (1 payée, 1 envoyée, 1 brouillon)');
  console.log('   ✅ 2 paiements (Stripe, FedaPay)');
  console.log('   ✅ 2 expéditions avec tracking complet');
  console.log('   ✅ 3 tickets support avec messages');
  console.log('   ✅ 3 notifications multicanaux');
  console.log('   ✅ 3 boutons flottants');
  console.log('   ✅ 2 règles de calcul comptable');
  console.log('   ✅ 3 logs d\'audit');
  console.log('   ✅ 4 configurations système');
  console.log('');
  console.log('🔐 Seed account passwords use the local SEED_USER_PASSWORD value.');
  console.log('');
  console.log('🌐 Langues : FR, EN, AR (toutes les données multilingues)');
  console.log('💰 Devises : TND, XOF, EGP');
  console.log('');
  console.log('🚀 Backend prêt pour les tests et le développement frontend !');
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Erreur de seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
