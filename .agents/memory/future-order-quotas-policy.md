---
name: Quote ordini future senza recupero
description: Vincolo commerciale comune per Scostamenti e Disponibilità commerciale.
---

L'utente non vuole considerare gli ordini non consegnati o parzialmente consegnati nel passato, ma solo le quote da consegnare nel futuro. Le quote scadute non devono diventare arretrati da recuperare né essere redistribuite sui mesi successivi.

**Why:** L'utente dichiara che non è attuabile la politica commerciale del recupero delle consegne.

**How to apply:** Scostamenti e Disponibilità commerciale devono usare lo stesso calendario delle quote ancora valide, distinto dal residuo storico complessivo. Non escludere tutte le quote di un ordine solo perché iniziato in passato. Una scadenza precisa trascorsa si esclude; una quota mensile senza giorno preciso resta valida fino a fine mese, senza riduzione proporzionale ai giorni trascorsi. Conservare le quote originarie dei periodi futuri e sottrarre soltanto le consegne attribuibili al periodo; attribuzioni ambigue devono essere segnalate. Non cancellare lo storico delle consegne. Questa regola supera le precedenti convenzioni di riporto degli scoperti ordini, ma non modifica gli impegni produttivi Forecast o Sand Nursery.