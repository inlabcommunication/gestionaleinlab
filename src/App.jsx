import { useState, useEffect, useRef } from "react";
import TopBar from "./components/TopBar";
import ClientiSection from "./components/ClientiSection";
import CalendarioSection from "./components/CalendarioSection";
import { ensureSignedIn } from "./firebase";
import { dbGet, dbSet } from "./lib/storage";
import { CLIENTS_KEY, CONFIG_KEY, TASKS_KEY, DEFAULT_CONFIG } from "./lib/constants";
import { exampleClient } from "./lib/helpers";

export default function App() {
  const [clients, setClients] = useState(null);
  const [config, setConfig] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [activeSection, setActiveSection] = useState("clienti");
  const [saveState, setSaveState] = useState("idle");
  const [authError, setAuthError] = useState(null);
  const loadedOnce = useRef(false);

  async function loadAll() {
    const rawClients = await dbGet(CLIENTS_KEY, null);
    const raw = rawClients || [exampleClient()];
    const normalized = raw.map((c) => {
      let next = c.lastEditorialUpdate ? c : { ...c, lastEditorialUpdate: new Date().toISOString() };
      if (!next.events) next = { ...next, events: [] };
      if (!next.activities) next = { ...next, activities: [] };
      if (!next.monthlyStats) next = { ...next, monthlyStats: [] };
      return next;
    });
    setClients(normalized);

    const rawConfig = await dbGet(CONFIG_KEY, null);
    setConfig(rawConfig || { ...DEFAULT_CONFIG });

    const rawTasks = await dbGet(TASKS_KEY, null);
    setTasks(rawTasks || []);
  }

  useEffect(() => {
    (async () => {
      try {
        await ensureSignedIn();
      } catch (e) {
        setAuthError(
          "Non riesco a collegarmi al database (controlla la configurazione Firebase in .env). Dettagli: " + e.message
        );
        return;
      }
      await loadAll();
      loadedOnce.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loadedOnce.current || clients === null || config === null || tasks === null) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        await Promise.all([dbSet(CLIENTS_KEY, clients), dbSet(CONFIG_KEY, config), dbSet(TASKS_KEY, tasks)]);
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [clients, config, tasks]);

  async function refreshAll() {
    setSaveState("saving");
    await loadAll();
    setSaveState("saved");
  }

  if (authError) {
    return (
      <div className="inlab-root">
        <div className="loading" style={{ color: "#A5362F" }}>{authError}</div>
      </div>
    );
  }

  const ready = clients !== null && config !== null && tasks !== null;

  return (
    <div className="inlab-root">
      <TopBar activeSection={activeSection} setActiveSection={setActiveSection} onRefresh={refreshAll} />

      {!ready ? (
        <div className="loading">Carico InLab…</div>
      ) : (
        <>
          <div style={{ display: activeSection === "clienti" ? "block" : "none" }}>
            <ClientiSection clients={clients} setClients={setClients} config={config} setConfig={setConfig} />
          </div>
          <div style={{ display: activeSection === "calendario" ? "block" : "none" }}>
            <CalendarioSection clients={clients} tasks={tasks} setTasks={setTasks} />
          </div>
        </>
      )}

      <div className="save-indicator" data-state={saveState}>
        {saveState === "saving" ? "Salvataggio…" : saveState === "error" ? "Errore salvataggio" : "Salvato"}
      </div>
    </div>
  );
}
