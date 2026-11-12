# 🧪 Guide de Test - TradeLink Backend

**Dernière mise à jour** : 9 novembre 2026

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration](#configuration)
3. [Script de test automatique](#script-de-test-automatique)
4. [Tests des services](#tests-des-services)
5. [Tests des paiements](#tests-des-paiements)
6. [Tests du CRON KYC](#tests-du-cron-kyc)
7. [Tests des queues](#tests-des-queues)
8. [Dépannage](#dépannage)

---

## 🔧 Prérequis

### 1. Infrastructure
```bash
# Depuis la racine du dépôt, vérifier que Docker est installé
docker --version
docker-compose --version

# Démarrer PostgreSQL + Redis
docker-compose up -d

# Vérifier que les containers tournent
docker ps
# Attendu : postgres + redis en état "Up"
```

### 2. Backend
```bash
# Installer les dépendances
cd apps/api
pnpm install

# Appliquer les migrations Prisma
pnpm prisma migrate dev

# Générer le client Prisma
pnpm prisma generate

# Démarrer le backend en mode dev
pnpm dev
# Backend devrait être sur http://localhost:3000
```

### 3. Obtenir un token Admin
```bash
# Définir SEED_USER_PASSWORD dans apps/api/.env (fichier local ignoré par Git),
# puis créer les comptes de développement.
pnpm prisma:seed

# Alternative : promouvoir un utilisateur existant via Prisma Studio
pnpm prisma studio
# Ouvrir http://localhost:5555
# Aller dans table "User" → modifier le rôle → "ADMIN"

# Se connecter avec le mot de passe local SEED_USER_PASSWORD
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@test.com\",\"password\":\"$SEED_USER_PASSWORD\"}"

# Copier le "accessToken" dans la réponse
export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ⚙️ Configuration

### Variables d'environnement
Créer un fichier `.env` dans `apps/api/` :

```bash
# Database
DATABASE_URL="postgresql://postgres:replace-with-a-unique-local-secret@localhost:5432/tradelink"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Brevo (Email)
BREVO_API_KEY=xkeysib-your-api-key-here

# Africa's Talking (SMS)
AFRICASTALKING_API_KEY=your-api-key-here
AFRICASTALKING_USERNAME=sandbox

# WhatsApp Cloud API
WHATSAPP_PHONE_ID=your-phone-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_SECRET=your-webhook-secret

# CinetPay
CINETPAY_API_KEY=your-api-key
CINETPAY_SITE_ID=your-site-id
CINETPAY_WEBHOOK_SECRET=your-webhook-secret

# FedaPay
FEDAPAY_SECRET_KEY=your-secret-key
FEDAPAY_PUBLIC_KEY=your-public-key
FEDAPAY_ENVIRONMENT=sandbox

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs
API_URL=http://localhost:3000
APP_URL=http://localhost:5173
```

---

## 🤖 Script de test automatique

Un script Bash est fourni pour faciliter les tests de tous les services.

### Installation
```bash
# Le script est déjà dans le repo
chmod +x test-services.sh

# Exporter votre token Admin
export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Utilisation

#### Tester tous les services
```bash
./test-services.sh all
```

#### Tester un service spécifique
```bash
# Test Brevo (Email)
./test-services.sh brevo

# Test SMS avec numéro personnalisé
./test-services.sh sms +228XXXXXXXX fr

# Test WhatsApp avec numéro personnalisé
./test-services.sh whatsapp +228XXXXXXXX en

# Test CRON KYC
./test-services.sh cron
```

#### Vérifier l'état des services
```bash
./test-services.sh check
```

#### Aide
```bash
./test-services.sh help
```

### Exemple de sortie

```bash
$ ./test-services.sh all

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 Test de tous les services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Brevo (Email)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Envoi de la requête...
✅ Connexion Brevo réussie
{
  "success": true,
  "message": "Connexion à Brevo réussie",
  "timestamp": "2026-11-09T10:30:00.000Z"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test SMS (Africa's Talking)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  Envoi SMS de test à +228XXXXXXXX (langue: fr)
✅ SMS envoyé avec succès
...
```

---

## 📧 Tests des services

### 1. Test Brevo (Email)

#### Test de connexion
```bash
curl -X POST http://localhost:3000/api/emails/test-connection \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Connexion à Brevo réussie",
  "timestamp": "2026-11-09T10:30:00.000Z"
}
```

**En cas d'erreur** :
- Vérifier `BREVO_API_KEY` dans `.env`
- Vérifier que la clé commence par `xkeysib-`
- Se connecter sur [app.brevo.com](https://app.brevo.com) pour générer une nouvelle clé

#### Envoyer un email de test via queue
```bash
# Créer manuellement un job dans la queue
curl -X POST http://localhost:3000/api/queue/test-email \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "templateType": "welcome",
    "language": "fr",
    "params": {
      "userName": "John Doe"
    }
  }'
```

### 2. Test SMS (Africa's Talking)

#### Envoyer un SMS de test
```bash
curl -X POST http://localhost:3000/api/sms/test-send \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+228XXXXXXXX",
    "language": "fr"
  }'
```

**Formats de numéro acceptés** :
- International : `+228XXXXXXXX` (Togo)
- International : `+33XXXXXXXXX` (France)
- Sans le `+` : `228XXXXXXXX`

**Réponse attendue** :
```json
{
  "success": true,
  "message": "SMS de test envoyé avec succès",
  "result": {
    "SMSMessageData": {
      "Recipients": [
        {
          "statusCode": 101,
          "number": "+228XXXXXXXX",
          "status": "Success",
          "cost": "KES 0.8000",
          "messageId": "ATXid_xxxxx"
        }
      ]
    }
  },
  "timestamp": "2026-11-09T10:35:00.000Z"
}
```

**Codes de statut Africa's Talking** :
- `101` : Success
- `102` : Queued
- `401` : Insufficient Balance
- `403` : Invalid Credentials
- `404` : Invalid Phone Number

**Test sandbox** :
```bash
# Le sandbox envoie des SMS uniquement aux numéros de test
# Ajouter votre numéro dans le dashboard sandbox :
# https://account.africastalking.com/apps/sandbox/sms
```

### 3. Test WhatsApp (Meta Cloud API)

#### Envoyer un message WhatsApp de test
```bash
curl -X POST http://localhost:3000/api/whatsapp/test-send \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+228XXXXXXXX",
    "language": "fr"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Message WhatsApp de test envoyé avec succès",
  "result": {
    "messaging_product": "whatsapp",
    "contacts": [
      {
        "input": "+228XXXXXXXX",
        "wa_id": "228XXXXXXXX"
      }
    ],
    "messages": [
      {
        "id": "wamid.xxxxx"
      }
    ]
  },
  "timestamp": "2026-11-09T10:40:00.000Z"
}
```

**Configuration requise** :
1. Créer compte [Meta Business](https://business.facebook.com)
2. Créer application WhatsApp Business
3. Obtenir `WHATSAPP_PHONE_ID` et `WHATSAPP_ACCESS_TOKEN`
4. Créer et soumettre des templates pour approbation
5. Vérifier le numéro de test dans le dashboard

**Templates à créer dans Meta Business** :
- `kyc_reminder` (FR/EN/AR)
- `order_update` (FR/EN/AR)
- `invoice_reminder` (FR/EN/AR)

---

## 💳 Tests des paiements

### 1. Test Stripe (Mode Test)

#### Créer un Payment Intent
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "clxxxx...",
    "amount": 5000,
    "currency": "eur",
    "provider": "stripe"
  }'
```

**Cartes de test Stripe** :
- Succès : `4242 4242 4242 4242`
- Décliné : `4000 0000 0000 0002`
- 3D Secure : `4000 0027 6000 3184`

#### Vérifier le webhook Stripe
```bash
# Stripe CLI (pour tests locaux)
stripe listen --forward-to localhost:3000/api/payments/webhooks/stripe

# Trigger un événement
stripe trigger payment_intent.succeeded
```

### 2. Test CinetPay (Sandbox Mobile Money)

#### Créer un paiement CinetPay
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "clxxxx...",
    "amount": 5000,
    "currency": "XOF",
    "provider": "cinetpay"
  }'
```

**Numéros de test CinetPay (Sandbox)** :
- MTN Money : `00229XXXXXXXX`
- Moov Money : `00229XXXXXXXX`
- OTP test : `123456`

**Statuts de transaction** :
- `PENDING` : En attente
- `ACCEPTED` : Validé
- `REFUSED` : Refusé
- `CANCELLED` : Annulé

#### Vérifier le statut d'un paiement
```bash
curl -X GET http://localhost:3000/api/payments/{paymentId} \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 3. Test FedaPay (Sandbox)

#### Créer un paiement FedaPay
```bash
curl -X POST http://localhost:3000/api/payments/create \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "clxxxx...",
    "amount": 5000,
    "currency": "XOF",
    "provider": "fedapay"
  }'
```

**Numéros de test FedaPay (Sandbox)** :
- Moov Money Bénin : `+22961000000`
- MTN Money Bénin : `+22951000000`

---

## ⏰ Tests du CRON KYC

### 1. Déclenchement manuel

```bash
curl -X POST http://localhost:3000/api/kyc/cron/test-reminders \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Réponse attendue** :
```json
{
  "message": "CRON des rappels KYC exécuté manuellement avec succès",
  "timestamp": "2026-11-09T10:45:00.000Z"
}
```

**Logs attendus dans la console backend** :
```
[KycScheduler] Starting KYC reminders check at 2026-11-09T10:45:00.000Z
[KycScheduler] Found 5 KYC records to process
[KycScheduler] User clxxxx: 1 days elapsed - Sending reminder (Day 1)
[KycScheduler] User clyyyy: 3 days elapsed - Sending reminder (Day 3)
[KycScheduler] User clzzzz: 7 days elapsed - Suspending account
[KycScheduler] Suspended user clzzzz for incomplete KYC after 7 days
[KycScheduler] Completed KYC reminders check. Processed: 5, Suspended: 1
```

### 2. Test du workflow complet

#### Étape 1 : Créer un utilisateur test
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kyc-test@example.com",
    "password": "Test123!",
    "role": "CLIENT"
  }'

# Noter l'userId retourné
export USER_ID="clxxxx..."
```

#### Étape 2 : Modifier la date de création du KYC (via Prisma Studio)
```bash
# Ouvrir Prisma Studio
pnpm prisma studio

# Aller dans la table "Kyc"
# Trouver le KYC de l'utilisateur créé
# Modifier "createdAt" pour simuler une date passée :
# - J+1 : createdAt = aujourd'hui - 1 jour
# - J+3 : createdAt = aujourd'hui - 3 jours
# - J+5 : createdAt = aujourd'hui - 5 jours
# - J+7 : createdAt = aujourd'hui - 7 jours
```

#### Étape 3 : Déclencher le CRON manuellement
```bash
curl -X POST http://localhost:3000/api/kyc/cron/test-reminders \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Étape 4 : Vérifier les queues Redis
```bash
# Installer Redis CLI
# Sur Linux :
sudo apt-get install redis-tools

# Sur macOS :
brew install redis

# Se connecter à Redis
redis-cli

# Lister les queues BullMQ
KEYS bull:*:id

# Voir les jobs dans la queue emails
LRANGE bull:emails:wait 0 -1

# Voir les stats d'une queue
HGETALL bull:emails:meta
```

#### Étape 5 : Vérifier l'email/SMS/WhatsApp
- **Email** : Checker la boîte mail de `kyc-test@example.com`
- **SMS** : Checker le téléphone si renseigné
- **WhatsApp** : Checker WhatsApp Business

---

## 🔄 Tests des queues

### 1. Surveillance des queues Redis

#### Via Redis CLI
```bash
redis-cli

# Lister toutes les queues
KEYS bull:*

# Voir les jobs en attente
LRANGE bull:emails:wait 0 -1
LRANGE bull:sms:wait 0 -1
LRANGE bull:whatsapp:wait 0 -1
LRANGE bull:pdf:wait 0 -1

# Voir les jobs en cours
LRANGE bull:emails:active 0 -1

# Voir les jobs complétés
LRANGE bull:emails:completed 0 -1

# Voir les jobs échoués
LRANGE bull:emails:failed 0 -1

# Compter les jobs
LLEN bull:emails:wait
```

#### Via Bull Board (optionnel, à implémenter)
```typescript
// À ajouter dans apps/api/src/main.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(smsQueue),
    new BullMQAdapter(whatsappQueue),
    new BullMQAdapter(pdfQueue),
    new BullMQAdapter(kycRemindersQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Puis accéder à : http://localhost:3000/admin/queues

### 2. Nettoyer les queues

```bash
redis-cli

# Vider toutes les queues
FLUSHDB

# Ou vider une queue spécifique
DEL bull:emails:wait
DEL bull:emails:active
DEL bull:emails:completed
DEL bull:emails:failed
```

---

## 🔍 Dépannage

### Problème : Backend ne démarre pas

**Erreur : Cannot connect to PostgreSQL**
```bash
# Vérifier que PostgreSQL est démarré
docker ps | grep postgres

# Si absent, démarrer :
docker-compose up -d postgres

# Vérifier les logs
docker logs tradelink-postgres
```

**Erreur : Cannot connect to Redis**
```bash
# Vérifier que Redis est démarré
docker ps | grep redis

# Si absent, démarrer :
docker-compose up -d redis

# Vérifier les logs
docker logs tradelink-redis

# Tester la connexion
redis-cli ping
# Attendu : PONG
```

**Erreur : Prisma schema out of sync**
```bash
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev
```

### Problème : Email ne s'envoie pas

**Erreur : Invalid API Key**
```bash
# Vérifier la clé dans .env
cat apps/api/.env | grep BREVO_API_KEY

# Régénérer une clé sur https://app.brevo.com/settings/keys/api
# Format attendu : xkeysib-xxxxx
```

**Erreur : Template not found**
```bash
# Les templates doivent être créés dans Brevo
# 1. Se connecter sur https://app.brevo.com
# 2. Aller dans "Campaigns" → "Templates"
# 3. Créer les 12 templates × 3 langues = 36 templates
# 4. Noter les IDs de templates
# 5. Mettre à jour BrevoService avec les vrais IDs
```

### Problème : SMS ne s'envoie pas

**Erreur : Invalid credentials**
```bash
# Vérifier les credentials
cat apps/api/.env | grep AFRICASTALKING

# Se connecter sur https://account.africastalking.com/
# Vérifier que le username et l'API key sont corrects
```

**Erreur : Insufficient Balance**
```bash
# En mode sandbox, le crédit est illimité
# Vérifier que AFRICASTALKING_USERNAME=sandbox

# En mode production :
# 1. Se connecter sur le dashboard
# 2. Recharger le compte
```

**Erreur : Invalid Phone Number**
```bash
# Format attendu : +228XXXXXXXX (format international)
# Vérifier que le numéro est dans la liste sandbox
```

### Problème : WhatsApp ne s'envoie pas

**Erreur : Invalid phone number**
```bash
# Le numéro doit être vérifié dans Meta Business
# 1. Aller sur https://business.facebook.com
# 2. WhatsApp Manager → Phone numbers
# 3. Ajouter le numéro de test
```

**Erreur : Template not found**
```bash
# Les templates doivent être approuvés par Meta
# 1. Créer templates dans Meta Business
# 2. Soumettre pour approbation (délai 24-48h)
# 3. Une fois approuvés, utiliser les noms exacts
```

### Problème : CRON ne se déclenche pas automatiquement

**Vérifier que ScheduleModule est activé**
```typescript
// apps/api/src/app.module.ts
@Module({
  imports: [
    ScheduleModule.forRoot(), // ← doit être présent
    // ...
  ],
})
```

**Vérifier que KycScheduler est dans les providers**
```typescript
// apps/api/src/modules/kyc/kyc.module.ts
@Module({
  providers: [KycService, KycScheduler], // ← KycScheduler présent
})
```

**Tester manuellement**
```bash
curl -X POST http://localhost:3000/api/kyc/cron/test-reminders \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Changer l'heure d'exécution du CRON**
```typescript
// apps/api/src/modules/kyc/kyc.scheduler.ts
@Cron('0 9 * * *') // Changer ici
// Format : seconde minute heure jour mois jour_semaine
// Exemples :
// '0 9 * * *'  : Tous les jours à 9h UTC
// '*/5 * * * *': Toutes les 5 minutes
// '0 */2 * * *': Toutes les 2 heures
```

### Problème : Queues ne se vident pas

**Vérifier que les workers tournent**
```bash
# Les logs du backend doivent montrer :
[BullMQ] Processor EmailProcessor registered for queue: emails
[BullMQ] Processor SmsProcessor registered for queue: sms
[BullMQ] Processor WhatsAppProcessor registered for queue: whatsapp
[BullMQ] Processor PdfProcessor registered for queue: pdf
```

**Vérifier les jobs dans Redis**
```bash
redis-cli
LLEN bull:emails:wait
LLEN bull:emails:failed

# Si beaucoup de jobs failed :
LRANGE bull:emails:failed 0 -1
# Analyser les erreurs
```

**Relancer les jobs failed**
```typescript
// Créer un endpoint admin
@Post('retry-failed')
@Roles(Role.ADMIN)
async retryFailed(@Query('queue') queue: string) {
  const queueInstance = this.queueService.getQueue(queue);
  const failed = await queueInstance.getFailed();
  
  for (const job of failed) {
    await job.retry();
  }
  
  return { retried: failed.length };
}
```

---

## 📊 Monitoring

### Logs à surveiller

```bash
# Backend logs
cd apps/api
pnpm dev

# Surveiller :
# ✅ [KycScheduler] Starting KYC reminders check
# ✅ [EmailProcessor] Processing job: kyc_reminder
# ✅ [BrevoService] Email sent successfully
# ❌ [EmailProcessor] Error processing job: ...
```

### Métriques importantes

```bash
# Nombre de jobs par queue
redis-cli LLEN bull:emails:wait
redis-cli LLEN bull:sms:wait
redis-cli LLEN bull:whatsapp:wait
redis-cli LLEN bull:pdf:wait

# Nombre de jobs failed
redis-cli LLEN bull:emails:failed

# Stats d'une queue
redis-cli HGETALL bull:emails:meta
```

---

## ✅ Checklist de test

### Services communication
- [ ] ✅ Test connexion Brevo réussi
- [ ] ✅ Email de test reçu
- [ ] ✅ SMS de test reçu (Africa's Talking)
- [ ] ✅ WhatsApp de test reçu (Meta)

### Paiements
- [ ] ✅ Paiement Stripe test réussi
- [ ] ✅ Webhook Stripe reçu et traité
- [ ] ✅ Paiement CinetPay sandbox réussi
- [ ] ✅ Paiement FedaPay sandbox réussi

### CRON KYC
- [ ] ✅ CRON déclenché manuellement
- [ ] ✅ Email rappel J+1 reçu
- [ ] ✅ Email + SMS rappel J+3 reçus
- [ ] ✅ Email + SMS + WhatsApp J+5 reçus
- [ ] ✅ Suspension J+7 effectuée

### Queues
- [ ] ✅ Queues Redis créées
- [ ] ✅ Jobs processés correctement
- [ ] ✅ Retry automatique fonctionne
- [ ] ✅ Logs détaillés visibles

---

**Guide complet pour tester TradeLink Backend ! 🚀**

Pour toute question, consulter :
- `SESSION_SUMMARY_4.md` : Détails de l'implémentation
- `TASKS_REGISTRY.md` : Suivi des tâches
- `TECH_STACK_FINAL.md` : Stack technique complet
