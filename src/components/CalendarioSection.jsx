import { useState, useMemo } from "react";
import { Plus, Trash2, Check, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { uid, todayISO, formatDateItLong, buildMonthMatrix } from "../lib/helpers";
import { APPT_COLOR, WEEKDAYS, MONTHS_IT } from "../lib/constants";

export default function CalendarioSection({ clients, setClients }) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [draftClientId, setDraftClientId] = useState(clients[0]?.id || "");
  const [draftTime, setDraftTime] = useState("");
  const [draftNote, setDraftNote] = useState("");

  const visibleClients = useMemo(() => clients.filter((c) => !c.hidden), [clients]);

  // Elenco piatto di tutti gli appuntamenti di tutti i clienti, con riferimento al cliente.
  const allAppointments = useMemo(() => {
    const list = [];
    visibleClients.forEach((c) => {
      (c.appointments || []).forEach((a) => {
        list.push({ ...a, clientId: c.id, clientName: c.name || "Cliente senza nome" });
      });
    });
    return list;
  }, [visibleClients]);

  function addAppointment() {
    if (!draftClientId) return;
    const appt = { id: uid(), date: selectedDate, time: draftTime.trim(), note: draftNote.trim(), done: false };
    setClients((prev) =>
      prev.map((c) => (c.id === draftClientId ? { ...c, appointments: [...(c.appointments || []), appt] } : c))
    );
    setDraftTime("");
    setDraftNote("");
  }

  function toggleApptDone(clientId, apptId) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, appointments: (c.appointments || []).map((a) => (a.id === apptId ? { ...a, done: !a.done } : a)) }
          : c
      )
    );
  }

  function deleteAppointment(clientId, apptId) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, appointments: (c.appointments || []).filter((a) => a.id !== apptId) } : c
      )
    );
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = useMemo(() => buildMonthMatrix(year, month), [year, month]);

  const apptsByDate = useMemo(() => {
    const map = {};
    allAppointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.time || "").localeCompare(b.time || "")));
    return map;
  }, [allAppointments]);

  const selectedAppts = apptsByDate[selectedDate] || [];

  function goToday() {
    const d = new Date();
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(todayISO());
  }

  function shiftMonth(delta) {
    setViewDate(new Date(year, month + delta, 1));
  }

  return (
    <div className="cal-wrap">
      <div className="month-nav">
        <button className="btn-icon-sm" onClick={() => shiftMonth(-1)}>
          <ChevronLeft size={16} />
        </button>
        <div className="month-label">
          {MONTHS_IT[month]} {year}
        </div>
        <button className="btn-icon-sm" onClick={() => shiftMonth(1)}>
          <ChevronRight size={16} />
        </button>
        <button className="btn-today" onClick={goToday}>
          Oggi
        </button>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((w) => (
          <div className="cal-weekday" key={w}>
            {w}
          </div>
        ))}
        {weeks.flat().map((cell) => {
          const dayAppts = apptsByDate[cell.key] || [];
          const isToday = cell.key === todayISO();
          const isSelected = cell.key === selectedDate;
          return (
            <button
              key={cell.key}
              className={`cal-cell ${cell.inMonth ? "" : "out"} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedDate(cell.key)}
            >
              <span className="cal-daynum">{cell.day}</span>
              <span className="cal-dots">
                {dayAppts.length > 0 && <span className="cal-dot cal-dot-appt" style={{ background: APPT_COLOR.color }} />}
                {dayAppts.length > 1 && <span className="cal-count">{dayAppts.length}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: APPT_COLOR.color }} /> Appuntamento cliente
        </span>
      </div>

      <div className="day-panel">
        <h3>{formatDateItLong(selectedDate)}</h3>

        {selectedAppts.length === 0 ? (
          <div className="empty-note">Nessun appuntamento per questo giorno.</div>
        ) : (
          <ul className="task-list">
            {selectedAppts.map((a) => (
              <li key={a.id} className={`task-item appt-row ${a.done ? "done" : ""}`}>
                <button
                  className="task-check"
                  onClick={() => toggleApptDone(a.clientId, a.id)}
                  title={a.done ? "Segna da fare" : "Segna fatto"}
                >
                  <Check size={13} />
                </button>
                <CalendarDays size={13} />
                {a.time && <span className="appt-time">{a.time}</span>}
                <strong>{a.clientName}</strong>
                {a.note && <span className="task-note-static">{a.note}</span>}
                <button className="btn-icon-sm" onClick={() => deleteAppointment(a.clientId, a.id)} title="Elimina">
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="add-task-row">
          <select className="cell-input add-member" value={draftClientId} onChange={(e) => setDraftClientId(e.target.value)}>
            {visibleClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || "Senza nome"}
              </option>
            ))}
          </select>
          <input
            type="time"
            className="cell-input"
            value={draftTime}
            onChange={(e) => setDraftTime(e.target.value)}
          />
          <input
            className="cell-input add-note"
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Nota (opzionale)"
          />
          <button className="btn-primary" onClick={addAppointment}>
            <Plus size={14} /> Aggiungi appuntamento
          </button>
        </div>
      </div>
    </div>
  );
}
