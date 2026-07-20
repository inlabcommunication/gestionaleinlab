# InLab — Agenzia di comunicazione

App interna per la gestione clienti (schede, piano editoriale, avvisi) e il calendario
condiviso del team (Giusi, Ilaria, Nico + vista generale).

## Struttura del progetto

```
src/
  main.jsx              punto di ingresso
  App.jsx               login anonimo, caricamento/salvataggio dati, navigazione
  firebase.js           inizializzazione Firebase (auth + Firestore)
  styles.css            stile globale dell'app
  lib/
    constants.js        costanti condivise (config default, colori, membri)
    helpers.js           funzioni pure (date, avvisi, dati di esempio, calendario)
    storage.js           lettura/scrittura su Firestore
  components/
    TopBar.jsx            barra di navigazione in alto
    ClientiSection.jsx     sezione "Clienti" (elenco + dettaglio)
    ClientDetail.jsx        scheda di un singolo cliente
    GrowthPanel.jsx          andamento mensile follower
    AlertsPanel.jsx          avvisi automatici
    SettingsModal.jsx        personalizzazione voci tipo/stato/obiettivo
    OptionListEditor.jsx      editor di una lista di voci
    StampBadge.jsx            etichetta colorata di stato
    CalendarioSection.jsx    sezione "Calendario" (4 viste + griglia mensile)
```

## 1. Crea il progetto Firebase (una volta sola)

1. Vai su https://console.firebase.google.com e crea un nuovo progetto (gratuito).
2. Nel menu a sinistra apri **Authentication** → scheda "Sign-in method" → abilita
   **Anonimo**. Serve per tenere il database chiuso al resto di internet: non è un
   login vero con nome utente, è solo un cancello — chi apre il sito viene
   autenticato automaticamente e "in silenzio", senza vedere nulla.
3. Nel menu a sinistra apri **Firestore Database** → **Crea database** → scegli una
   regione europea (es. `eur3`) → parti in modalità produzione.
4. Vai su **Regole** (Firestore) e incolla queste regole, poi pubblica:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /inlab/{docId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

   Questo permette lettura/scrittura solo a chi è passato dall'app (autenticato,
   anche anonimamente) — non a chiunque su internet.

5. Torna alla panoramica del progetto → icona `</>` "Aggiungi app web" → dai un nome
   (es. "InLab Web") → copia i valori che ti mostra (apiKey, authDomain, projectId,
   storageBucket, messagingSenderId, appId).

## 2. Configura le chiavi in locale

Copia `.env.example` in `.env` e incolla i valori ottenuti al punto 5:

```
cp .env.example .env
```

**Non caricare mai `.env` su GitHub** (è già escluso da `.gitignore`).

## 3. Prova in locale

```
npm install
npm run dev
```

Apri l'indirizzo che ti mostra il terminale (di solito `http://localhost:5173`).

## 4. Metti il codice su GitHub

```
git init
git add .
git commit -m "Prima versione InLab"
```

Poi crea un repository vuoto su https://github.com/new (senza README, senza
.gitignore: li hai già) e segui le istruzioni che GitHub mostra per collegarlo:

```
git remote add origin https://github.com/TUO-UTENTE/NOME-REPO.git
git branch -M main
git push -u origin main
```

## 5. Metti online su Vercel

1. Vai su https://vercel.com, accedi con GitHub.
2. "Add New" → "Project" → scegli il repository appena creato.
3. Vercel riconosce automaticamente Vite: non serve cambiare nulla nelle impostazioni
   di build.
4. Prima di premere Deploy, apri "Environment Variables" e aggiungi le **stesse
   variabili** che hai in `.env` (nome esattamente uguale, es.
   `VITE_FIREBASE_API_KEY`, ecc.).
5. Premi Deploy. Dopo circa un minuto avrai un link tipo
   `https://nome-repo.vercel.app` da condividere con Giusi, Ilaria e Nico.

Ogni volta che vorrete aggiornare l'app (nuove funzioni), basterà fare
`git push` sul branch `main`: Vercel ricostruisce e pubblica da solo.

## Limiti di questa prima versione

- L'autenticazione anonima protegge il database dal resto di internet, ma **non
  distingue Giusi da Ilaria da Nico** — è un cancello unico per il team, non un
  login personale. Se in futuro volete sapere "chi ha fatto cosa" con precisione,
  serve aggiungere un login vero (email/password o Google) — fattibile in un
  passaggio successivo.
- I file (PDF, presentazioni) restano gestiti come **link** (es. a Google Drive),
  non c'è ancora un vero upload di file nel database.
