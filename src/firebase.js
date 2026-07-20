import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missingKeys.length > 0) {
  console.error(
    "Configurazione Firebase incompleta. Variabili mancanti:",
    missingKeys,
    "\nControlla il file .env in locale, oppure le Environment Variables su Vercel (e rifai il Deploy dopo averle aggiunte)."
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Login anonimo: basta per tenere il database chiuso al resto di internet
// (le regole Firestore richiedono un utente autenticato, vedi README).
// Non distingue Giusi/Ilaria/Nico tra loro: è un cancello, non un login vero.
export function ensureSignedIn() {
  if (missingKeys.length > 0) {
    return Promise.reject(
      new Error(
        `Configurazione Firebase incompleta (mancano: ${missingKeys.join(", ")}). ` +
          "Controlla il file .env in locale o le Environment Variables su Vercel."
      )
    );
  }
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve(user);
      } else {
        signInAnonymously(auth).then((cred) => resolve(cred.user)).catch(reject);
      }
    });
  });
}
