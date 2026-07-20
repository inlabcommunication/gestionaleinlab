import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Check, ChevronLeft, ChevronRight, CalendarDays, Users } from "lucide-react";
import { uid, todayISO, formatDateItLong, buildMonthMatrix } from "../lib/helpers";
import { MEMBERS, MEMBER_COLOR, APPT_COLOR, WEEKDAYS, MONTHS_IT } from "../lib/constants";

export default function CalendarioSection({ clients, tasks, setTasks }) {
  const [activeView, setActiveView] = useState("Generale");
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMember, setDraftMember] = useState(MEMBERS[0]);
  const [draftNote, setDraftNote] = useState("");

  useEffect(() => {
    if (MEMBERS.includes(activeView)) setDraftMember(activeView);
  }, [activeView]);

  const clientAppointments = useMemo(() => {
    return (clients || [])
      .filter((c) => !c.hidden && c.appointmentDate)
      .map((c) => ({ clientId: c.id, name: c.name || "Cliente senza nome", date: c.appointmentDate }));
  }, [clients]);

  function addTask() {
    const title = draftTitle.trim();
    if (!title) return;
    const task = { id: uid(), date: selectedDate, member: draftMember, title, note: draftNote.trim(), done: false };
    setTasks((prev) => [...prev, task]);
    setDraftTitle("");
    setDraftNote("");
  }

  function toggleDone(taskId) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)));
  }

  function deleteTask(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function updateTask(taskId, patch) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = useMemo(() => buildMonthMatrix(year, month), [year, month]);

  const tasksForView = useMemo(() => {
    return activeView === "Generale" ? tasks : tasks.filter((t) => t.member === activeView);
  }, [tasks, activeView]);

  const tasksByDate = useMemo(() => {
    const map = {};
    tasksForView.forEach((t) => {
      if (!map[t.date]) map[t.date] = [];
      map[t.date].push(t);
    });
    return map;
  }, [tasksForView]);

  const apptsByDate = useMemo(() => {
    const map = {};
    if (activeView !== "Generale") return map;
    clientAppointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [clientAppointments, activeView]);

  const selectedTasks = tasksByDate[selectedDate] || [];
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
      <div className="tabs">
        {MEMBERS.map((m) => (
          <button
            key={m}
            className={`tab ${activeView === m ? "active" : ""}`}
            style={activeView === m ? { borderColor: MEMBER_COLOR[m].color, color: MEMBER_COLOR[m].color } : undefined}
            onClick={() => setActiveView(m)}
          >
            {m}
          </button>
        ))}
        <button
          className={`tab ${activeView === "Generale" ? "active" : ""}`}
          style={activeView === "Generale" ? { borderColor: "#1F2328", color: "#1F2328" } : undefined}
          onClick={() => setActiveView("Generale")}
        >
          <Users size={13} /> Generale
        </button>
      </div>

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
          const dayTasks = tasksByDate[cell.key] || [];
          const dayAppts = apptsByDate[cell.key] || [];
          const isToday = cell.key === todayISO();
          const isSelected = cell.key === selectedDate;
          const membersPresent = Array.from(new Set(dayTasks.map((t) => t.member)));
          return (
            <button
              key={cell.key}
              className={`cal-cell ${cell.inMonth ? "" : "out"} ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
              onClick={() => setSelectedDate(cell.key)}
            >
              <span className="cal-daynum">{cell.day}</span>
              <span className="cal-dots">
                {membersPresent.slice(0, 3).map((m) => (
                  <span key={m} className="cal-dot" style={{ background: MEMBER_COLOR[m].color }} />
                ))}
                {dayAppts.length > 0 && <span className="cal-dot cal-dot-appt" style={{ background: APPT_COLOR.color }} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="legend">
        {MEMBERS.map((m) => (
          <span className="legend-item" key={m}>
            <span className="legend-dot" style={{ background: MEMBER_COLOR[m].color }} /> {m}
          </span>
        ))}
        <span className="legend-item">
          <span className="legend-dot" style={{ background: APPT_COLOR.color }} /> Appuntamento cliente
        </span>
      </div>

      <div className="day-panel">
        <h3>{formatDateItLong(selectedDate)}</h3>

        {selectedAppts.length > 0 && (
          <div className="appt-list">
            {selectedAppts.map((a) => (
              <div className="appt-item" key={a.clientId}>
                <CalendarDays size={13} />
                Appuntamento con <strong>{a.name}</strong>
              </div>
            ))}
          </div>
        )}

        {selectedTasks.length === 0 ? (
          <div className="empty-note">Nessun task per questo giorno.</div>
        ) : (
          <ul className="task-list">
            {selectedTasks.map((t) => (
              <li key={t.id} className={`task-item ${t.done ? "done" : ""}`}>
                <button className="task-check" onClick={() => toggleDone(t.id)} title={t.done ? "Segna da fare" : "Segna fatto"}>
                  <Check size={13} />
                </button>
                <span className="task-member" style={{ color: MEMBER_COLOR[t.member].color, background: MEMBER_COLOR[t.member].bg }}>
                  {t.member}
                </span>
                <input
                  className="task-title-input"
                  value={t.title}
                  onChange={(e) => updateTask(t.id, { title: e.target.value })}
                />
                <input
                  className="task-note-input"
                  value={t.note}
                  onChange={(e) => updateTask(t.id, { note: e.target.value })}
                  placeholder="Nota…"
                />
                <button className="btn-icon-sm" onClick={() => deleteTask(t.id)} title="Elimina">
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="add-task-row">
          <select className="cell-input add-member" value={draftMember} onChange={(e) => setDraftMember(e.target.value)}>
            {MEMBERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <input
            className="cell-input add-title"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask();
            }}
            placeholder="Nuovo task per questo giorno…"
          />
          <input
            className="cell-input add-note"
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Nota (opzionale)"
          />
          <button className="btn-primary" onClick={addTask}>
            <Plus size={14} /> Aggiungi
          </button>
        </div>
      </div>
    </div>
  );
}
