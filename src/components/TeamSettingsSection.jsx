import { useState, useEffect } from "react";
import { UserPlus, Unlock, Trash2, Users } from "lucide-react";
import { fetchTeamRoster, addTeamMember, releaseTeamMember, removeTeamMember } from "../firebase";

export default function TeamSettingsSection() {
  const [roster, setRoster] = useState(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setRoster(await fetchTeamRoster());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await addTeamMember(newName);
      setNewName("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRelease(name) {
    if (!confirm(`Liberare "${name}"? La persona che lo occupa perderà subito l'accesso.`)) return;
    setBusy(true);
    try {
      await releaseTeamMember(name);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(name) {
    if (!confirm(`Eliminare del tutto "${name}" dal team?`)) return;
    setBusy(true);
    try {
      await removeTeamMember(name);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-wrap">
      <div className="settings-head">
        <Users size={18} />
        <h2>Membri del team</h2>
      </div>
      <p className="invite-hint">
        Aggiungi un nome per far comparire un posto libero da scegliere alla prossima
        iscrizione. "Libera" toglie subito l'accesso alla persona che occupa quel nome.
      </p>

      <form onSubmit={handleAdd} className="add-task-row" style={{ marginBottom: 18 }}>
        <input
          className="cell-input add-title"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nuovo nome (es. Laura)"
        />
        <button className="btn-primary" type="submit" disabled={busy}>
          <UserPlus size={14} /> Aggiungi
        </button>
      </form>

      {error && <div className="login-error" style={{ marginBottom: 14 }}>{error}</div>}

      {roster === null ? (
        <div className="empty-note">Carico…</div>
      ) : roster.length === 0 ? (
        <div className="empty-note">Nessun membro ancora. Il primo verrà creato al primo accesso.</div>
      ) : (
        <div className="events-list">
          {roster.map((r) => (
            <div className="event-row roster-row" key={r.name}>
              <span className="roster-name">{r.name}</span>
              {r.claimedByUid ? (
                <>
                  <span className="roster-status roster-status-taken">{r.claimedByEmail || "Occupato"}</span>
                  <button className="btn-icon-sm" onClick={() => handleRelease(r.name)} title="Libera questo nome">
                    <Unlock size={13} />
                  </button>
                </>
              ) : (
                <span className="roster-status roster-status-free">Libero</span>
              )}
              <button
                className="btn-icon-sm"
                onClick={() => handleRemove(r.name)}
                title="Elimina dal team"
                disabled={!!r.claimedByUid}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
