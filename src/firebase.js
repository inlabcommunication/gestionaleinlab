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
import {
  getFirestore, doc, getDoc, getDocs, collection,
  writeBatch, setDoc, deleteDoc, serverTimestamp,
} from "firebase/firestore";

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

const ROSTER = "teamRoster";
const AUTHORIZED = "authorized";

// Un utente e "autorizzato" solo se esiste un documento authorized/{suo-uid}.
// Il login (Google/email) da solo NON basta: bisogna aver scelto un nome dal team.
export async function isAuthorized(uid) {
  const snap = await getDoc(doc(db, AUTHORIZED, uid));
  return snap.exists();
}

// Elenco completo del roster (usato sia per la scelta identita sia per le impostazioni).
export async function fetchTeamRoster() {
  const snap = await getDocs(collection(db, ROSTER));
  return snap.docs
    .map((d) => ({ name: d.id, ...d.data() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Rivendica un nome del team per l'utente corrente.
// - Se il roster e completamente vuoto (primissimo accesso in assoluto), lo slot
//   viene creato al volo con il nome scelto.
// - Altrimenti lo slot deve gia esistere e risultare libero.
export async function claimIdentity(user, name, { bootstrap }) {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new Error("Scegli un nome.");

  const rosterRef = doc(db, ROSTER, trimmed);
  const batch = writeBatch(db);

  if (bootstrap) {
    batch.set(rosterRef, { claimedByUid: user.uid, claimedByEmail: user.email || null });
  } else {
    const snap = await getDoc(rosterRef);
    if (!snap.exists()) throw new Error("Questo membro non esiste più. Aggiorna la pagina e riprova.");
    if (snap.data().claimedByUid) throw new Error("Questo nome è appena stato preso da qualcun altro.");
    batch.update(rosterRef, { claimedByUid: user.uid, claimedByEmail: user.email || null });
  }

  batch.set(doc(db, AUTHORIZED, user.uid), {
    name: trimmed,
    email: user.email || null,
    joinedAt: serverTimestamp(),
  });

  await batch.commit();
}

// Aggiunge un nuovo nome libero al roster (dalle Impostazioni, solo per chi e gia dentro).
export async function addTeamMember(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) throw new Error("Scrivi un nome.");
  const ref = doc(db, ROSTER, trimmed);
  const snap = await getDoc(ref);
  if (snap.exists()) throw new Error("Questo nome esiste già nel team.");
  await setDoc(ref, { claimedByUid: null, claimedByEmail: null });
}

// Libera uno slot occupato: toglie subito l'accesso a chi lo aveva preso.
export async function releaseTeamMember(name) {
  const ref = doc(db, ROSTER, name);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const uid = snap.data().claimedByUid;
  const batch = writeBatch(db);
  batch.update(ref, { claimedByUid: null, claimedByEmail: null });
  if (uid) batch.delete(doc(db, AUTHORIZED, uid));
  await batch.commit();
}

// Rimuove del tutto un nome dal roster (solo se e libero).
export async function removeTeamMember(name) {
  const ref = doc(db, ROSTER, name);
  const snap = await getDoc(ref);
  if (snap.exists() && snap.data().claimedByUid) {
    throw new Error("Libera prima questo membro, poi puoi eliminarlo.");
  }
  await deleteDoc(ref);
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
    "auth/unauthorized-domain":
      "Questo dominio non e autorizzato su Firebase. Vai su Authentication > Impostazioni > " +
      "Domini autorizzati e aggiungi il dominio del sito (es. tuo-progetto.vercel.app).",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
      "Chiave Firebase non valida: controlla VITE_FIREBASE_API_KEY su Vercel.",
    "auth/network-request-failed": "Problema di rete: controlla la connessione e riprova.",
  };
  return map[code] || `Si e verificato un errore durante l'accesso (${code || "sconosciuto"}). Riprova.`;
}
