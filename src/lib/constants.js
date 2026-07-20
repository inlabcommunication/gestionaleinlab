export const CLIENTS_KEY = "clienti";
export const CONFIG_KEY = "config";
export const TASKS_KEY = "calendario";
export const ALERTS_DONE_KEY = "avvisiFatti";
export const AUTO_DONE_KEY = "taskAutomaticiFatti";

export const DEFAULT_CONFIG = {
  types: ["Foto", "Grafica", "Carosello", "Video"],
  statuses: ["Testo scritto", "Ideato", "Registrato", "Editato", "Preparato", "Programmato", "Pubblicato"],
  goals: ["Awareness", "Engagement", "Vendite", "Traffico al sito", "Community"],
};

// Stati che nella scheda contano come "pronto" (contenuto preparato o già programmato),
// distinti da "Pubblicato" che è lo stato finale.
export const READY_STATUSES = ["Preparato", "Programmato"];

export const PALETTE = [
  { color: "#8A5A12", bg: "#F3E3C6" },
  { color: "#245855", bg: "#DCEAE8" },
  { color: "#5B4B8A", bg: "#E4DEF2" },
  { color: "#8A3A45", bg: "#F1D9DA" },
  { color: "#3A6B8A", bg: "#D9E6EE" },
  { color: "#5E6B2E", bg: "#E4EAD0" },
  { color: "#8A6B2E", bg: "#F0E3C6" },
  { color: "#555257", bg: "#E4E2DD" },
];

export const MEMBERS = ["Giusi", "Ilaria", "Nico"];
export const MEMBER_COLOR = {
  Giusi: { color: "#8A5A12", bg: "#F3E3C6" },
  Ilaria: { color: "#245855", bg: "#DCEAE8" },
  Nico: { color: "#5B4B8A", bg: "#E4DEF2" },
};
export const APPT_COLOR = { color: "#3A6B8A", bg: "#D9E6EE" };

// Ruoli di riferimento per i task automatici (solo testo informativo in Impostazioni/Task).
export const ROLE_HINTS = {
  Giusi: "Pubblicazione e creazione grafiche",
  Ilaria: "Montaggio e grafiche",
  Nico: "Definizione contenuti, sponsorizzate, siti web, rapporti clienti e analisi mensili",
};

export const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export const MONTHS_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];
