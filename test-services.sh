#!/bin/bash

# 🧪 Script de test des services TradeLink
# Usage: ./test-services.sh [service] [options]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000/api}"
ADMIN_TOKEN="${ADMIN_TOKEN}"

# Fonctions utilitaires
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_token() {
    if [ -z "$ADMIN_TOKEN" ]; then
        print_error "ADMIN_TOKEN non défini"
        echo "Exportez votre token Admin :"
        echo "  export ADMIN_TOKEN=\"your-token-here\""
        exit 1
    fi
}

# Tests

test_brevo() {
    print_header "Test Brevo (Email)"
    check_token
    
    print_info "Envoi de la requête..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/emails/test-connection" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "Connexion Brevo réussie"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "Échec de connexion Brevo (HTTP $http_code)"
        echo "$body"
    fi
}

test_sms() {
    print_header "Test SMS (Africa's Talking)"
    check_token
    
    phone_number="${1:-+228XXXXXXXX}"
    language="${2:-fr}"
    
    print_info "Envoi SMS de test à $phone_number (langue: $language)"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/sms/test-send" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"phoneNumber\":\"$phone_number\",\"language\":\"$language\"}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "SMS envoyé avec succès"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "Échec d'envoi SMS (HTTP $http_code)"
        echo "$body"
    fi
}

test_whatsapp() {
    print_header "Test WhatsApp (Meta Cloud API)"
    check_token
    
    phone_number="${1:-+228XXXXXXXX}"
    language="${2:-fr}"
    
    print_info "Envoi WhatsApp de test à $phone_number (langue: $language)"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/whatsapp/test-send" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"phoneNumber\":\"$phone_number\",\"language\":\"$language\"}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "WhatsApp envoyé avec succès"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "Échec d'envoi WhatsApp (HTTP $http_code)"
        echo "$body"
    fi
}

test_kyc_cron() {
    print_header "Test CRON KYC (Rappels automatiques)"
    check_token
    
    print_info "Déclenchement manuel du CRON..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/kyc/cron/test-reminders" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "CRON KYC exécuté avec succès"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        print_info "Vérifiez les logs du backend pour plus de détails"
    else
        print_error "Échec d'exécution du CRON (HTTP $http_code)"
        echo "$body"
    fi
}

test_all() {
    print_header "🧪 Test de tous les services"
    
    test_brevo
    sleep 2
    
    test_sms
    sleep 2
    
    test_whatsapp
    sleep 2
    
    test_kyc_cron
    
    print_header "✅ Tests terminés"
}

check_services() {
    print_header "Vérification des services"
    
    # Vérifier PostgreSQL
    print_info "PostgreSQL..."
    if docker ps | grep -q "tradelink-postgres"; then
        print_success "PostgreSQL est démarré"
    else
        print_error "PostgreSQL n'est pas démarré"
        echo "  Lancez: docker-compose up -d postgres"
    fi
    
    # Vérifier Redis
    print_info "Redis..."
    if docker ps | grep -q "tradelink-redis"; then
        print_success "Redis est démarré"
    else
        print_error "Redis n'est pas démarré"
        echo "  Lancez: docker-compose up -d redis"
    fi
    
    # Vérifier Backend
    print_info "Backend API..."
    if curl -s "$API_URL" > /dev/null 2>&1; then
        print_success "Backend API est accessible"
    else
        print_error "Backend API n'est pas accessible"
        echo "  Lancez: cd apps/api && pnpm dev"
    fi
}

show_help() {
    cat << EOF
🧪 Script de test des services TradeLink

Usage:
  ./test-services.sh [command] [options]

Commands:
  all               Tester tous les services
  brevo             Tester la connexion Brevo (Email)
  sms [phone]       Tester l'envoi SMS (défaut: +228XXXXXXXX)
  whatsapp [phone]  Tester l'envoi WhatsApp (défaut: +228XXXXXXXX)
  cron              Tester le CRON KYC
  check             Vérifier l'état des services
  help              Afficher cette aide

Options SMS/WhatsApp:
  [phone]    Numéro de téléphone (format: +228XXXXXXXX)
  [language] Langue (fr, en, ar) - défaut: fr

Variables d'environnement:
  ADMIN_TOKEN   Token d'authentification Admin (requis)
  API_URL       URL de l'API (défaut: http://localhost:3000/api)

Exemples:
  # Tester tous les services
  ./test-services.sh all
  
  # Tester Brevo uniquement
  ./test-services.sh brevo
  
  # Tester SMS avec un numéro spécifique
  ./test-services.sh sms +228XXXXXXXX fr
  
  # Vérifier l'état des services
  ./test-services.sh check

Configuration requise:
  1. Exporter le token Admin:
     export ADMIN_TOKEN="your-token-here"
  
  2. Démarrer les services:
     docker-compose up -d
     cd apps/api && pnpm dev

EOF
}

# Main
case "${1:-help}" in
    all)
        test_all
        ;;
    brevo)
        test_brevo
        ;;
    sms)
        test_sms "$2" "$3"
        ;;
    whatsapp)
        test_whatsapp "$2" "$3"
        ;;
    cron)
        test_kyc_cron
        ;;
    check)
        check_services
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Commande inconnue: $1"
        echo "Utilisez './test-services.sh help' pour l'aide"
        exit 1
        ;;
esac
