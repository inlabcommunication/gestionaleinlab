import { useState, useEffect } from "react";
import { fetchTeamRoster, claimIdentity, logout } from "../firebase";

export default function ChooseIdentity({ user, onAuthorized }) {
  const [roster, setRoster] = useState(null); // null = sto caricando
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setRoster(await fetchTeamRoster());
  }

  useEffect(() => {
    load();
  }, []);

  const isBootstrap = roster !== null && roster.length === 0;
  const available = roster ? roster.filter((r) => !r.claimedByUid) : [];

  async function pick(name) {
    setError("");
    setBusy(true);
    try {
      await claimIdentity(user, name, { bootstrap: isBootstrap });
      onAuthorized();
    } catch (e) {
      setError(e.message || "Non sono riuscito a completare la scelta.");
      await load();
    } finally {
      setBusy(false);
    }
  }

  function handleBootstrapSubmit(e) {
    e.preventDefault();
    if (!customName.trim()) {
      setError("Scrivi un nome.");
      return;
    }
    pick(customName);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">IL</span>
          <div>
            <div className="brand-title">InLab</div>
            <div className="brand-sub">Agenzia di comunicazione</div>
          </div>
        </div>

        {roster === null ? (
          <div className="empty-note">Carico il team…</div>
        ) : isBootstrap ? (
          <>
            <h2 className="login-title">Sei il primo ad accedere</h2>
            <p className="invite-hint">
              Non c'è ancora nessun membro del team registrato. Scegli il tuo nome per
              creare il team: gli altri lo vedranno comparire quando si iscriveranno.
            </p>
            <form onSubmit={handleBootstrapSubmit} className="login-form">
              <input
                className="login-input"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Il tuo nome (es. Giusi)"
                autoFocus
              />
              <button className="login-submit" type="submit" disabled={busy}>
                {busy ? "Attendi…" : "Crea il team con questo nome"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="login-title">Chi sei?</h2>
            <p className="invite-hint">
              Sei entrato come <strong>{user.email}</strong>. Scegli il tuo nome dal team.
            </p>

            {available.length === 0 ? (
              <div className="login-error">
                Iscrizione fallita: i membri del team sono già tutti occupati. Chiedi
                all'amministratore di aggiungerti dalle Impostazioni.
              </div>
            ) : (
              <div className="identity-list">
                {available.map((r) => (
                  <button
                    key={r.name}
                    className="identity-option"
                    onClick={() => pick(r.name)}
                    disabled={busy}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {error && <div className="login-error">{error}</div>}

        <div className="login-switch">
          Account sbagliato?{" "}
          <button type="button" onClick={() => logout()}>
            Esci
          </button>
        </div>
      </div>
    </div>
  );
}
