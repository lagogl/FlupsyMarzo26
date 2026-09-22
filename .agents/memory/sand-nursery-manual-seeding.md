---
name: Semina manuale Sand Nursery
description: Regola funzionale per l'allocazione mensile del T3 tra Forecast e Sand Nursery.
---

Il T3 non usato dal Forecast mensile deve restare nel pool Forecast e continuare a maturare nei mesi successivi. La Sand Nursery consuma esclusivamente la quantità mensile inserita manualmente dall'utente, con valore predefinito zero; la quantità applicata non può superare il residuo disponibile dopo il Forecast.

**Why:** Azzerare automaticamente tutto il residuo T3 lo rendeva indisponibile nei mesi successivi e sottostimava la copertura Forecast futura.

**How to apply:** Assegnare prima il Forecast mensile, poi sottrarre la semina manuale limitata al residuo. Non modificare il percorso separato degli ordini né la regola che considera utili al Forecast gli animali con animali/kg ≤ 29.999.