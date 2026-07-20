import { READY_STATUSES, PALETTE } from "./constants";

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

// Calcola gli avvisi automatici della scheda cliente: giorni all'appuntamento,
// contenuti ancora da preparare, piano editoriale con troppi buchi, aggiornamento fermo da tempo.
export function computeAlerts(client) {
  const alerts = [];
  const today = todayISO();

  if (client.appointmentDate) {
    const du = daysUntil(client.appointmentDate);
    if (du !== null) {
      if (du > 0) {
        alerts.push({
          type: du <= 7 ? "warning" : "info",
          icon: "calendar",
          text: `Mancano ${du} giorn${du === 1 ? "o" : "i"} all'appuntamento (${formatDateIt(client.appointmentDate)})`,
        });
      } else if (du === 0) {
        alerts.push({ type: "warning", icon: "calendar", text: "L'appuntamento è oggi" });
      } else {
        alerts.push({
          type: "info",
          icon: "calendar",
          text: `L'appuntamento del ${formatDateIt(client.appointmentDate)} è passato: aggiorna la data`,
        });
      }

      if (du >= 0) {
        const upcoming = client.editorial.filter((r) => r.date >= today && r.date <= client.appointmentDate);
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

  return alerts;
}

// Calcola la crescita mese su mese dei follower, confrontando ogni voce con quella
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
    appointmentDate: (() => {
      const d = new Date(now);
      d.setDate(d.getDate() + 4);
      return d.toISOString().slice(0, 10);
    })(),
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
    appointmentDate: "",
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
