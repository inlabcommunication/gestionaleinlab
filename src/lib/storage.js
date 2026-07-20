import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "inlab";

// Legge un "documento" (una chiave) condiviso da tutta l'agenzia.
// Ritorna il valore già deserializzato da JSON, oppure `fallback` se non esiste.
export async function dbGet(key, fallback) {
  try {
    const snap = await getDoc(doc(db, COLLECTION, key));
    if (snap.exists() && snap.data().value !== undefined) {
      return JSON.parse(snap.data().value);
    }
    return fallback;
  } catch (e) {
    console.error("dbGet error", key, e);
    return fallback;
  }
}

// Salva un valore (qualsiasi dato serializzabile in JSON) sotto una chiave condivisa.
export async function dbSet(key, value) {
  await setDoc(doc(db, COLLECTION, key), { value: JSON.stringify(value) });
}
