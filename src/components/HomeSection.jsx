import { useMemo, useState } from "react";
import { Check, Plus, CalendarClock, AlertTriangle, Receipt, Clock } from "lucide-react";
import { computeHomeAlerts, uid, todayISO } from "../lib/helpers";
import { colorForMember } from "../lib/helpers";

const ICONS = { calendar: CalendarClock, alert: AlertTriangle, invoice: Receipt, clock: Clock };

export default function HomeSection({ clients, alertsDone, onToggleAlertDone, tasks, setTasks, teamMembers }) {
  const alerts = useMemo(() => computeHomeAlerts(clients, alertsDone), [clients, alertsDone]);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftMembers, setDraftMembers] = useState([]);

  function toggleDraftMember(m) {
    setDraftMembers((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function addTask() {
    const title = draftTitle.trim();
    if (!title || draftMembers.length === 0) return;
    const newTasks = draftMembers.map((member) => ({
      id: uid(),
      date: draftDate || todayISO(),
      member,
      title,
      note: draftNote.trim(),
      done: false,
    }));
    setTasks((prev) => [...prev, ...newTasks]);
    setDraftTitle("");
    setDraftNote("");
    setDraftDate("");
    setDraftMembers([]);
  }

  return (
    <div className="home-wrap">
      <section className="home-alerts">
        <h2>Avvisi</h2>
        {alerts.length === 0 ? (
          <div className="alert-ok">Nessun avviso al momento — tutto sotto controllo.</div>
        ) : (
          <ul className="alerts-list home-alerts-list">
            {alerts.map((a) => {
              const Icon = ICONS[a.icon] || AlertTriangle;
              return (
                <li key={a.id} className={`alert-item alert-${a.type}`}>
                  <button className="task-check" onClick={() => onToggleAlertDone(a.id)} title="Segna come fatto">
                    <Check size={13} />
                  </button>
                  <Icon size={14} />
                  <span>{a.text}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="home-add-task">
        <h2>Aggiungi task o appunto</h2>
        <p className="modal-hint">Scrivi cosa va fatto e spunta a chi assegnarlo (anche più di uno).</p>
        <div className="home-task-form">
          <input
            className="cell-input"
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            placeholder="Cosa c'è da fare?"
          />
          <input
            className="cell-input"
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Nota (opzionale)"
          />
          <input
            type="date"
            className="cell-input"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
          />
          <div className="member-checks">
            {teamMembers.map((m) => {
              const active = draftMembers.includes(m);
              const c = colorForMember(m);
              return (
                <button
                  type="button"
                  key={m}
                  className={`member-check ${active ? "active" : ""}`}
                  style={active ? { borderColor: c.color, color: c.color, background: c.bg } : undefined}
                  onClick={() => toggleDraftMember(m)}
                >
                  {m}
                </button>
              );
            })}
          </div>
          <button className="btn-primary" onClick={addTask} disabled={!draftTitle.trim() || draftMembers.length === 0}>
            <Plus size={14} /> Aggiungi
          </button>
        </div>
      </section>
    </div>
  );
}
