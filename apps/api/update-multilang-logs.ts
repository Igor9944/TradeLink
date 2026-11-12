import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌐 Ajout d\'exemples multilingues...\n');

  await prisma.voiceCommandLog.deleteMany({});

  const client1 = await prisma.user.findUnique({ where: { email: 'mohamed.ben.ali@gmail.com' } });
  const client2 = await prisma.user.findUnique({ where: { email: 'fatima.diop@outlook.com' } });
  const client3 = await prisma.user.findUnique({ where: { email: 'ahmed.hassan@yahoo.com' } });

  await prisma.voiceCommandLog.createMany({
    data: [
      // ========================================
      // FRANÇAIS (6 exemples)
      // ========================================
      
      // 1. Recherche commandes - FR
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Affiche mes commandes en cours',
        detectedIntent: 'SEARCH_ORDERS',
        intentParams: {
          status: ['CONFIRMED', 'SHIPPED'],
          count: 1
        },
        actionTriggered: 'SEARCH',
        responseText: 'Vous avez 1 commande en cours :\n\n📦 CMD-2026-00003 - CONFIRMÉE\n• 4× HP ProBook 450 G9\n• Montant : 3 094,00 TND TTC\n• Statut : En attente d\'expédition\n\nVoulez-vous suivre cette commande ?',
        lang: 'FR',
        processingMs: 234,
        isSuccess: true,
      },
      
      // 2. Résumé activité - FR
      {
        userId: client2!.id,
        inputType: 'VOICE',
        commandText: 'Résume mon activité ce mois',
        detectedIntent: 'SUMMARY_ORDERS',
        intentParams: {
          period: 'current_month'
        },
        actionTriggered: 'SUMMARY',
        responseText: 'Voici votre activité en novembre 2026 :\n\n📊 2 commandes passées\n💰 9 900,80 XOF dépensés\n🚚 1 livraison en cours (arrivée dans 2 jours)\n📝 1 devis en attente de validation\n\nVotre commande CMD-2026-00002 (6 téléphones Samsung) sera livrée à Dakar le 11 novembre.',
        lang: 'FR',
        processingMs: 456,
        isSuccess: true,
      },
      
      // 3. Calcul - FR
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Calcule les intérêts sur 15000 dinars à 4.5% pendant 9 mois',
        detectedIntent: 'CALCULATE',
        intentParams: {
          amount: 15000,
          rate: 4.5,
          duration: 9,
          unit: 'months'
        },
        actionTriggered: 'CALCULATE',
        responseText: 'Calcul d\'intérêts simples :\n\n💰 Montant : 15 000,00 TND\n📈 Taux : 4,5%\n📅 Durée : 9 mois (270 jours)\n\n✅ Intérêts : 506,25 TND\n\nDétail : 15 000 × 4,5% × (9÷12) = 506,25 TND',
        lang: 'FR',
        processingMs: 189,
        isSuccess: true,
      },
      
      // 4. Tracking - FR
      {
        userId: client2!.id,
        inputType: 'TEXT',
        commandText: 'Où se trouve ma commande CMD-2026-00002 ?',
        detectedIntent: 'SEARCH_SHIPMENTS',
        intentParams: {
          orderNumber: 'CMD-2026-00002'
        },
        actionTriggered: 'SEARCH',
        responseText: '🚚 Suivi de votre commande CMD-2026-00002\n\n📍 Position actuelle : Frontière Côte d\'Ivoire - Guinée\n🚛 Transporteur : African Express Delivery\n📦 Colis : 6× Samsung Galaxy A54 5G\n📅 Livraison prévue : Dans 2 jours à Dakar\n\nLe camion frigorifique est en transit. Tout se déroule normalement.',
        lang: 'FR',
        processingMs: 312,
        isSuccess: true,
      },
      
      // 5. Question hors scope - FR
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Quelle est la météo à Tunis demain ?',
        detectedIntent: 'OUT_OF_SCOPE',
        intentParams: {
          reason: 'Question météo',
          topic: 'weather'
        },
        actionTriggered: null,
        responseText: 'Je suis l\'Assistant TradeLink et je peux uniquement vous aider avec vos données dans l\'application :\n\n✅ Vos commandes et factures\n✅ Vos produits et stocks\n✅ Vos expéditions et livraisons\n✅ Les calculs comptables\n✅ La création de tickets support\n\nQue puis-je faire pour vous dans TradeLink ?',
        lang: 'FR',
        processingMs: 98,
        isSuccess: true,
      },
      
      // 6. État KYC - FR
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Quel est l\'état de mon KYC ?',
        detectedIntent: 'SUMMARY_KYC',
        intentParams: {
          kycStatus: 'APPROVED'
        },
        actionTriggered: 'SUMMARY',
        responseText: '✅ Votre KYC est validé\n\nVotre dossier a été approuvé par notre équipe. Votre compte est pleinement actif et vous bénéficiez de toutes les fonctionnalités TradeLink :\n\n• Passer des commandes sans limite\n• Accéder aux paiements sécurisés\n• Créer des visioconférences\n• Exporter des documents officiels',
        lang: 'FR',
        processingMs: 145,
        isSuccess: true,
      },

      // ========================================
      // ENGLISH (3 exemples)
      // ========================================
      
      // 7. Search orders - EN
      {
        userId: client2!.id,
        inputType: 'TEXT',
        commandText: 'Show my pending invoices',
        detectedIntent: 'SEARCH_INVOICES',
        intentParams: {
          status: ['SENT', 'OVERDUE']
        },
        actionTriggered: 'SEARCH',
        responseText: 'You have 1 pending invoice:\n\n💳 FAC-2026-00002\n• Amount: 2,284.80 XOF\n• Issued: 5 days ago\n• Due date: In 10 days\n• Order: CMD-2026-00002 (6× Samsung Galaxy A54)\n\nYou can pay now to avoid late fees.',
        lang: 'EN',
        processingMs: 267,
        isSuccess: true,
      },
      
      // 8. Out of scope - EN
      {
        userId: client2!.id,
        inputType: 'TEXT',
        commandText: 'What are the best marketing strategies?',
        detectedIntent: 'OUT_OF_SCOPE',
        intentParams: {
          reason: 'General business advice',
          topic: 'marketing'
        },
        actionTriggered: null,
        responseText: 'I am the TradeLink Assistant and can only help you with your data in the application:\n\n✅ Your orders and invoices\n✅ Your products and inventory\n✅ Your shipments and deliveries\n✅ Accounting calculations\n✅ Support ticket creation\n\nWhat can I do for you in TradeLink?',
        lang: 'EN',
        processingMs: 156,
        isSuccess: true,
      },
      
      // 9. Create ticket - EN
      {
        userId: client2!.id,
        inputType: 'TEXT',
        commandText: 'Create a support ticket for delivery issue',
        detectedIntent: 'CREATE_TICKET',
        intentParams: {
          category: 'LOGISTICS'
        },
        actionTriggered: 'CREATE_TICKET',
        responseText: 'I\'m preparing a support ticket for your delivery issue.\n\n📋 Category: Logistics\n📦 Recent orders with shipments:\n• CMD-2026-00002 (in transit)\n\nWhich order is this about? Or would you like me to create a general ticket?',
        lang: 'EN',
        processingMs: 198,
        isSuccess: true,
      },

      // ========================================
      // ARABIC (3 exemples)
      // ========================================
      
      // 10. Recherche commandes - AR
      {
        userId: client3!.id,
        inputType: 'TEXT',
        commandText: 'أين طلبي؟',
        detectedIntent: 'SEARCH_ORDERS',
        intentParams: {
          status: 'all'
        },
        actionTriggered: 'SEARCH',
        responseText: 'ليس لديك طلبات حالياً.\n\n💡 للبدء في TradeLink:\n\n1️⃣ أكمل ملف KYC الخاص بك (متبقي 5 أيام)\n2️⃣ تصفح كتالوج المنتجات\n3️⃣ قم بإنشاء طلبك الأول\n\nهل تحتاج مساعدة في إكمال KYC؟',
        lang: 'AR',
        processingMs: 201,
        isSuccess: true,
      },
      
      // 11. État KYC - AR
      {
        userId: client3!.id,
        inputType: 'TEXT',
        commandText: 'ما هي حالة KYC الخاصة بي؟',
        detectedIntent: 'SUMMARY_KYC',
        intentParams: {
          kycStatus: 'PENDING_KYC',
          daysLeft: 5
        },
        actionTriggered: 'SUMMARY',
        responseText: '⚠️ ملف KYC قيد الانتظار\n\n📅 الموعد النهائي: 5 أيام متبقية\n📄 المستندات المطلوبة:\n• بطاقة الهوية الوطنية أو جواز السفر\n• إثبات العنوان\n\n⚡ قم بإرسال مستنداتك الآن لتفعيل حسابك بالكامل والوصول إلى جميع خدمات TradeLink.\n\nبعد 5 أيام، سيتم تعليق حسابك مؤقتاً حتى إتمام KYC.',
        lang: 'AR',
        processingMs: 289,
        isSuccess: true,
      },
      
      // 12. Out of scope - AR
      {
        userId: client3!.id,
        inputType: 'TEXT',
        commandText: 'ما هو سعر الدولار اليوم؟',
        detectedIntent: 'OUT_OF_SCOPE',
        intentParams: {
          reason: 'Currency rates',
          topic: 'external_data'
        },
        actionTriggered: null,
        responseText: 'أنا مساعد TradeLink ويمكنني مساعدتك فقط ببياناتك في التطبيق:\n\n✅ طلباتك وفواتيرك\n✅ منتجاتك ومخزونك\n✅ شحناتك وتسليماتك\n✅ الحسابات المحاسبية\n✅ إنشاء تذاكر الدعم\n\nكيف يمكنني مساعدتك في TradeLink؟',
        lang: 'AR',
        processingMs: 134,
        isSuccess: true,
      },
    ],
  });

  console.log('✅ 12 exemples multilingues créés\n');
  console.log('📊 Répartition par langue:');
  console.log('   🇫🇷 Français : 6 exemples');
  console.log('   🇬🇧 Anglais  : 3 exemples');
  console.log('   🇸🇦 Arabe    : 3 exemples\n');
  console.log('🎯 Types de commandes:');
  console.log('   • Recherche (commandes, factures, expéditions)');
  console.log('   • Résumés (activité, KYC)');
  console.log('   • Calculs (intérêts)');
  console.log('   • Actions (création ticket)');
  console.log('   • Questions hors scope (refusées poliment)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
