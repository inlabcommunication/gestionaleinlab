import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
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

const googleProvider = new GoogleAuthProvider();

// Accedi con l'account Google (finestra popup). Un click, nessuna password.
export function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

// Accedi con email e password (account gia esistente).
export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Crea un nuovo account con email e password (prima volta).
export function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// Esci dall'account.
export function logout() {
  return signOut(auth);
}

// Rimane in ascolto dello stato di login: chiama callback(user) ogni volta che
// l'utente accede o esce. user e null se nessuno e loggato.
export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// Traduce i codici di errore di Firebase in messaggi in italiano leggibili.
export function authErrorMessage(code) {
  const map = {
    "auth/invalid-email": "Indirizzo email non valido.",
    "auth/user-disabled": "Questo account e stato disabilitato.",
    "auth/user-not-found": "Nessun account con questa email. Prova a registrarti.",
    "auth/wrong-password": "Password errata.",
    "auth/invalid-credential": "Email o password errate.",
    "auth/email-already-in-use": "Esiste gia un account con questa email. Accedi invece di registrarti.",
    "auth/weak-password": "La password deve avere almeno 6 caratteri.",
    "auth/popup-closed-by-user": "Finestra di accesso chiusa prima di completare.",
    "auth/popup-blocked": "Il browser ha bloccato la finestra di accesso. Consenti i popup e riprova.",
    "auth/operation-not-allowed": "Questo metodo di accesso non e attivo su Firebase.",
  };
  return map[code] || "Si e verificato un errore durante l'accesso. Riprova.";
}
