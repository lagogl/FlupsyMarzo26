---
name: Residui schiuditoio e data convenzionale
description: Significato biologico del residuo mensile non ancora rappresentato dall'inventario.
---

Gli ingressi virtuali residui del mese corrente restano TP-300 anche quando la data di riferimento è successiva al 15. Il 15 è una data convenzionale di ingresso, non la prova di un arrivo realmente avvenuto: non ricostruire crescita o mortalità tra il 15 e lo snapshot.

**Why:** Gli animali realmente arrivati sono già nell'inventario misurato; la quota residua è ancora una previsione. Attribuirle crescita pregressa trasformerebbe un'ipotesi commerciale in una disponibilità biologica non osservata e potrebbe anticipare erroneamente la copertura degli ordini.

**How to apply:** Sottrarre dalla previsione mensile le quantità originarie dei lotti arrivati entro la data di riferimento, non i sopravvissuti. Per la quota virtuale, modellare solo giorni successivi sia al 15 sia allo snapshot; negli scenari con consegne giornaliere renderla disponibile dal 15, oppure dal giorno dello snapshot se successivo.

Le verifiche sulla sopravvivenza degli scenari devono collegare il generatore di traiettorie al replay attraverso almeno due cambi di mese, includendo una consegna il primo giorno.

**Why:** Test separati di traiettorie corrette e replay con coorti sintetiche non rilevano un disaccordo tra baseline mensile e snapshot giornaliero: può saltare la mortalità del primo giorno e certificare disponibilità inesistenti.

**How to apply:** Confrontare gli animali residui del replay con la sopravvivenza cumulativa attesa dalla data di ingresso; usare anche un tasso elevato controllato per rendere evidente ogni giorno omesso, preservando le convenzioni diverse di inventario misurato e arrivi virtuali.