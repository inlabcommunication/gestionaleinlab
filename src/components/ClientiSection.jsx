import { useState, useMemo, useEffect } from "react";
import { Plus, Settings, EyeOff, Users } from "lucide-react";
import { uid, todayISO, daysSince, formatDateIt, lastReadyOrRecent, blankClient, nextAppointment } from "../lib/helpers";
import StampBadge from "./StampBadge";
import ClientDetail from "./ClientDetail";
import SettingsModal from "./SettingsModal";

export default function ClientiSection({ clients, setClients, config, setConfig }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [monthFilter, setMonthFilter] = useState(() => todayISO().slice(0, 7));
  const [mobileDetail, setMobileDetail] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const visibleClients = useMemo(() => clients.filter((c) => (showHidden ? true : !c.hidden)), [clients, showHidden]);

  const selected = useMemo(() => clients.find((c) => c.id === selectedId) || null, [clients, selectedId]);

  function updateClient(id, patch) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function updatePayment(id, patch) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, payment: { ...c.payment, ...patch } } : c)));
  }

  function addClient() {
    const nc = blankClient();
    setClients((prev) => [...prev, nc]);
    setSelectedId(nc.id);
    setMobileDetail(true);
  }

  function deleteClient(id) {
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function toggleHidden(id) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, hidden: !c.hidden } : c)));
  }

  function addContentRow(clientId) {
    const row = {
      id: uid(),
      date: todayISO(),
      title: "",
      type: config.types[0] || "",
      status: config.statuses[0] || "",
      goal: config.goals[0] || "",
      link: "",
      note: "",
    };
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, editorial: [...c.editorial, row], lastEditorialUpdate: new Date().toISOString() }
          : c
      )
    );
  }

  function updateContentRow(clientId, rowId, patch) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              editorial: c.editorial.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
              lastEditorialUpdate: new Date().toISOString(),
            }
          : c
      )
    );
  }

  function deleteContentRow(clientId, rowId) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              editorial: c.editorial.filter((r) => r.id !== rowId),
              lastEditorialUpdate: new Date().toISOString(),
            }
          : c
      )
    );
  }

  function addMonthlyStat(clientId) {
    const stat = { id: uid(), month: todayISO().slice(0, 7), followers: "", note: "", pdfLink: "" };
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, monthlyStats: [...(c.monthlyStats || []), stat] } : c))
    );
  }

  function updateMonthlyStat(clientId, statId, patch) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, monthlyStats: (c.monthlyStats || []).map((s) => (s.id === statId ? { ...s, ...patch } : s)) }
          : c
      )
    );
  }

  function deleteMonthlyStat(clientId, statId) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, monthlyStats: (c.monthlyStats || []).filter((s) => s.id !== statId) } : c
      )
    );
  }

  function addActivity(clientId) {
    const act = { id: uid(), text: "" };
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, activities: [...(c.activities || []), act] } : c))
    );
  }

  function updateActivity(clientId, activityId, patch) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, activities: (c.activities || []).map((a) => (a.id === activityId ? { ...a, ...patch } : a)) }
          : c
      )
    );
  }

  function deleteActivity(clientId, activityId) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, activities: (c.activities || []).filter((a) => a.id !== activityId) } : c
      )
    );
  }

  function addAppointment(clientId, appt) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, appointments: [...(c.appointments || []), appt], needsAppointment: false } : c
      )
    );
  }

  function updateAppointment(clientId, apptId, patch) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, appointments: (c.appointments || []).map((a) => (a.id === apptId ? { ...a, ...patch } : a)) }
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

  function markInvoiceDone(clientId, period) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, invoicesDone: { ...(c.invoicesDone || {}), [period]: true } } : c
      )
    );
  }

  function requestAppointment(clientId) {
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, needsAppointment: true } : c)));
  }

  function addEvent(clientId) {
    const ev = { id: uid(), name: "", date: "" };
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, events: [...(c.events || []), ev] } : c)));
  }

  function updateEvent(clientId, eventId, patch) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, events: (c.events || []).map((e) => (e.id === eventId ? { ...e, ...patch } : e)) }
          : c
      )
    );
  }

  function deleteEvent(clientId, eventId) {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, events: (c.events || []).filter((e) => e.id !== eventId) } : c))
    );
  }

  const months = useMemo(() => {
    if (!selected) return [];
    const set = new Set(selected.editorial.map((r) => r.date.slice(0, 7)));
    set.add(todayISO().slice(0, 7));
    return Array.from(set).sort();
  }, [selected]);

  // Genera automaticamente gli slot del piano editoriale in base ai "contenuti mensili"
  // del cliente, per il mese attualmente selezionato.
  useEffect(() => {
    if (!selected || monthFilter === "tutti") return;
    const want = parseInt(selected.monthlyContent, 10);
    if (!want || want <= 0) return;
    const countInMonth = selected.editorial.filter((r) => (r.date || "").slice(0, 7) === monthFilter).length;
    if (countInMonth < want) {
      const toAdd = want - countInMonth;
      const newRows = Array.from({ length: toAdd }).map(() => ({
        id: uid(),
        date: `${monthFilter}-01`,
        title: "",
        type: config.types[0] || "",
        status: config.statuses[0] || "",
        goal: config.goals[0] || "",
        link: "",
        note: "",
      }));
      const clientId = selected.id;
      setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, editorial: [...c.editorial, ...newRows] } : c)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.monthlyContent, monthFilter, selected?.editorial?.length, config]);

  const filteredEditorial = useMemo(() => {
    if (!selected) return [];
    const rows =
      monthFilter === "tutti" ? selected.editorial : selected.editorial.filter((r) => r.date.slice(0, 7) === monthFilter);
    return [...rows].sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [selected, monthFilter]);

  return (
    <div className="app-grid">
      <aside className={`sidebar ${mobileDetail ? "hide-mobile" : ""}`}>
        <div className="sidebar-head">
          <div className="sidebar-head-title">Schede Clienti</div>
          <div className="sidebar-head-actions">
            <button className="btn-icon" onClick={() => setSettingsOpen(true)} title="Personalizza voci">
              <Settings size={16} />
            </button>
            <button className="btn-icon" onClick={addClient} title="Nuovo cliente">
              <Plus size={18} />
            </button>
          </div>
        </div>

        <label className="toggle-hidden">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
          Mostra clienti nascosti
        </label>

        <div className="client-list">
          {visibleClients.length === 0 && (
            <div className="empty-note">
              Nessun cliente {showHidden ? "" : "visibile"}. Crea la prima scheda con “+”.
            </div>
          )}
          {visibleClients.map((c) => {
            const last = lastReadyOrRecent(c.editorial);
            const appt = nextAppointment(c);
            const apptDays = appt ? daysSince(appt.date) : null;
            return (
              <button
                key={c.id}
                className={`client-card ${selectedId === c.id ? "active" : ""} ${c.hidden ? "hidden-card" : ""}`}
                onClick={() => {
                  setSelectedId(c.id);
                  setMobileDetail(true);
                }}
              >
                <div className="client-card-top">
                  <span className="client-name">{c.name || "Senza nome"}</span>
                  {c.hidden && <EyeOff size={13} className="muted-icon" />}
                </div>
                <div className="client-card-meta">
                  {last ? (
                    <StampBadge status={last.kind} statuses={config.statuses} />
                  ) : (
                    <span className="stamp stamp-empty">Nessun contenuto</span>
                  )}
                  {appt && apptDays !== null && apptDays >= -1 && apptDays <= 7 && (
                    <span className="mini-pill">Appuntamento {formatDateIt(appt.date)}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className={`detail ${mobileDetail ? "" : "hide-mobile"}`}>
        {!selected ? (
          <div className="empty-state">
            <Users size={28} strokeWidth={1.5} />
            <p>Seleziona un cliente dall'elenco, oppure creane uno nuovo.</p>
          </div>
        ) : (
          <ClientDetail
            client={selected}
            config={config}
            onBack={() => setMobileDetail(false)}
            onUpdate={(patch) => updateClient(selected.id, patch)}
            onUpdatePayment={(patch) => updatePayment(selected.id, patch)}
            onToggleHidden={() => toggleHidden(selected.id)}
            onDelete={() => {
              if (confirm(`Eliminare definitivamente la scheda di "${selected.name}"?`)) {
                deleteClient(selected.id);
              }
            }}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            months={months}
            rows={filteredEditorial}
            onAddRow={() => addContentRow(selected.id)}
            onUpdateRow={(rowId, patch) => updateContentRow(selected.id, rowId, patch)}
            onDeleteRow={(rowId) => deleteContentRow(selected.id, rowId)}
            slotsWanted={parseInt(selected.monthlyContent, 10) || 0}
            onAddEvent={() => addEvent(selected.id)}
            onUpdateEvent={(eventId, patch) => updateEvent(selected.id, eventId, patch)}
            onDeleteEvent={(eventId) => deleteEvent(selected.id, eventId)}
            onAddAppointment={(appt) => addAppointment(selected.id, appt)}
            onUpdateAppointment={(apptId, patch) => updateAppointment(selected.id, apptId, patch)}
            onDeleteAppointment={(apptId) => deleteAppointment(selected.id, apptId)}
            onMarkInvoiceDone={(period) => markInvoiceDone(selected.id, period)}
            onRequestAppointment={() => requestAppointment(selected.id)}
            onAddActivity={() => addActivity(selected.id)}
            onUpdateActivity={(activityId, patch) => updateActivity(selected.id, activityId, patch)}
            onDeleteActivity={(activityId) => deleteActivity(selected.id, activityId)}
            onAddStat={() => addMonthlyStat(selected.id)}
            onUpdateStat={(statId, patch) => updateMonthlyStat(selected.id, statId, patch)}
            onDeleteStat={(statId) => deleteMonthlyStat(selected.id, statId)}
          />
        )}
      </main>

      {settingsOpen && (
        <SettingsModal config={config} onChange={setConfig} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
