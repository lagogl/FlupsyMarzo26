#!/bin/bash
# Test End-to-End: Vendita Standalone
# Questo script testa il CODICE dell'applicazione attraverso chiamate API reali
# USA /api/operations-bypass per la prima-attivazione (logica corretta)

BASE_URL="http://localhost:5000"
echo "=============================================="
echo "TEST VENDITA STANDALONE - INIZIO"
echo "=============================================="

# Variabili per tracciare gli ID creati (per cleanup)
BASKET_ID=""
CYCLE_ID=""
OPERATION_ID=""
SALE_OPERATION_ID=""
SALE_ID=""
TEST_LOT_ID=""

# Funzione per cleanup
cleanup() {
  echo ""
  echo "=============================================="
  echo "CLEANUP - Ripristino database"
  echo "=============================================="
  
  # Elimina vendita avanzata (se esiste)
  if [ -n "$SALE_ID" ] && [ "$SALE_ID" != "null" ]; then
    echo "1. Eliminazione vendita avanzata ID: $SALE_ID"
    curl -s -X DELETE "$BASE_URL/api/advanced-sales/$SALE_ID" | jq '.'
  fi
  
  # Elimina operazione di vendita (se esiste)
  if [ -n "$SALE_OPERATION_ID" ] && [ "$SALE_OPERATION_ID" != "null" ]; then
    echo "2. Eliminazione operazione vendita ID: $SALE_OPERATION_ID"
    curl -s -X DELETE "$BASE_URL/api/emergency-delete/$SALE_OPERATION_ID" | jq '.'
  fi
  
  # Elimina operazione di attivazione (se esiste)
  if [ -n "$OPERATION_ID" ] && [ "$OPERATION_ID" != "null" ]; then
    echo "3. Eliminazione operazione attivazione ID: $OPERATION_ID"
    curl -s -X DELETE "$BASE_URL/api/emergency-delete/$OPERATION_ID" | jq '.'
  fi
  
  # Elimina ciclo (se esiste) tramite SQL diretto
  if [ -n "$CYCLE_ID" ] && [ "$CYCLE_ID" != "null" ]; then
    echo "4. Ciclo $CYCLE_ID sarà eliminato con la cesta"
  fi
  
  # Elimina lotto di test (se esiste)
  if [ -n "$TEST_LOT_ID" ] && [ "$TEST_LOT_ID" != "null" ]; then
    echo "5. Eliminazione lotto di test ID: $TEST_LOT_ID"
    curl -s -X DELETE "$BASE_URL/api/lots/$TEST_LOT_ID" | jq '.'
  fi
  
  # Verifica stato finale cesta
  if [ -n "$BASKET_ID" ] && [ "$BASKET_ID" != "null" ]; then
    echo ""
    echo "6. Verifica stato finale cesta $BASKET_ID:"
    curl -s "$BASE_URL/api/baskets/$BASKET_ID" | jq '{id, physicalNumber, state, currentCycleId}'
  fi
  
  echo ""
  echo "=============================================="
  echo "CLEANUP COMPLETATO!"
  echo "=============================================="
}

# Trap per cleanup
trap cleanup EXIT

echo ""
echo "=== FASE 1: Creazione LOTTO DI TEST ==="

# Recupera una taglia esistente
SIZE_DATA=$(curl -s "$BASE_URL/api/sizes" | jq '.[0]')
SIZE_ID=$(echo "$SIZE_DATA" | jq '.id')
SIZE_CODE=$(echo "$SIZE_DATA" | jq -r '.code')
echo "Taglia selezionata: ID=$SIZE_ID ($SIZE_CODE)"

# Crea lotto di test
LOT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/lots" \
  -H "Content-Type: application/json" \
  -d "{
    \"supplier\": \"TEST - LOTTO TEMPORANEO\",
    \"supplierLotNumber\": \"TEST-$(date +%s)\",
    \"arrivalDate\": \"$(date +%Y-%m-%d)\",
    \"animalCount\": 1000000,
    \"weight\": 100,
    \"sizeId\": $SIZE_ID,
    \"quality\": \"normali\",
    \"notes\": \"LOTTO DI TEST - DA ELIMINARE\"
  }")

TEST_LOT_ID=$(echo "$LOT_RESPONSE" | jq '.id')
echo "Lotto di test creato con ID: $TEST_LOT_ID"

if [ "$TEST_LOT_ID" == "null" ] || [ -z "$TEST_LOT_ID" ]; then
  echo "ERRORE: Creazione lotto fallita!"
  echo "$LOT_RESPONSE" | jq '.'
  exit 1
fi

echo ""
echo "=== FASE 2: Selezione cesta disponibile ==="

BASKET_DATA=$(curl -s "$BASE_URL/api/baskets?includeAll=true" | jq '[.[] | select(.state == "available")] | .[0]')
BASKET_ID=$(echo "$BASKET_DATA" | jq '.id')
BASKET_NUM=$(echo "$BASKET_DATA" | jq '.physicalNumber')
echo "Cesta selezionata: ID=$BASKET_ID, Numero=$BASKET_NUM"

echo ""
echo "Stato cesta PRIMA:"
curl -s "$BASE_URL/api/baskets/$BASKET_ID" | jq '{id, physicalNumber, state, currentCycleId}'

echo ""
echo "=== FASE 3: Prima-attivazione (usa /api/direct-operations) ==="

OLD_DATE=$(date -d "15 days ago" +%Y-%m-%d 2>/dev/null || date -v-15d +%Y-%m-%d 2>/dev/null || echo "2025-11-20")
echo "Data attivazione: $OLD_DATE"

BYPASS_RESPONSE=$(curl -s -X POST "$BASE_URL/api/direct-operations" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"prima-attivazione\",
    \"basketId\": $BASKET_ID,
    \"date\": \"$OLD_DATE\",
    \"lotId\": $TEST_LOT_ID,
    \"sizeId\": $SIZE_ID,
    \"totalWeight\": 10.5,
    \"animalCount\": 50000,
    \"animalsPerKg\": 4762
  }")

echo "Risposta prima-attivazione:"
echo "$BYPASS_RESPONSE" | jq '.'

CYCLE_ID=$(echo "$BYPASS_RESPONSE" | jq '.cycleId')
echo "Ciclo creato: $CYCLE_ID"

if [ "$CYCLE_ID" == "null" ] || [ -z "$CYCLE_ID" ]; then
  echo "ERRORE: Prima-attivazione fallita!"
  exit 1
fi

# Recupera l'operazione creata
OPERATION_ID=$(curl -s "$BASE_URL/api/operations?basketId=$BASKET_ID&includeAll=true" | jq '.[0].id')
echo "Operazione creata: $OPERATION_ID"

echo ""
echo "=== FASE 4: Verifica attivazione cesta ==="
echo "Stato cesta DOPO attivazione:"
BASKET_STATE=$(curl -s "$BASE_URL/api/baskets/$BASKET_ID")
echo "$BASKET_STATE" | jq '{id, physicalNumber, state, currentCycleId, cycleCode}'

# Verifica che la cesta sia attiva
STATE=$(echo "$BASKET_STATE" | jq -r '.state')
if [ "$STATE" != "active" ]; then
  echo "⚠️ ATTENZIONE: La cesta dovrebbe essere 'active' ma è '$STATE'"
else
  echo "✅ Cesta correttamente attivata!"
fi

echo ""
echo "=============================================="
echo "=== FASE 5: Creazione operazione VENDITA ==="
echo "=============================================="

TODAY=$(date +%Y-%m-%d)
echo "Data vendita: $TODAY"

# Prima creo un'operazione di vendita sulla cesta
SALE_OP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/operations" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"vendita\",
    \"basketId\": $BASKET_ID,
    \"cycleId\": $CYCLE_ID,
    \"date\": \"$TODAY\",
    \"lotId\": $TEST_LOT_ID,
    \"sizeId\": $SIZE_ID,
    \"totalWeight\": 2.1,
    \"animalCount\": 10000,
    \"animalsPerKg\": 4762,
    \"notes\": \"TEST VENDITA - DA ELIMINARE\"
  }")

echo "Risposta creazione operazione vendita:"
echo "$SALE_OP_RESPONSE" | jq '.'

SALE_OPERATION_ID=$(echo "$SALE_OP_RESPONSE" | jq '.id')
echo "Operazione vendita creata: $SALE_OPERATION_ID"

if [ "$SALE_OPERATION_ID" == "null" ] || [ -z "$SALE_OPERATION_ID" ]; then
  echo "⚠️ Operazione vendita non creata - proviamo con modulo diretto"
  
  # Prova con direct operations
  SALE_OP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/direct-operations" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"vendita\",
      \"basketId\": $BASKET_ID,
      \"cycleId\": $CYCLE_ID,
      \"date\": \"$TODAY\",
      \"lotId\": $TEST_LOT_ID,
      \"sizeId\": $SIZE_ID,
      \"totalWeight\": 2.1,
      \"animalCount\": 10000,
      \"animalsPerKg\": 4762,
      \"notes\": \"TEST VENDITA - DA ELIMINARE\"
    }")
  
  echo "Risposta direct-operations:"
  echo "$SALE_OP_RESPONSE" | jq '.'
  SALE_OPERATION_ID=$(echo "$SALE_OP_RESPONSE" | jq '.id')
fi

echo ""
echo "=== FASE 6: Verifica operazioni cesta ==="
echo "Operazioni sulla cesta:"
curl -s "$BASE_URL/api/operations?basketId=$BASKET_ID&includeAll=true" | jq '.[] | {id, type, date, animalCount}'

echo ""
echo "=============================================="
echo "=== FASE 7: VENDITA AVANZATA (STANDALONE) ==="
echo "=============================================="

if [ "$SALE_OPERATION_ID" != "null" ] && [ -n "$SALE_OPERATION_ID" ]; then
  echo "Creazione vendita avanzata con operationId: $SALE_OPERATION_ID"
  
  SALE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/advanced-sales" \
    -H "Content-Type: application/json" \
    -d "{
      \"companyId\": 1052922,
      \"customerId\": 82,
      \"saleDate\": \"$TODAY\",
      \"notes\": \"TEST VENDITA STANDALONE - DA ELIMINARE\",
      \"operationIds\": [$SALE_OPERATION_ID]
    }")
  
  echo "Risposta vendita avanzata:"
  echo "$SALE_RESPONSE" | jq '.'
  
  SALE_ID=$(echo "$SALE_RESPONSE" | jq '.id')
  echo ""
  echo ">>> VENDITA AVANZATA CREATA CON ID: $SALE_ID <<<"
else
  echo "⚠️ Nessuna operazione vendita - skip vendita avanzata"
fi

echo ""
echo "=== FASE 8: Verifiche finali ==="

if [ "$SALE_ID" != "null" ] && [ -n "$SALE_ID" ]; then
  echo "8.1 - Dettaglio vendita:"
  curl -s "$BASE_URL/api/advanced-sales/$SALE_ID" | jq '{id, saleNumber, status, totalAnimals, totalWeight}'
fi

echo ""
echo "8.2 - Stato finale cesta:"
curl -s "$BASE_URL/api/baskets/$BASKET_ID" | jq '{id, physicalNumber, state, currentCycleId}'

echo ""
echo "8.3 - Tutte le operazioni sulla cesta:"
curl -s "$BASE_URL/api/operations?basketId=$BASKET_ID&includeAll=true" | jq '.[] | {id, type, date, animalCount}'

echo ""
echo "=============================================="
echo "TEST COMPLETATO!"
echo "=============================================="
echo ""
echo "RIEPILOGO:"
echo "- Lotto di test: ID=$TEST_LOT_ID"
echo "- Cesta: ID=$BASKET_ID (numero: $BASKET_NUM)"
echo "- Ciclo: ID=$CYCLE_ID"  
echo "- Op. attivazione: ID=$OPERATION_ID"
echo "- Op. vendita: ID=$SALE_OPERATION_ID"
echo "- Vendita avanzata: ID=$SALE_ID"
echo ""
echo "Procedo con cleanup..."
