---
name: Prodotti FIC per taglia
description: Regola duratura per associare le taglie APP ai cataloghi documentali esterni.
---

La tabella taglie dell’app resta la fonte della classificazione commerciale; l’identità fiscale dell’articolo è un mapping separato per azienda e provider (FIC/FCloud).

**Why:** i codici APP (`TP-3000`) e FIC (`TPH3000`) possono differire e una descrizione libera nel DDT non consente a FIC di riconoscere il prodotto.

**How to apply:** importare il catalogo senza prezzi, associare esplicitamente ogni taglia, congelare ID/codice/nome sulla riga DDT alla generazione e non sovrascriverli al reinvio. L’invio FIC deve fallire se una riga prodotto non ha mapping; i subtotali non sono righe prodotto.