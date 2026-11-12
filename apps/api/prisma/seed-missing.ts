import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Ajout des données manquantes importantes...\n');

  // Récupérer les IDs nécessaires
  const admin = await prisma.user.findUnique({ where: { email: 'admin@tradelink.com' } });
  const client1 = await prisma.user.findUnique({ where: { email: 'mohamed.ben.ali@gmail.com' } });
  const client2 = await prisma.user.findUnique({ where: { email: 'fatima.diop@outlook.com' } });
  const supplier1 = await prisma.user.findUnique({ where: { email: 'contact@africanfood.tn' } });
  const supplier2 = await prisma.user.findUnique({ where: { email: 'sales@techafrique.com' } });
  
  const calculationRules = await prisma.calculationRule.findMany();
  const order1 = await prisma.order.findUnique({ where: { orderNumber: 'CMD-2026-00001' } });
  const order2 = await prisma.order.findUnique({ where: { orderNumber: 'CMD-2026-00002' } });
  const invoice1 = await prisma.invoice.findUnique({ where: { invoiceNumber: 'FAC-2026-00001' } });
  const invoice2 = await prisma.invoice.findUnique({ where: { invoiceNumber: 'FAC-2026-00002' } });
  const payment1 = await prisma.payment.findFirst({ where: { invoiceId: invoice1?.id } });

  // ============================================================
  // 1. CONFIGURATION IA ASSISTANT
  // ============================================================
  console.log('🤖 Configuration IA Assistant...');

  const aiConfig = await prisma.aiAssistantConfig.upsert({
    where: { id: 'default-config' },
    update: {},
    create: {
      id: 'default-config',
      systemPromptFr: `Tu es l'Assistant TradeLink, un assistant IA interne intégré à la plateforme TradeLink.

CONTEXTE :
- Tu as accès aux données réelles de l'utilisateur connecté
- Tu connais ses commandes, factures, produits, expéditions
- Tu peux naviguer dans l'interface et effectuer des actions
- Tu ne réponds QUE sur des informations présentes dans TradeLink

CAPACITÉS :
1. Navigation : Ouvrir des pages spécifiques de l'application
2. Recherche : Trouver des commandes, factures, produits dans SES données
3. Calculs : Effectuer des calculs comptables avec le moteur intégré
4. Résumés : Synthétiser ses commandes en cours, factures impayées
5. Actions : Créer des tickets, lancer des rooms, générer des documents

LIMITES STRICTES :
❌ NE RÉPONDS JAMAIS à des questions hors TradeLink
❌ NE DONNE PAS d'informations générales externes
❌ NE DONNE PAS de conseils business généraux
✅ UNIQUEMENT les données et actions dans l'application

STYLE :
- Professionnel et concis
- Utilise les données réelles de l'utilisateur
- Propose des actions concrètes dans l'interface
- Réponds dans la langue de l'utilisateur`,

      systemPromptEn: `You are TradeLink Assistant, an internal AI assistant integrated into the TradeLink platform.

CONTEXT:
- You have access to the logged-in user's real data
- You know their orders, invoices, products, shipments
- You can navigate the interface and perform actions
- You ONLY respond about information present in TradeLink

CAPABILITIES:
1. Navigation: Open specific application pages
2. Search: Find orders, invoices, products in THEIR data
3. Calculations: Perform accounting calculations with the integrated engine
4. Summaries: Synthesize their ongoing orders, unpaid invoices
5. Actions: Create tickets, start rooms, generate documents

STRICT LIMITS:
❌ NEVER answer questions outside TradeLink
❌ DO NOT give general external information
❌ DO NOT give general business advice
✅ ONLY data and actions within the application

STYLE:
- Professional and concise
- Use the user's real data
- Suggest concrete actions in the interface
- Respond in the user's language`,

      systemPromptAr: `أنت مساعد TradeLink، مساعد ذكاء اصطناعي داخلي متكامل في منصة TradeLink.

السياق:
- لديك وصول إلى البيانات الحقيقية للمستخدم المتصل
- تعرف طلباته وفواتيره ومنتجاته وشحناته
- يمكنك التنقل في الواجهة وتنفيذ الإجراءات
- ترد فقط على المعلومات الموجودة في TradeLink

القدرات:
1. التنقل: فتح صفحات محددة في التطبيق
2. البحث: العثور على الطلبات والفواتير والمنتجات في بياناته
3. الحسابات: إجراء حسابات محاسبية بالمحرك المتكامل
4. الملخصات: تلخيص طلباته الجارية وفواتيره غير المدفوعة
5. الإجراءات: إنشاء تذاكر وبدء اجتماعات وإنشاء مستندات

القيود الصارمة:
❌ لا ترد أبداً على أسئلة خارج TradeLink
❌ لا تعطي معلومات عامة خارجية
❌ لا تعطي نصائح تجارية عامة
✅ فقط البيانات والإجراءات داخل التطبيق

الأسلوب:
- محترف وموجز
- استخدم بيانات المستخدم الحقيقية
- اقترح إجراءات ملموسة في الواجهة
- أجب بلغة المستخدم`,

      modelName: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 1024,
      sttProvider: 'openai-whisper',
      ttsProvider: 'openai-tts',
      ttsVoice: 'alloy',
      isActive: true,
    },
  });

  console.log('✅ Configuration IA créée');

  // ============================================================
  // 2. PÉRIODES DE CALCUL COMPTABLE
  // ============================================================
  console.log('\n🧮 Périodes de calcul...');

  if (calculationRules.length > 0) {
    // Calcul 1 : Intérêts simples sur 1 an
    await prisma.calculationPeriod.create({
      data: {
        ruleId: calculationRules[0].id,
        userId: client1!.id,
        amount: 10000.00,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        days: 365,
        rate: 5.5,
        result: 550.00,
        detail: {
          formula: 'amount * (rate/100) * (days/baseDays)',
          calculation: '10000 * (5.5/100) * (365/365) = 550.00',
          montantInitial: 10000,
          taux: 5.5,
          duree: 365,
          resultat: 550,
        },
      },
    });

    // Calcul 2 : Escompte sur 90 jours
    await prisma.calculationPeriod.create({
      data: {
        ruleId: calculationRules[1]?.id || calculationRules[0].id,
        userId: client2!.id,
        amount: 5000.00,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-30'),
        days: 90,
        rate: 3.0,
        result: 36.99,
        detail: {
          formula: 'amount * (rate/100) * (days/baseDays)',
          calculation: '5000 * (3.0/100) * (90/365) = 36.99',
          montantInitial: 5000,
          taux: 3.0,
          duree: 90,
          resultat: 36.99,
        },
      },
    });

    // Calcul 3 : Intérêts sur 6 mois
    await prisma.calculationPeriod.create({
      data: {
        ruleId: calculationRules[0].id,
        userId: client1!.id,
        amount: 25000.00,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-07-01'),
        days: 182,
        rate: 4.5,
        result: 561.99,
        detail: {
          formula: 'amount * (rate/100) * (days/baseDays)',
          calculation: '25000 * (4.5/100) * (182/365) = 561.99',
          montantInitial: 25000,
          taux: 4.5,
          duree: 182,
          resultat: 561.99,
        },
      },
    });

    console.log('✅ 3 périodes de calcul créées');
  }

  // ============================================================
  // 3. ÉCRITURES COMPTABLES
  // ============================================================
  console.log('\n💼 Écritures comptables...');

  if (payment1 && invoice1) {
    // Écriture 1 : Paiement facture FAC-2026-00001
    await prisma.accountingEntry.create({
      data: {
        entryNumber: 'JRN-2026-00001',
        label: `Paiement facture ${invoice1.invoiceNumber} - Client Mohamed Ben Ali`,
        debitAccount: '512', // Banque
        creditAccount: '411', // Clients
        amount: 1487.50,
        currency: 'TND',
        referenceType: 'PAYMENT',
        referenceId: payment1.id,
        entryDate: payment1.paidAt || new Date(),
      },
    });

    // Écriture 2 : Vente CMD-2026-00001
    await prisma.accountingEntry.create({
      data: {
        entryNumber: 'JRN-2026-00002',
        label: `Vente marchandises - Commande ${order1?.orderNumber}`,
        debitAccount: '411', // Clients
        creditAccount: '701', // Ventes de marchandises
        amount: 1250.00,
        currency: 'TND',
        referenceType: 'INVOICE',
        referenceId: invoice1.id,
        entryDate: invoice1.issuedAt || new Date(),
      },
    });

    // Écriture 3 : TVA collectée
    await prisma.accountingEntry.create({
      data: {
        entryNumber: 'JRN-2026-00003',
        label: `TVA collectée - Facture ${invoice1.invoiceNumber}`,
        debitAccount: '411', // Clients
        creditAccount: '4457', // TVA collectée
        amount: 237.50,
        currency: 'TND',
        referenceType: 'INVOICE',
        referenceId: invoice1.id,
        entryDate: invoice1.issuedAt || new Date(),
      },
    });

    console.log('✅ 3 écritures comptables créées');
  }

  // ============================================================
  // 4. DOCUMENTS GÉNÉRÉS
  // ============================================================
  console.log('\n📄 Documents générés...');

  if (invoice1) {
    // Document 1 : Facture FAC-2026-00001
    await prisma.generatedDocument.create({
      data: {
        documentType: 'INVOICE',
        referenceType: 'INVOICE',
        referenceId: invoice1.id,
        generatedById: admin!.id,
        title: {
          fr: `Facture ${invoice1.invoiceNumber}`,
          en: `Invoice ${invoice1.invoiceNumber}`,
          ar: `فاتورة ${invoice1.invoiceNumber}`,
        },
        fileUrl: `https://storage.tradelink.com/invoices/${invoice1.invoiceNumber}.pdf`,
        fileName: `${invoice1.invoiceNumber}.pdf`,
        fileSizeBytes: 234567,
        mimeType: 'application/pdf',
      },
    });
  }

  if (invoice2) {
    // Document 2 : Facture FAC-2026-00002
    await prisma.generatedDocument.create({
      data: {
        documentType: 'INVOICE',
        referenceType: 'INVOICE',
        referenceId: invoice2.id,
        generatedById: admin!.id,
        title: {
          fr: `Facture ${invoice2.invoiceNumber}`,
          en: `Invoice ${invoice2.invoiceNumber}`,
          ar: `فاتورة ${invoice2.invoiceNumber}`,
        },
        fileUrl: `https://storage.tradelink.com/invoices/${invoice2.invoiceNumber}.pdf`,
        fileName: `${invoice2.invoiceNumber}.pdf`,
        fileSizeBytes: 189432,
        mimeType: 'application/pdf',
      },
    });
  }

  if (order1) {
    // Document 3 : Bon de livraison
    await prisma.generatedDocument.create({
      data: {
        documentType: 'DELIVERY_NOTE',
        referenceType: 'ORDER',
        referenceId: order1.id,
        generatedById: admin!.id,
        title: {
          fr: `Bon de livraison - ${order1.orderNumber}`,
          en: `Delivery Note - ${order1.orderNumber}`,
          ar: `سند التسليم - ${order1.orderNumber}`,
        },
        fileUrl: `https://storage.tradelink.com/delivery-notes/BL-${order1.orderNumber}.pdf`,
        fileName: `BL-${order1.orderNumber}.pdf`,
        fileSizeBytes: 145678,
        mimeType: 'application/pdf',
      },
    });

    // Document 4 : Bon de préparation
    await prisma.generatedDocument.create({
      data: {
        documentType: 'PREPARATION_NOTE',
        referenceType: 'ORDER',
        referenceId: order1.id,
        generatedById: supplier1!.id,
        title: {
          fr: `Bon de préparation - ${order1.orderNumber}`,
          en: `Preparation Note - ${order1.orderNumber}`,
          ar: `سند التحضير - ${order1.orderNumber}`,
        },
        fileUrl: `https://storage.tradelink.com/prep-notes/BP-${order1.orderNumber}.pdf`,
        fileName: `BP-${order1.orderNumber}.pdf`,
        fileSizeBytes: 123456,
        mimeType: 'application/pdf',
      },
    });
  }

  console.log('✅ 4 documents générés créés');

  // ============================================================
  // 5. LOGS COMMANDES VOCALES IA
  // ============================================================
  console.log('\n🎙️ Logs commandes vocales...');

  // Log 1 : Recherche de commandes
  await prisma.voiceCommandLog.create({
    data: {
      userId: client1!.id,
      inputType: 'TEXT',
      commandText: 'Affiche mes commandes en cours',
      detectedIntent: 'SEARCH_ORDERS',
      intentParams: {
        status: ['CONFIRMED', 'SHIPPED'],
        userId: client1!.id,
      },
      actionTriggered: 'NAVIGATE_MODULE',
      responseText: 'Vous avez 2 commandes en cours : CMD-2026-00002 (expédiée) et CMD-2026-00003 (confirmée).',
      lang: 'FR',
      processingMs: 245,
      isSuccess: true,
    },
  });

  // Log 2 : Calcul rapide
  await prisma.voiceCommandLog.create({
    data: {
      userId: client2!.id,
      inputType: 'VOICE',
      commandText: 'Calcule les intérêts sur 5000 euros pendant 6 mois à 4%',
      detectedIntent: 'CALCULATE',
      intentParams: {
        amount: 5000,
        duration: 6,
        unit: 'months',
        rate: 4,
      },
      actionTriggered: 'CALCULATE',
      responseText: 'Les intérêts sont de 100 euros (calcul : 5000 × 4% × 6/12).',
      lang: 'FR',
      processingMs: 512,
      isSuccess: true,
    },
  });

  // Log 3 : Navigation
  await prisma.voiceCommandLog.create({
    data: {
      userId: client1!.id,
      inputType: 'TEXT',
      commandText: 'Ouvre mes factures',
      detectedIntent: 'NAVIGATE_MODULE',
      intentParams: {
        module: '/invoices',
      },
      actionTriggered: 'NAVIGATE',
      responseText: 'Navigation vers la page Factures.',
      lang: 'FR',
      processingMs: 156,
      isSuccess: true,
    },
  });

  // Log 4 : Erreur de compréhension
  await prisma.voiceCommandLog.create({
    data: {
      userId: client2!.id,
      inputType: 'TEXT',
      commandText: 'blablabla test 123',
      detectedIntent: null,
      intentParams: null,
      actionTriggered: null,
      responseText: null,
      lang: 'FR',
      processingMs: 89,
      isSuccess: false,
      errorMessage: 'Intention non reconnue',
    },
  });

  console.log('✅ 4 logs de commandes vocales créés');

  // ============================================================
  // 6. ROOM LIVE (Visioconférence)
  // ============================================================
  console.log('\n🎥 Room Live...');

  if (order1 && client1 && supplier1) {
    // Room 1 : Réunion terminée
    const room1 = await prisma.room.create({
      data: {
        roomCode: 'TL-CMD001',
        title: `Discussion Commande ${order1.orderNumber}`,
        type: 'INSTANT',
        status: 'ENDED',
        hostId: client1.id,
        contextType: 'ORDER',
        contextId: order1.id,
        waitingRoomEnabled: false,
        recordingEnabled: true,
        maxParticipants: 10,
        scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
        endedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000),
        recordingUrl: `https://storage.tradelink.com/recordings/room-${order1.orderNumber}.mp4`,
        transcriptText: `Client: Bonjour, merci d'avoir rejoint cette réunion pour discuter de la commande ${order1.orderNumber}.

Fournisseur: Bonjour ! Je suis ravi de pouvoir échanger avec vous.

Client: J'aimerais confirmer les délais de livraison et la qualité des produits.

Fournisseur: Bien sûr. Les 500kg de riz Basmati seront livrés sous 5 jours ouvrables. Nous garantissons la qualité premium, origine Inde.

Client: Parfait. Et le prix reste celui convenu ?

Fournisseur: Oui, 2.50 TND/kg HT, soit 1,250 TND HT au total.

Client: Excellent. Je valide la commande.`,
        aiSummary: {
          participants: ['Mohamed Ben Ali (Client)', 'African Food Supply (Fournisseur)'],
          duration: '1h',
          decisions: [
            'Validation de la commande CMD-2026-00001',
            'Délai de livraison confirmé : 5 jours ouvrables',
            'Prix confirmé : 2.50 TND/kg HT',
          ],
          actions: [
            'Préparation de la commande par le fournisseur',
            'Génération de la facture',
          ],
          summary: 'Réunion de validation de commande. Le client Mohamed Ben Ali et le fournisseur African Food Supply ont confirmé les termes de la commande : 500kg de riz Basmati à 2.50 TND/kg, livraison sous 5 jours. La commande a été validée.',
        },
        summaryGeneratedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 70 * 60 * 1000),
      },
    });

    // Participants Room 1
    await prisma.roomParticipant.createMany({
      data: [
        {
          roomId: room1.id,
          userId: client1.id,
          participantRole: 'HOST',
          canShareScreen: true,
          canRecord: true,
          joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
          leftAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000),
          durationSeconds: 3600,
        },
        {
          roomId: room1.id,
          userId: supplier1.id,
          participantRole: 'PARTICIPANT',
          canShareScreen: true,
          canRecord: false,
          joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000),
          leftAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 64 * 60 * 1000),
          durationSeconds: 3420,
        },
      ],
    });

    // Messages Room 1
    await prisma.roomChatMessage.createMany({
      data: [
        {
          roomId: room1.id,
          senderId: client1.id,
          message: 'Bonjour, merci d\'avoir rejoint la réunion',
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 1000),
        },
        {
          roomId: room1.id,
          senderId: supplier1.id,
          message: 'Bonjour ! Prêt à discuter de la commande',
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 8 * 60 * 1000),
        },
        {
          roomId: room1.id,
          senderId: client1.id,
          message: 'Je partage le bon de commande',
          fileUrl: 'https://storage.tradelink.com/shared/bc-cmd-001.pdf',
          fileName: 'bon-commande.pdf',
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
        },
        {
          roomId: room1.id,
          senderId: supplier1.id,
          message: 'Reçu, tout est conforme. Je valide',
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
        },
      ],
    });

    console.log('✅ 1 Room Live créée avec 2 participants et 4 messages');
  }

  // Room 2 : Planifiée pour demain
  if (order2 && client2 && supplier2) {
    const room2 = await prisma.room.create({
      data: {
        roomCode: 'TL-CMD002',
        title: `Suivi Commande ${order2.orderNumber}`,
        type: 'SCHEDULED',
        status: 'SCHEDULED',
        hostId: client2.id,
        contextType: 'ORDER',
        contextId: order2.id,
        waitingRoomEnabled: true,
        recordingEnabled: true,
        maxParticipants: 5,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Demain
      },
    });

    console.log('✅ 1 Room planifiée créée');
  }

  // ============================================================
  // RÉSUMÉ
  // ============================================================
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ✅ DONNÉES MANQUANTES AJOUTÉES AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Données ajoutées :');
  console.log('   ✅ 1 configuration IA (GPT-4, multilingue)');
  console.log('   ✅ 3 périodes de calcul comptable');
  console.log('   ✅ 3 écritures comptables (journal)');
  console.log('   ✅ 4 documents générés (factures, bons)');
  console.log('   ✅ 4 logs de commandes vocales');
  console.log('   ✅ 2 rooms (1 terminée, 1 planifiée)');
  console.log('   ✅ 2 participants de room');
  console.log('   ✅ 4 messages de chat');
  console.log('');
  console.log('🎯 Nouveaux totaux :');
  console.log('   • Tables peuplées : 29/35 (83%)');
  console.log('   • Entrées totales : ~130');
  console.log('');
  console.log('📝 Tables restantes vides (auto-générées) :');
  console.log('   • user_sessions (se créent à chaque connexion)');
  console.log('   • user_devices (se créent avec nouveaux devices)');
  console.log('   • otp_codes (se créent lors d\'inscription/reset)');
  console.log('   • ocr_documents (quand OCR utilisé)');
  console.log('   • dynamic_field_schemas (détecté par OCR)');
  console.log('');
  console.log('🚀 Base de données prête avec un aperçu complet et réaliste !');
  console.log('═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
