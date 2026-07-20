import { useState, useMemo } from "react";
import { Plus, Trash2, Check, Users, Sparkles } from "lucide-react";
import { uid, todayISO, formatDateIt, computeAutoTasks, colorForMember } from "../lib/helpers";
import { ROLE_HINTS } from "../lib/constants";

export default function TaskSection({ clients, tasks, setTasks, autoDone, onToggleAutoDone, teamMembers }) {
  const [activeMember, setActiveMember] = useState("Tutti");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftMember, setDraftMember] = useState(teamMembers[0] || "");

  const autoTasks = useMemo(() => computeAutoTasks(clients, autoDone), [clients, autoDone]);

  const manualForView = useMemo(
    () => (activeMember === "Tutti" ? tasks : tasks.filter((t) => t.member === activeMember)),
    [tasks, activeMember]
  );
  const autoForView = useMemo(
    () => (activeMember === "Tutti" ? autoTasks : autoTasks.filter((t) => t.member === activeMember)),
    [autoTasks, activeMember]
  );

  function addTask() {
    const title = draftTitle.trim();
    const member = draftMember || teamMembers[0];
    if (!title || !member) return;
    const task = { id: uid(), date: draftDate || todayISO(), member, title, note: draftNote.trim(), done: false };
    setTasks((prev) => [...prev, task]);
    setDraftTitle("");
    setDraftNote("");
    setDraftDate("");
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

  return (
    <div className="task-wrap">
      <div className="tabs">
        <button
          className={`tab ${activeMember === "Tutti" ? "active" : ""}`}
          onClick={() => setActiveMember("Tutti")}
        >
          <Users size={13} /> Tutti
        </button>
        {teamMembers.map((m) => {
          const c = colorForMember(m);
          return (
            <button
              key={m}
              className={`tab ${activeMember === m ? "active" : ""}`}
              style={activeMember === m ? { borderColor: c.color, color: c.color } : undefined}
              onClick={() => setActiveMember(m)}
            >
              {m}
            </button>
          );
        })}
      </div>

      {activeMember !== "Tutti" && ROLE_HINTS[activeMember] && (
        <p className="modal-hint">{ROLE_HINTS[activeMember]}</p>
      )}

      {autoForView.length > 0 && (
        <div className="task-group">
          <h3 className="task-group-title">
            <Sparkles size={14} /> Task automatici
          </h3>
          <ul className="task-list">
            {autoForView.map((t) => {
              const c = colorForMember(t.member);
              return (
                <li key={t.id} className="task-item auto-task">
                  <button className="task-check" onClick={() => onToggleAutoDone(t.id)} title="Segna fatto">
                    <Check size={13} />
                  </button>
                  <span className="task-member" style={{ color: c.color, background: c.bg }}>
                    {t.member}
                  </span>
                  <span className="task-title-static">{t.title}</span>
                  {t.date && <span className="task-date">{formatDateIt(t.date)}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="task-group">
        <h3 className="task-group-title">Task manuali</h3>
        {manualForView.length === 0 ? (
          <div className="empty-note">Nessun task manuale.</div>
        ) : (
          <ul className="task-list">
            {manualForView.map((t) => {
              const c = colorForMember(t.member);
              return (
                <li key={t.id} className={`task-item ${t.done ? "done" : ""}`}>
                  <button className="task-check" onClick={() => toggleDone(t.id)} title={t.done ? "Segna da fare" : "Segna fatto"}>
                    <Check size={13} />
                  </button>
                  <span className="task-member" style={{ color: c.color, background: c.bg }}>
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
              );
            })}
          </ul>
        )}

        <div className="add-task-row">
          <select className="cell-input add-member" value={draftMember} onChange={(e) => setDraftMember(e.target.value)}>
            {teamMembers.map((m) => (
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
            placeholder="Nuovo task…"
          />
          <input
            type="date"
            className="cell-input"
            value={draftDate}
            onChange={(e) => setDraftDate(e.target.value)}
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
