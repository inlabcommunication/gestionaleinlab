import { READY_STATUSES, PALETTE, MEMBER_COLOR } from "./constants";

export function colorForMember(name) {
  if (MEMBER_COLOR[name]) return MEMBER_COLOR[name];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatDateIt(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateItLong(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function daysSince(iso) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function daysUntil(iso) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return null;
  const startToday = new Date(todayISO() + "T00:00:00");
  return Math.round((d.getTime() - startToday.getTime()) / 86400000);
}

export function colorForStatus(statuses, status) {
  const idx = (statuses || []).indexOf(status);
  if (idx === -1) return { color: "#8A857A", bg: "#ECEAE3" };
  return PALETTE[idx % PALETTE.length];
}

export function withFallback(list, value) {
  if (!value || list.includes(value)) return list;
  return [value, ...list];
}

export function isRowIncomplete(r) {
  const noTitle = !r.title || !r.title.trim();
  const notReadyOrDone = !READY_STATUSES.includes(r.status) && r.status !== "Pubblicato";
  return noTitle || notReadyOrDone;
}

export function lastReadyOrRecent(editorial) {
  const sorted = [...editorial].sort((a, b) => (a.date < b.date ? 1 : -1));
  const ready = sorted.find((c) => READY_STATUSES.includes(c.status));
  if (ready) return { item: ready, kind: ready.status };
  const published = sorted.find((c) => c.status === "Pubblicato");
  if (published) return { item: published, kind: "Pubblicato" };
  return null;
}

export function nextAppointment(client) {
  const list = (client.appointments || []).filter((a) => !a.done);
  if (list.length === 0) return null;
  const sorted = [...list].sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const today = todayISO();
  const future = sorted.find((a) => a.date >= today);
  return future || sorted[sorted.length - 1];
}

// Chiave del periodo di fatturazione corrente in base alla frequenza del cliente.
export function invoicePeriodKey(client, refDateISO) {
  const ref = refDateISO || todayISO();
  const freq = client.payment?.frequency;
  if (freq === "Trimestrale") {
    const d = new Date(ref + "T00:00:00");
    const q = Math.floor(d.getMonth() / 3);
    return `${d.getFullYear()}-Q${q + 1}`;
  }
  if (freq === "Una tantum") return "una-tantum";
  return ref.slice(0, 7); // Mensile / Altro: per mese
}

// Prossima data di scadenza fattura (giorno del mese impostato in client.payment.day).
export function nextInvoiceDate(client) {
  const day = parseInt(client.payment?.day, 10);
  if (!day || !client.payment?.amount) return null;
  const today = new Date(todayISO() + "T00:00:00");
  let candidate = new Date(today.getFullYear(), today.getMonth(), day);
  if (candidate < today) candidate = new Date(today.getFullYear(), today.getMonth() + 1, day);
  return candidate.toISOString().slice(0, 10);
}


// contenuti ancora da preparare, piano editoriale con troppi buchi, aggiornamento fermo da tempo.
export function computeAlerts(client) {
  const alerts = [];
  const today = todayISO();
  const appt = nextAppointment(client);
  const apptDate = appt ? appt.date : null;

  if (apptDate) {
    const du = daysUntil(apptDate);
    if (du !== null) {
      if (du > 0) {
        alerts.push({
          type: du <= 7 ? "warning" : "info",
          icon: "calendar",
          text: `Mancano ${du} giorn${du === 1 ? "o" : "i"} all'appuntamento (${formatDateIt(apptDate)}${appt.time ? ` alle ${appt.time}` : ""})`,
        });
      } else if (du === 0) {
        alerts.push({ type: "warning", icon: "calendar", text: `L'appuntamento è oggi${appt.time ? ` alle ${appt.time}` : ""}` });
      } else {
        alerts.push({
          type: "info",
          icon: "calendar",
          text: `L'appuntamento del ${formatDateIt(apptDate)} è passato: segnalo come fatto o aggiornalo`,
        });
      }

      if (du >= 0) {
        const upcoming = client.editorial.filter((r) => r.date >= today && r.date <= apptDate);
        const incomplete = upcoming.filter(isRowIncomplete);
        if (incomplete.length > 0) {
          alerts.push({
            type: du <= 7 ? "warning" : "info",
            icon: "alert",
            text: `Mancano ${incomplete.length} contenut${incomplete.length === 1 ? "o" : "i"} da preparare prima dell'appuntamento`,
          });
        }
      }
    }
  }

  const curMonth = today.slice(0, 7);
  const curMonthRows = client.editorial.filter((r) => (r.date || "").slice(0, 7) === curMonth);
  const slotsWantedNow = parseInt(client.monthlyContent, 10) || 0;
  if (slotsWantedNow > 0) {
    const missingTitles = curMonthRows.filter((r) => !r.title || !r.title.trim()).length;
    const threshold = Math.ceil(slotsWantedNow / 2);
    if (missingTitles >= threshold && missingTitles > 0) {
      alerts.push({
        type: "warning",
        icon: "alert",
        text: `Piano editoriale non aggiornato: mancano ${missingTitles} titoli su ${slotsWantedNow} contenuti di questo mese`,
      });
    }
  }

  if (client.lastEditorialUpdate) {
    const d = daysSince(client.lastEditorialUpdate.slice(0, 10));
    if (d !== null && d > 20) {
      alerts.push({
        type: "danger",
        icon: "clock",
        text: `Il piano editoriale non viene aggiornato da ${d} giorni`,
      });
    }
  }

  const invoiceDate = nextInvoiceDate(client);
  if (invoiceDate) {
    const period = invoicePeriodKey(client, invoiceDate);
    const done = client.invoicesDone && client.invoicesDone[period];
    if (!done) {
      const du = daysUntil(invoiceDate);
      if (du <= 7) {
        alerts.push({
          type: du <= 0 ? "danger" : "warning",
          icon: "invoice",
          text: du <= 0 ? `Fattura da fare (scadenza ${formatDateIt(invoiceDate)})` : `Fare la fattura entro il ${formatDateIt(invoiceDate)} (tra ${du} giorni)`,
        });
      }
    }
  }

  return alerts;
}

// Calcola gli avvisi automatici della scheda cliente: giorni all'appuntamento,

// Avvisi aggregati per la Home: uno sguardo su tutti i clienti, con preavviso di 7 giorni.
// Ogni avviso ha un id stabile: una volta segnato "fatto" (doneMap) resta nascosto anche se
// la condizione persiste, finché non cambia il periodo/appuntamento che lo ha generato.
export function computeHomeAlerts(clients, doneMap = {}) {
  const today = todayISO();
  const items = [];

  (clients || [])
    .filter((c) => !c.hidden)
    .forEach((c) => {
      const name = c.name || "Cliente senza nome";

      const appt = nextAppointment(c);
      if (appt) {
        const du = daysUntil(appt.date);
        if (du !== null && du <= 7) {
          const id = `appt-${c.id}-${appt.id}`;
          if (!doneMap[id]) {
            items.push({
              id,
              clientId: c.id,
              type: du < 0 ? "danger" : "warning",
              icon: "calendar",
              date: appt.date,
              text:
                du === 0
                  ? `Oggi appuntamento con ${name}${appt.time ? ` alle ${appt.time}` : ""}`
                  : du > 0
                  ? `Tra ${du} giorn${du === 1 ? "o" : "i"} appuntamento con ${name} (${formatDateIt(appt.date)}${appt.time ? ` alle ${appt.time}` : ""})`
                  : `Appuntamento con ${name} del ${formatDateIt(appt.date)}: segnalo come fatto o aggiornalo`,
            });
          }
        }
      }

      if (c.lastEditorialUpdate) {
        const d = daysSince(c.lastEditorialUpdate.slice(0, 10));
        if (d !== null && d > 20) {
          const id = `editnoupd-${c.id}`;
          if (!doneMap[id]) {
            items.push({
              id,
              clientId: c.id,
              type: "danger",
              icon: "alert",
              date: today,
              text: `Piano editoriale di ${name} non aggiornato da ${d} giorni`,
            });
          }
        }
      }

      const invoiceDate = nextInvoiceDate(c);
      if (invoiceDate) {
        const period = invoicePeriodKey(c, invoiceDate);
        const done = c.invoicesDone && c.invoicesDone[period];
        if (!done) {
          const du = daysUntil(invoiceDate);
          if (du <= 7) {
            const id = `invoice-${c.id}-${period}`;
            if (!doneMap[id]) {
              items.push({
                id,
                clientId: c.id,
                type: du <= 0 ? "danger" : "warning",
                icon: "invoice",
                date: invoiceDate,
                text:
                  du <= 0
                    ? `Oggi fattura/pagamento di ${name}`
                    : `Fare la fattura a ${name} entro il ${formatDateIt(invoiceDate)} (tra ${du} giorni)`,
              });
            }
          }
        }
      }

      const last = lastReadyOrRecent(c.editorial);
      if (last) {
        const du = daysUntil(last.item.date);
        const hasFutureAfter = c.editorial.some(
          (r) => r.date > last.item.date && (READY_STATUSES.includes(r.status) || r.status === "Pubblicato")
        );
        if (!hasFutureAfter && du !== null && du <= 7) {
          const id = `lastcontent-${c.id}-${last.item.id}`;
          if (!doneMap[id]) {
            items.push({
              id,
              clientId: c.id,
              type: "warning",
              icon: "clock",
              date: last.item.date,
              text: `${name}: ultimo contenuto ${last.kind === "Pubblicato" ? "pubblicato" : "programmato"} il ${formatDateIt(last.item.date)} — mancano meno di 7 giorni e non ci sono altri contenuti dopo`,
            });
          }
        }
      }
    });

  return items.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

// Task automatici in base ai ruoli del team:
// - Nico: definizione contenuti, appuntamenti, sponsorizzate, siti, analisi mensili.
// - Giusi: pubblicazione e creazione grafiche.
// - Ilaria: montaggio e grafiche.
// Ogni task ha un id stabile (dedup key): sparisce da solo quando la condizione che lo ha
// generato non è più vera (es. contenuto passato di stato), oppure resta finché non viene
// segnato "fatto" in autoDoneMap.
export function computeAutoTasks(clients, autoDoneMap = {}) {
  const tasks = [];
  const today = todayISO();

  (clients || [])
    .filter((c) => !c.hidden)
    .forEach((c) => {
      const name = c.name || "Cliente senza nome";

      (c.editorial || []).forEach((r) => {
        if (r.status === "Registrato") {
          const id = `montaggio-${c.id}-${r.id}`;
          if (!autoDoneMap[id]) {
            tasks.push({
              id,
              auto: true,
              member: "Ilaria",
              clientId: c.id,
              date: r.date,
              title: `Montare e creare la grafica: "${r.title || "senza titolo"}" — ${name}`,
            });
          }
        }
        if (r.status === "Editato") {
          const id = `pubblica-${c.id}-${r.id}`;
          if (!autoDoneMap[id]) {
            tasks.push({
              id,
              auto: true,
              member: "Giusi",
              clientId: c.id,
              date: r.date,
              title: `Programmare e pubblicare: "${r.title || "senza titolo"}" — ${name}`,
            });
          }
        }
      });

      const appt = nextAppointment(c);
      if (appt) {
        const du = daysUntil(appt.date);
        if (du !== null && du <= 7 && du >= 0) {
          const id = `def-contenuti-${c.id}-${appt.id}`;
          if (!autoDoneMap[id]) {
            tasks.push({
              id,
              auto: true,
              member: "Nico",
              clientId: c.id,
              date: appt.date,
              title: `Definire i contenuti per ${name} (appuntamento il ${formatDateIt(appt.date)})`,
            });
          }
        }
      } else if (c.needsAppointment) {
        const id = `prendi-appt-${c.id}`;
        if (!autoDoneMap[id]) {
          tasks.push({
            id,
            auto: true,
            member: "Nico",
            clientId: c.id,
            date: today,
            title: `Prendere appuntamento con ${name} e definire i contenuti`,
          });
        }
      }

      const slotsWantedNow = parseInt(c.monthlyContent, 10) || 0;
      if (slotsWantedNow > 0) {
        const curMonth = today.slice(0, 7);
        const curMonthRows = (c.editorial || []).filter((r) => (r.date || "").slice(0, 7) === curMonth);
        const readyOrPublished = curMonthRows.filter(
          (r) => READY_STATUSES.includes(r.status) || r.status === "Pubblicato"
        ).length;
        const remaining = slotsWantedNow - readyOrPublished;
        if (remaining <= 1 && !appt && !c.needsAppointment) {
          const id = `esaurimento-${c.id}-${curMonth}`;
          if (!autoDoneMap[id]) {
            tasks.push({
              id,
              auto: true,
              member: "Giusi",
              clientId: c.id,
              date: today,
              title: `Contenuti in esaurimento per ${name}: ci sono altri pronti o Nico deve prendere appuntamento?`,
            });
          }
        }
      }
    });

  return tasks.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}


// del mese precedente (o con i follower iniziali per la prima voce in assoluto).
export function computeGrowthSeries(client) {
  const sorted = [...(client.monthlyStats || [])].sort((a, b) => (a.month > b.month ? 1 : -1));
  const baseline = parseFloat(client.followersStart);
  let prevValue = isNaN(baseline) ? null : baseline;
  const withDelta = sorted.map((s) => {
    const cur = parseFloat(s.followers);
    let delta = null;
    let pct = null;
    if (!isNaN(cur) && prevValue !== null) {
      delta = cur - prevValue;
      pct = prevValue !== 0 ? (delta / prevValue) * 100 : null;
    }
    if (!isNaN(cur)) prevValue = cur;
    return { ...s, delta, pct };
  });
  return withDelta.reverse(); // più recente in alto
}

export function exampleClient() {
  const now = new Date();
  const mk = (offset, title, type, status) => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return {
      id: uid(),
      date: d.toISOString().slice(0, 10),
      title,
      type,
      status,
      goal: "Engagement",
      link: "",
      note: "",
    };
  };
  return {
    id: uid(),
    name: "Esempio — Trattoria Da Marco",
    monthlyContent: 12,
    followersStart: "1240",
    payment: { amount: "450", frequency: "Mensile", day: "5" },
    appointments: [
      {
        id: uid(),
        date: (() => {
          const d = new Date(now);
          d.setDate(d.getDate() + 4);
          return d.toISOString().slice(0, 10);
        })(),
        time: "10:30",
        note: "",
        done: false,
      },
    ],
    invoicesDone: {},
    needsAppointment: false,
    driveLink: "",
    presentationLink: "",
    notes: "Cliente di esempio: puoi modificarlo o eliminarlo.",
    hidden: false,
    lastEditorialUpdate: (() => {
      const d = new Date(now);
      d.setDate(d.getDate() - 3);
      return d.toISOString();
    })(),
    editorial: [
      mk(-6, "Apertura stagione estiva", "Video", "Pubblicato"),
      mk(-2, "Dietro le quinte in cucina", "Foto", "Preparato"),
      mk(3, "Menu della settimana", "Carosello", "Ideato"),
    ],
    events: [
      {
        id: uid(),
        name: "Open day autunno",
        date: (() => {
          const d = new Date(now);
          d.setDate(d.getDate() + 20);
          return d.toISOString().slice(0, 10);
        })(),
      },
    ],
    activities: [{ id: uid(), text: "" }],
    monthlyStats: [
      {
        id: uid(),
        month: (() => {
          const d = new Date(now);
          d.setMonth(d.getMonth() - 2);
          return d.toISOString().slice(0, 7);
        })(),
        followers: "1265",
        note: "Buona crescita grazie al reel dietro le quinte",
      },
      {
        id: uid(),
        month: (() => {
          const d = new Date(now);
          d.setMonth(d.getMonth() - 1);
          return d.toISOString().slice(0, 7);
        })(),
        followers: "1310",
        note: "",
      },
    ],
  };
}

export function blankClient() {
  return {
    id: uid(),
    name: "Nuovo cliente",
    monthlyContent: "",
    followersStart: "",
    payment: { amount: "", frequency: "Mensile", day: "" },
    appointments: [],
    invoicesDone: {},
    needsAppointment: false,
    driveLink: "",
    presentationLink: "",
    notes: "",
    hidden: false,
    lastEditorialUpdate: new Date().toISOString(),
    editorial: [],
    events: [],
    activities: [],
    monthlyStats: [],
  };
}

export function dateKey(year, month, day) {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

// Costruisce la griglia del mese (settimane da lunedì a domenica), includendo i giorni
// del mese precedente/successivo necessari a completare le settimane.
export function buildMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7; // 0 = lunedì
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    const day = daysInPrevMonth - startWeekday + 1 + i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ key: dateKey(y, m, day), day, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: dateKey(year, month, d), day: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const idx = cells.length - (startWeekday + daysInMonth);
    const day = idx + 1;
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ key: dateKey(y, m, day), day, inMonth: false });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
