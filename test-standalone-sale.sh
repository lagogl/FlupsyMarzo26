#!/bin/bash
# Test End-to-End: Vendita Standalone
# Questo script testa il CODICE dell'applicazione attraverso chiamate API reali

BASE_URL="http://localhost:5000"
echo "=============================================="
echo "TEST VENDITA STANDALONE - INIZIO"
echo "=============================================="

# Variabili per tracciare gli ID creati (per cleanup)
BASKET_ID=""
CYCLE_ID=""
OPERATION_ID=""
SALE_ID=""

# Funzione per cleanup
cleanup() {
  echo ""
  echo "=============================================="
  echo "CLEANUP - Ripristino database"
  echo "=============================================="
  
  # Elimina vendita avanzata (se esiste)
  if [ -n "$SALE_ID" ]; then
    echo "Eliminazione vendita avanzata ID: $SALE_ID"
    curl -s -X DELETE "$BASE_URL/api/advanced-sales/$SALE_ID" | jq '.'
  fi
  
  # Elimina operazione (se esiste)
  if [ -n "$OPERATION_ID" ]; then
    echo "Eliminazione operazione ID: $OPERATION_ID"
    curl -s -X DELETE "$BASE_URL/api/emergency-delete/$OPERATION_ID" | jq '.'
  fi
  
  # Elimina ciclo (se esiste)
  if [ -n "$CYCLE_ID" ]; then
    echo "Eliminazione ciclo ID: $CYCLE_ID"
    curl -s -X DELETE "$BASE_URL/api/cycles/$CYCLE_ID" | jq '.'
  fi
  
  # Elimina cesta (se esiste)
  if [ -n "$BASKET_ID" ]; then
    echo "Eliminazione cesta ID: $BASKET_ID"
    curl -s -X DELETE "$BASE_URL/api/baskets/$BASKET_ID" | jq '.'
  fi
  
  echo ""
  echo "Cleanup completato!"
}

# Trap per cleanup in caso di errore
trap cleanup EXIT

echo ""
echo "=== FASE 1: Recupero dati esistenti ==="

# Recupera un FLUPSY esistente
FLUPSY_ID=$(curl -s "$BASE_URL/api/flupsys" | jq '.[0].id')
echo "FLUPSY ID selezionato: $FLUPSY_ID"

# Recupera un Lotto esistente
LOT_ID=$(curl -s "$BASE_URL/api/lots" | jq '.[0].id')
LOT_ANIMAL_COUNT=$(curl -s "$BASE_URL/api/lots" | jq '.[0].animalCount')
echo "Lotto ID selezionato: $LOT_ID (animali: $LOT_ANIMAL_COUNT)"

# Recupera una taglia esistente
SIZE_ID=$(curl -s "$BASE_URL/api/sizes" | jq '.[0].id')
SIZE_CODE=$(curl -s "$BASE_URL/api/sizes" | jq -r '.[0].code')
echo "Taglia ID selezionata: $SIZE_ID ($SIZE_CODE)"

echo ""
echo "=== FASE 2: Creazione cesta di test ==="

# Crea una nuova cesta con numero fisico alto per evitare conflitti
BASKET_RESPONSE=$(curl -s -X POST "$BASE_URL/api/baskets" \
  -H "Content-Type: application/json" \
  -d "{
    \"flupsyId\": $FLUPSY_ID,
    \"physicalNumber\": 999,
    \"row\": \"TEST\",
    \"position\": 1
  }")

echo "Risposta creazione cesta:"
echo "$BASKET_RESPONSE" | jq '.'

BASKET_ID=$(echo "$BASKET_RESPONSE" | jq '.id')
echo "Cesta creata con ID: $BASKET_ID"

if [ "$BASKET_ID" == "null" ] || [ -z "$BASKET_ID" ]; then
  echo "ERRORE: Creazione cesta fallita!"
  exit 1
fi

echo ""
echo "=== FASE 3: Creazione ciclo con data vecchia ==="

# Data di 15 giorni fa
OLD_DATE=$(date -d "15 days ago" +%Y-%m-%d 2>/dev/null || date -v-15d +%Y-%m-%d)
echo "Data ciclo: $OLD_DATE"

CYCLE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/cycles" \
  -H "Content-Type: application/json" \
  -d "{
    \"basketId\": $BASKET_ID,
    \"lotId\": $LOT_ID,
    \"startDate\": \"$OLD_DATE\"
  }")

echo "Risposta creazione ciclo:"
echo "$CYCLE_RESPONSE" | jq '.'

CYCLE_ID=$(echo "$CYCLE_RESPONSE" | jq '.id')
echo "Ciclo creato con ID: $CYCLE_ID"

if [ "$CYCLE_ID" == "null" ] || [ -z "$CYCLE_ID" ]; then
  echo "ERRORE: Creazione ciclo fallita!"
  exit 1
fi

echo ""
echo "=== FASE 4: Registrazione operazione di attivazione ==="

OPERATION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/operations" \
  -H "Content-Type: application/json" \
  -d "{
    \"basketId\": $BASKET_ID,
    \"cycleId\": $CYCLE_ID,
    \"type\": \"prima-attivazione\",
    \"date\": \"$OLD_DATE\",
    \"lotId\": $LOT_ID,
    \"sizeId\": $SIZE_ID,
    \"totalWeight\": 10.5,
    \"animalCount\": 50000,
    \"animalsPerKg\": 4762
  }")

echo "Risposta creazione operazione:"
echo "$OPERATION_RESPONSE" | jq '.'

OPERATION_ID=$(echo "$OPERATION_RESPONSE" | jq '.id')
echo "Operazione creata con ID: $OPERATION_ID"

if [ "$OPERATION_ID" == "null" ] || [ -z "$OPERATION_ID" ]; then
  echo "ERRORE: Creazione operazione fallita!"
  exit 1
fi

echo ""
echo "=== FASE 5: Verifica stato cesta dopo attivazione ==="

BASKET_STATE=$(curl -s "$BASE_URL/api/baskets/$BASKET_ID")
echo "Stato cesta dopo attivazione:"
echo "$BASKET_STATE" | jq '{id, physicalNumber, state, currentCycleId, cycleCode}'

echo ""
echo "=== FASE 6: Esecuzione VENDITA STANDALONE ==="

TODAY=$(date +%Y-%m-%d)
echo "Data vendita: $TODAY"

# Vendita standalone - questo è il test principale!
SALE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/advanced-sales" \
  -H "Content-Type: application/json" \
  -d "{
    \"companyId\": 1052922,
    \"customerId\": 82,
    \"saleDate\": \"$TODAY\",
    \"notes\": \"TEST VENDITA STANDALONE - DA ELIMINARE\",
    \"items\": [{
      \"basketId\": $BASKET_ID,
      \"sizeId\": $SIZE_ID,
      \"animalCount\": 10000,
      \"weight\": 2.1,
      \"pricePerKg\": 15.00
    }]
  }")

echo "Risposta vendita standalone:"
echo "$SALE_RESPONSE" | jq '.'

SALE_ID=$(echo "$SALE_RESPONSE" | jq '.id')
echo "Vendita creata con ID: $SALE_ID"

echo ""
echo "=== FASE 7: Verifiche post-vendita ==="

# Verifica lot_ledger
echo ""
echo "7.1 - Verifica lot_ledger (tracciabilità inventario):"
curl -s "$BASE_URL/api/lots/$LOT_ID" | jq '{id, animalCount, totalMortality}'

# Verifica stato cesta
echo ""
echo "7.2 - Verifica stato cesta dopo vendita:"
curl -s "$BASE_URL/api/baskets/$BASKET_ID" | jq '{id, physicalNumber, state, currentCycleId}'

# Verifica operazioni sulla cesta
echo ""
echo "7.3 - Verifica operazioni sulla cesta (dovrebbe includere vendita):"
curl -s "$BASE_URL/api/operations?basketId=$BASKET_ID" | jq '.[] | {id, type, date, animalCount}'

# Verifica dettaglio vendita
if [ "$SALE_ID" != "null" ] && [ -n "$SALE_ID" ]; then
  echo ""
  echo "7.4 - Dettaglio vendita avanzata:"
  curl -s "$BASE_URL/api/advanced-sales/$SALE_ID" | jq '.'
fi

echo ""
echo "=============================================="
echo "TEST COMPLETATO - Risultati:"
echo "=============================================="
echo "- Cesta ID: $BASKET_ID"
echo "- Ciclo ID: $CYCLE_ID"  
echo "- Operazione attivazione ID: $OPERATION_ID"
echo "- Vendita standalone ID: $SALE_ID"
echo ""
echo "Il cleanup verrà eseguito automaticamente..."
echo ""

# Il cleanup viene eseguito dal trap EXIT
