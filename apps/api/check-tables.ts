import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  console.log('📊 ANALYSE DES TABLES - BASE DE DONNÉES TRADELINK\n');
  console.log('================================================\n');

  const tables = [
    // Auth & Users
    { name: 'users', model: 'user' },
    { name: 'user_sessions', model: 'userSession' },
    { name: 'user_devices', model: 'userDevice' },
    { name: 'otp_codes', model: 'otpCode' },
    
    // KYC
    { name: 'kyc_records', model: 'kycRecord' },
    { name: 'kyc_documents', model: 'kycDocument' },
    
    // Catalog
    { name: 'categories', model: 'category' },
    { name: 'products', model: 'product' },
    { name: 'product_images', model: 'productImage' },
    { name: 'product_translations', model: 'productTranslation' },
    { name: 'product_variants', model: 'productVariant' },
    
    // Orders
    { name: 'orders', model: 'order' },
    { name: 'order_items', model: 'orderItem' },
    
    // Invoicing
    { name: 'invoices', model: 'invoice' },
    { name: 'payments', model: 'payment' },
    
    // Logistics
    { name: 'shipments', model: 'shipment' },
    { name: 'shipment_events', model: 'shipmentEvent' },
    { name: 'proofs_of_delivery', model: 'proofOfDelivery' },
    
    // Accounting
    { name: 'calculation_rules', model: 'calculationRule' },
    { name: 'calculation_periods', model: 'calculationPeriod' },
    { name: 'accounting_entries', model: 'accountingEntry' },
    
    // Documents
    { name: 'generated_documents', model: 'generatedDocument' },
    
    // OCR
    { name: 'ocr_documents', model: 'ocrDocument' },
    { name: 'dynamic_field_schemas', model: 'dynamicFieldSchema' },
    
    // AI
    { name: 'voice_command_logs', model: 'voiceCommandLog' },
    { name: 'ai_assistant_configs', model: 'aiAssistantConfig' },
    
    // Room Live
    { name: 'rooms', model: 'room' },
    { name: 'room_participants', model: 'roomParticipant' },
    { name: 'room_chat_messages', model: 'roomChatMessage' },
    
    // Support
    { name: 'tickets', model: 'ticket' },
    { name: 'ticket_messages', model: 'ticketMessage' },
    
    // Notifications
    { name: 'notifications', model: 'notification' },
    
    // Admin
    { name: 'floating_buttons', model: 'floatingButton' },
    { name: 'audit_logs', model: 'auditLog' },
    { name: 'system_configs', model: 'systemConfig' },
  ];

  const results = {
    populated: [] as any[],
    empty: [] as any[],
  };

  for (const table of tables) {
    try {
      const count = await (prisma as any)[table.model].count();
      
      if (count > 0) {
        results.populated.push({ ...table, count });
      } else {
        results.empty.push(table);
      }
    } catch (error) {
      console.error(`Erreur pour ${table.name}:`, error.message);
    }
  }

  console.log('✅ TABLES PEUPLÉES (' + results.populated.length + '/' + tables.length + ') :\n');
  results.populated.forEach(t => {
    const icon = t.count > 10 ? '📊' : t.count > 5 ? '📈' : '📉';
    console.log(`   ${icon} ${t.name.padEnd(30)} : ${t.count.toString().padStart(3)} entrée(s)`);
  });

  if (results.empty.length > 0) {
    console.log('\n❌ TABLES VIDES (' + results.empty.length + ') :\n');
    results.empty.forEach(t => {
      console.log(`   🔴 ${t.name}`);
    });
  }

  console.log('\n================================================');
  console.log(`📊 Total : ${results.populated.length} tables peuplées / ${tables.length} tables`);
  console.log(`✅ Taux de remplissage : ${Math.round((results.populated.length / tables.length) * 100)}%`);
  console.log('================================================\n');

  // Suggestions
  if (results.empty.length > 0) {
    console.log('💡 SUGGESTIONS POUR COMPLÉTER :\n');
    
    results.empty.forEach(t => {
      const suggestions = {
        'user_sessions': '→ Se connecter avec les comptes créés',
        'user_devices': '→ Se connecter depuis différents navigateurs',
        'otp_codes': '→ Inscription ou reset password',
        'calculation_periods': '→ Utiliser le calculateur comptable',
        'accounting_entries': '→ Générer des écritures comptables',
        'generated_documents': '→ Générer des PDFs (factures, bons de livraison)',
        'voice_command_logs': '→ Utiliser l\'assistant vocal',
        'ai_assistant_configs': '→ Configurer l\'IA (admin)',
        'rooms': '→ Créer des salles de visioconférence',
        'room_participants': '→ Rejoindre des rooms',
        'room_chat_messages': '→ Chatter dans les rooms',
        'ocr_documents': '→ Uploader des documents pour OCR',
        'dynamic_field_schemas': '→ L\'OCR détectera de nouveaux champs',
      };
      
      if (suggestions[t.name]) {
        console.log(`   ${suggestions[t.name]}`);
      }
    });
  }

  await prisma.$disconnect();
}

checkTables().catch(console.error);
