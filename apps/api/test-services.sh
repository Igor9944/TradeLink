#!/bin/bash

# Script de test des services de communication
# Usage: ./test-services.sh [check|brevo|sms|whatsapp|all]

API_URL="http://localhost:3001/api"

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Vérifier si le token est défini
check_token() {
    if [ -z "$ADMIN_TOKEN" ]; then
        log_error "ADMIN_TOKEN n'est pas défini"
        echo ""
        echo "Connectez-vous avec admin@test.com et le mot de passe local SEED_USER_PASSWORD,"
        echo "puis définissez ADMIN_TOKEN avec le access_token de la réponse."
        echo ""
        return 1
    fi
    log_success "Token d'authentification trouvé"
    return 0
}

# Vérifier la configuration
check_config() {
    log_info "Vérification de la configuration..."
    
    # Vérifier si le backend est accessible
    if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
        log_success "Backend accessible sur $API_URL"
    else
        log_error "Backend non accessible sur $API_URL"
        return 1
    fi
    
    # Vérifier si jq est installé
    if ! command -v jq &> /dev/null; then
        log_warning "jq n'est pas installé (recommandé pour parser JSON)"
        echo "  Installation: sudo apt-get install jq"
    else
        log_success "jq est installé"
    fi
    
    return 0
}

# Test du service Brevo (Email)
test_brevo() {
    log_info "Test du service Brevo (Email)..."
    
    if ! check_token; then
        return 1
    fi
    
    RESPONSE=$(curl -s -X POST "$API_URL/emails/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "to": "test@example.com",
            "toName": "Test User",
            "template": "welcome",
            "lang": "fr",
            "params": {
                "firstName": "Test",
                "lastName": "User"
            }
        }')
    
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q "success\|messageId\|MOCK"; then
        log_success "Service Brevo : OK (Mode MOCK)"
        return 0
    else
        log_error "Service Brevo : Échec"
        return 1
    fi
}

# Test du service SMS (Africa's Talking)
test_sms() {
    log_info "Test du service SMS (Africa's Talking)..."
    
    if ! check_token; then
        return 1
    fi
    
    RESPONSE=$(curl -s -X POST "$API_URL/sms/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "to": "+21600000001",
            "message": "Test SMS TradeLink: Votre code de vérification est 123456"
        }')
    
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q "success\|messageId\|MOCK"; then
        log_success "Service SMS : OK"
        return 0
    else
        log_error "Service SMS : Échec"
        return 1
    fi
}

# Test du service WhatsApp
test_whatsapp() {
    log_info "Test du service WhatsApp (Cloud API)..."
    
    if ! check_token; then
        return 1
    fi
    
    RESPONSE=$(curl -s -X POST "$API_URL/whatsapp/send" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d '{
            "to": "+21600000001",
            "message": "Test WhatsApp TradeLink: Votre commande #CMD-2026-00001 a été confirmée"
        }')
    
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    
    if echo "$RESPONSE" | grep -q "success\|messageId\|wamid"; then
        log_success "Service WhatsApp : OK"
        return 0
    else
        log_error "Service WhatsApp : Échec (attendu si non configuré)"
        log_warning "Configuration WhatsApp nécessaire - voir solution à la fin"
        return 1
    fi
}

# Test de tous les services
test_all() {
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  TEST DES SERVICES DE COMMUNICATION - TRADELINK"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    
    FAILED=0
    
    test_brevo || FAILED=$((FAILED + 1))
    echo ""
    
    test_sms || FAILED=$((FAILED + 1))
    echo ""
    
    test_whatsapp || FAILED=$((FAILED + 1))
    echo ""
    
    echo "════════════════════════════════════════════════════════════"
    if [ $FAILED -eq 0 ]; then
        log_success "Tous les tests sont passés !"
    else
        log_warning "$FAILED service(s) en échec"
    fi
    echo "════════════════════════════════════════════════════════════"
    echo ""
}

# Menu principal
case "$1" in
    check)
        check_config
        ;;
    brevo|email)
        test_brevo
        ;;
    sms)
        test_sms
        ;;
    whatsapp)
        test_whatsapp
        ;;
    all|"")
        check_config
        test_all
        ;;
    *)
        echo "Usage: $0 [check|brevo|sms|whatsapp|all]"
        echo ""
        echo "Commandes disponibles:"
        echo "  check     - Vérifier la configuration"
        echo "  brevo     - Tester le service Brevo (Email)"
        echo "  sms       - Tester le service SMS (Africa's Talking)"
        echo "  whatsapp  - Tester le service WhatsApp"
        echo "  all       - Tester tous les services (défaut)"
        exit 1
        ;;
esac
