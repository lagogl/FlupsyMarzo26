---
name: Copertura mensile e scadenze ordini
description: Distinzione tra capacità a fine mese e disponibilità alla consegna nelle proiezioni.
---

La capacità mensile e la verifica alla scadenza sono simulazioni alternative, non quantità da sommare. La verifica puntuale riserva un unico stock nel calendario giornaliero; il soddisfacimento tardivo resta separato dal numeratore delle consegne puntuali.

**Why:** La crescita applicata fino a fine mese può rendere vendibile una coorte che non era idonea il giorno richiesto. Sostituire il percorso mensile altererebbe confronti esistenti e il Forecast, invece di chiarire questa differenza.

**How to apply:** Conservare indipendenti i registri mensile, scadenze e Forecast. Per un periodo di consegna usare l'inizio come verifica conservativa, poi la data legacy o la fine se l'inizio manca. Non inventare date per ordini non datati né disponibilità storica per scadenze anteriori alla fotografia live. Attraversare anche le scadenze e gli ingressi tra fotografia e orizzonte visibile.

## Leggibilità per gli operatori

Negli interventi di leggibilità mantenere distinti inventario biologico, assegnazioni agli ordini correnti, recupero degli arretrati e scenario Forecast. Non modificare i calcoli per far coincidere aggregati che rappresentano popolazioni diverse.

**Why:** L'operatore interpretava la disponibilità target come tutto l'inventario e le taglie iniziali come taglie future; le spiegazioni testuali ripetute non bastavano a chiarire perché ordini di taglie inferiori potessero essere coperti separatamente. Ha approvato una presentazione separata, senza variazioni ai risultati.

**How to apply:** Rendere visibili tutte le taglie ordinate, la provenienza fisica delle assegnazioni e il momento della disponibilità. Riportare le stesse distinzioni anche nelle copie ed esportazioni. Un ingresso non maturabile entro fine mese non è una promessa alla scadenza esatta, e una raccomandazione nulla non prova l'assenza di scoperti.

La normalizzazione dell'identità taglia non deve dipendere dalla disponibilità di un range alla fotografia corrente. Una taglia futura rimane una richiesta; il suo range fisico va cercato alla scadenza. Una taglia sconosciuta deve risultare esplicitamente scoperta, mai sparire dal denominatore.

**Why:** Filtrare sul catalogo attivo oggi eliminava ordini validi per taglie con validità futura e gonfiava la copertura della domanda restante.

**How to apply:** Separare normalizzazione dell'identità e lookup temporale della capacità, anche nelle letture aggregate ed esportazioni.