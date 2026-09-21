---
name: DDT arretrati tra FCloud e FIC
description: Eccezione stretta per trasmettere a FIC un DDT prenotato prima ma rifiutato da FCloud per data anteriore.
---

## Regola

Un errore FCloud per data DDT anteriore all’ultimo documento emesso può non bloccare l’invio a FIC soltanto quando il DDT possiede già un numero locale prenotato inferiore a un altro numero della stessa azienda e dello stesso anno.

**Why:** Un DDT preparato in precedenza può essere trasmesso dopo un documento più recente. Il suo numero prova che apparteneva già alla sequenza, mentre consentire la stessa deroga all’ultimo numero permetterebbe una retrodatazione nuova e non giustificata.

**How to apply:** Riconoscere solo lo specifico rifiuto HTTP 400 di FCloud per ordine delle date; confrontare i numeri sotto il lock della sequenza azienda/anno. Qualsiasi altro errore FCloud, un numero uguale o successivo e un numero non valido devono bloccare. FIC resta definitivo e lo stato `inviato` si assegna solo dopo la sua risposta valida.