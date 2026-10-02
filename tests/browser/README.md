# Controllo browser Proiezione Crescita

Eseguire dalla radice del progetto:

```sh
npm run test:browser:projection
```

Non serve avviare `npm run dev`, configurare credenziali o collegare un database.
Il test avvia solo Vite su una porta libera, apre l'applicazione reale con Puppeteer
e Chromium già disponibile e intercetta le API nel browser. L'autenticazione
applicativa resta intatta: `/api/users/current` riceve una risposta anonima di test.
Qualsiasi API non prevista o tentativo di scrittura fa fallire il controllo;
le richieste esterne (meteo, font, analytics) vengono bloccate.

La fixture contiene due mesi: uno completo con quantità riconoscibili e uno privo
dei dettagli di disponibilità/copertura. Il controllo verifica:

- ordini correnti, arretrati e arretrati senza nuova richiesta;
- classi biologiche esclusive, separate dalle quantità delle coorti iniziali;
- assegnazioni da target/superiori e inferiori;
- deficit non maturabile, anche con arrivo suggerito pari a zero;
- capacità a fine mese distinta dalla copertura alle scadenze;
- Forecast alternativo e non additivo;
- valori mancanti indisponibili, non trasformati in zeri;
- italiano e inglese, mesi in colonne e mesi in righe.
- selezione con clic di singole celle, intervalli con Shift, righe e colonne;
- copia della selezione con Ctrl+C e Cmd+C, senza intestazioni e con valori grezzi;
- righe nascoste escluse dagli intervalli e dalla copia di righe/colonne;
- rotazione che azzera celle, righe, colonne e ancora Shift, senza riscrivere
  la clipboard fino a una nuova selezione;
- associazione mese/indicatore conservata dopo la rotazione, anche per zeri,
  valori mancanti e testi.

Si leggono i valori renderizzati, la clipboard reale e quattro file XLSX realmente
scaricati e riaperti con ExcelJS. Le quantità e gli stati attesi sono indipendenti
dalle funzioni di presentazione; ogni riga copiata viene confrontata con l'Excel.
La tabella mantiene il proprio formato numerico italiano anche in inglese,
mentre il riepilogo usa la lingua selezionata. Gli zeri della tabella sono resi
come `-`, distinguendoli dai messaggi di indisponibilità.

Browser, server di test e cartella temporanea dei download vengono chiusi/rimossi
anche in caso di errore. Il comando restituisce un exit code diverso da zero
quando un'asserzione fallisce ed è registrato come verifica `projection-browser`.