import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Mise à jour des exemples de commandes vocales...\n');

  // Supprimer les anciens logs
  await prisma.voiceCommandLog.deleteMany({});

  const client1 = await prisma.user.findUnique({ where: { email: 'mohamed.ben.ali@gmail.com' } });
  const client2 = await prisma.user.findUnique({ where: { email: 'fatima.diop@outlook.com' } });

  // Exemples BONS (dans le scope)
  await prisma.voiceCommandLog.createMany({
    data: [
      // 1. Recherche de commandes
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Mes commandes en cours',
        detectedIntent: 'SEARCH_ORDERS',
        intentParams: {
          userId: client1!.id,
          status: ['CONFIRMED', 'SHIPPED'],
          results: [
            { orderNumber: 'CMD-2026-00003', status: 'CONFIRMED', total: 3094.00 }
          ]
        },
        actionTriggered: 'SEARCH',
        responseText: 'Vous avez 1 commande en cours : CMD-2026-00003 (Confirmée) - 3,094 TND. Elle contient 4 ordinateurs HP ProBook et attend l\'expédition.',
        lang: 'FR',
        processingMs: 234,
        isSuccess: true,
      },
      
      // 2. Navigation
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Ouvre mes factures',
        detectedIntent: 'NAVIGATE_MODULE',
        intentParams: {
          module: 'invoices',
          url: '/invoices'
        },
        actionTriggered: 'NAVIGATE',
        responseText: 'Navigation vers vos factures.',
        lang: 'FR',
        processingMs: 123,
        isSuccess: true,
      },
      
      // 3. Résumé personnalisé
      {
        userId: client2!.id,
        inputType: 'VOICE',
        commandText: 'Résume mon activité',
        detectedIntent: 'SUMMARY_ORDERS',
        intentParams: {
          userId: client2!.id,
          period: 'current_month',
          stats: {
            orders: 2,
            totalSpent: 9900.80,
            currency: 'XOF'
          }
        },
        actionTriggered: 'SUMMARY',
        responseText: 'Ce mois-ci, vous avez passé 2 commandes pour un total de 9,900 XOF. Vous avez 1 commande expédiée (CMD-2026-00002) qui arrive dans 2 jours, et 1 devis en attente de validation (DEVIS-2026-00001).',
        lang: 'FR',
        processingMs: 456,
        isSuccess: true,
      },
      
      // 4. Tracking
      {
        userId: client2!.id,
        inputType: 'TEXT',
        commandText: 'Où est ma livraison CMD-002 ?',
        detectedIntent: 'SEARCH_SHIPMENTS',
        intentParams: {
          orderNumber: 'CMD-2026-00002',
          shipment: {
            status: 'IN_TRANSIT',
            location: 'Frontière Côte d\'Ivoire - Guinée',
            estimatedDelivery: '2 jours'
          }
        },
        actionTriggered: 'SEARCH',
        responseText: 'Votre commande CMD-2026-00002 est en transit. Position actuelle : Frontière CI-Guinée. Livraison prévue dans 2 jours à Dakar. Le transporteur est African Express Delivery.',
        lang: 'FR',
        processingMs: 312,
        isSuccess: true,
      },
      
      // 5. Calcul
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Calcule les intérêts sur 10000 TND à 5% pendant 6 mois',
        detectedIntent: 'CALCULATE',
        intentParams: {
          amount: 10000,
          rate: 5,
          duration: 6,
          unit: 'months',
          formula: 'intérêts simples'
        },
        actionTriggered: 'CALCULATE',
        responseText: 'Les intérêts sont de 250 TND. Calcul : 10,000 × 5% × (6 mois / 12 mois) = 250 TND.',
        lang: 'FR',
        processingMs: 189,
        isSuccess: true,
      },
      
      // 6. Création ticket
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Crée un ticket pour un problème de livraison',
        detectedIntent: 'CREATE_TICKET',
        intentParams: {
          category: 'LOGISTICS',
          context: 'Formulaire pré-rempli'
        },
        actionTriggered: 'CREATE_TICKET',
        responseText: 'Je prépare un ticket support pour votre problème de livraison. Voulez-vous préciser de quelle commande il s\'agit ?',
        lang: 'FR',
        processingMs: 267,
        isSuccess: true,
      },
      
      // 7. État KYC
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Mon KYC est validé ?',
        detectedIntent: 'SUMMARY_KYC',
        intentParams: {
          kycStatus: 'APPROVED',
          validatedAt: new Date()
        },
        actionTriggered: 'SUMMARY',
        responseText: 'Oui, votre KYC a été validé. Votre compte est pleinement actif et vous pouvez passer des commandes sans restriction.',
        lang: 'FR',
        processingMs: 145,
        isSuccess: true,
      },
      
      // 8. Question HORS SCOPE - Refusée
      {
        userId: client2!.id,
        inputType: 'TEXT',
        commandText: 'Quelle est la météo à Dakar ?',
        detectedIntent: 'OUT_OF_SCOPE',
        intentParams: {
          reason: 'Question externe à TradeLink',
          topic: 'météo'
        },
        actionTriggered: null,
        responseText: 'Je suis l\'Assistant TradeLink et je peux uniquement vous aider avec vos données dans l\'application : commandes, factures, produits, expéditions. Que puis-je faire pour vous dans TradeLink ?',
        lang: 'FR',
        processingMs: 98,
        isSuccess: true,
      },
      
      // 9. Question générale business - Refusée
      {
        userId: client1!.id,
        inputType: 'TEXT',
        commandText: 'Comment optimiser mes marges ?',
        detectedIntent: 'OUT_OF_SCOPE',
        intentParams: {
          reason: 'Conseil business général',
          topic: 'optimisation'
        },
        actionTriggered: null,
        responseText: 'Je ne peux pas donner de conseils business généraux. Cependant, je peux vous montrer vos données TradeLink : historique de commandes, prix d\'achat, marges par produit. Voulez-vous consulter ces informations ?',
        lang: 'FR',
        processingMs: 167,
        isSuccess: true,
      },
      
      // 10. Incompréhensible
      {
        userId: client2!.id,
        inputType: 'TEXT',
        commandText: 'azerty qwerty 12345',
        detectedIntent: null,
        intentParams: null,
        actionTriggered: null,
        responseText: null,
        lang: 'FR',
        processingMs: 76,
        isSuccess: false,
        errorMessage: 'Commande non comprise',
      },
    ],
  });

  console.log('✅ 10 exemples de commandes créés\n');
  console.log('📊 Répartition :');
  console.log('   ✅ 7 commandes réussies (dans le scope)');
  console.log('   ❌ 2 commandes refusées (hors scope)');
  console.log('   ⚠️  1 commande incompréhensible\n');
  
  console.log('🎯 Types de commandes :');
  console.log('   • Recherche (commandes, expéditions)');
  console.log('   • Navigation (interface)');
  console.log('   • Résumé (activité personnalisée)');
  console.log('   • Calculs (comptabilité)');
  console.log('   • Actions (création ticket)');
  console.log('   • Questions hors scope (refusées)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
