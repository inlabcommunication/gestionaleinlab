import { useState, useEffect, useRef } from "react";
import TopBar from "./components/TopBar";
import HomeSection from "./components/HomeSection";
import ClientiSection from "./components/ClientiSection";
import CalendarioSection from "./components/CalendarioSection";
import TaskSection from "./components/TaskSection";
import Login from "./components/Login";
import ChooseIdentity from "./components/ChooseIdentity";
import TeamSettingsSection from "./components/TeamSettingsSection";
import { watchAuth, isAuthorized, fetchTeamRoster } from "./firebase";
import { dbGet, dbSet } from "./lib/storage";
import { CLIENTS_KEY, CONFIG_KEY, TASKS_KEY, ALERTS_DONE_KEY, AUTO_DONE_KEY, DEFAULT_CONFIG, MEMBERS } from "./lib/constants";
import { exampleClient, uid } from "./lib/helpers";

export default function App() {
  // user: undefined = sto ancora controllando; null = non loggato; oggetto = loggato
  const [user, setUser] = useState(undefined);
  // authorized: undefined = sto controllando; false = loggato ma senza accesso; true = dentro
  const [authorized, setAuthorized] = useState(undefined);
  const [clients, setClients] = useState(null);
  const [config, setConfig] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [alertsDone, setAlertsDone] = useState(null);
  const [autoDone, setAutoDone] = useState(null);
  const [teamMembers, setTeamMembers] = useState(MEMBERS);
  const [activeSection, setActiveSection] = useState("home");
  const [saveState, setSaveState] = useState("idle");
  const loadedOnce = useRef(false);

  // Ascolta lo stato di login (accesso / logout).
  useEffect(() => {
    const unsub = watchAuth((u) => {
      setUser(u || null);
      if (!u) setAuthorized(undefined);
    });
    return unsub;
  }, []);

  // Dopo il login, controlla se questo account ha gia riscattato un codice invito.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const ok = await isAuthorized(user.uid);
      setAuthorized(ok);
    })();
  }, [user]);

  // Migra un cliente "vecchio" (appointmentDate singolo) al nuovo modello con più appuntamenti.
  function migrateClient(c) {
    let next = c.lastEditorialUpdate ? c : { ...c, lastEditorialUpdate: new Date().toISOString() };
    if (!next.events) next = { ...next, events: [] };
    if (!next.activities) next = { ...next, activities: [] };
    if (!next.monthlyStats) next = { ...next, monthlyStats: [] };
    if (!next.appointments) {
      const appointments = next.appointmentDate ? [{ id: uid(), date: next.appointmentDate, time: "", note: "", done: false }] : [];
      next = { ...next, appointments };
    }
    if (next.appointmentDate !== undefined) {
      const { appointmentDate, ...rest } = next;
      next = rest;
    }
    if (!next.invoicesDone) next = { ...next, invoicesDone: {} };
    if (next.needsAppointment === undefined) next = { ...next, needsAppointment: false };
    return next;
  }

  async function loadAll() {
    const rawClients = await dbGet(CLIENTS_KEY, null);
    const raw = rawClients || [exampleClient()];
    setClients(raw.map(migrateClient));

    const rawConfig = await dbGet(CONFIG_KEY, null);
    setConfig(rawConfig || { ...DEFAULT_CONFIG });

    const rawTasks = await dbGet(TASKS_KEY, null);
    setTasks(rawTasks || []);

    const rawAlertsDone = await dbGet(ALERTS_DONE_KEY, null);
    setAlertsDone(rawAlertsDone || {});

    const rawAutoDone = await dbGet(AUTO_DONE_KEY, null);
    setAutoDone(rawAutoDone || {});

    try {
      const roster = await fetchTeamRoster();
      if (roster && roster.length > 0) setTeamMembers(roster.map((r) => r.name));
    } catch (e) {
      // se non riesce a leggere il roster, resta sul default
    }
  }

  // Carica i dati solo dopo login E autorizzazione confermata.
  useEffect(() => {
    if (!user || authorized !== true) return;
    (async () => {
      await loadAll();
      loadedOnce.current = true;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authorized]);

  useEffect(() => {
    if (!loadedOnce.current || clients === null || config === null || tasks === null || alertsDone === null || autoDone === null) return;
    setSaveState("saving");
    const t = setTimeout(async () => {
      try {
        await Promise.all([
          dbSet(CLIENTS_KEY, clients),
          dbSet(CONFIG_KEY, config),
          dbSet(TASKS_KEY, tasks),
          dbSet(ALERTS_DONE_KEY, alertsDone),
          dbSet(AUTO_DONE_KEY, autoDone),
        ]);
        setSaveState("saved");
      } catch (e) {
        setSaveState("error");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [clients, config, tasks, alertsDone, autoDone]);

  async function refreshAll() {
    setSaveState("saving");
    await loadAll();
    setSaveState("saved");
  }

  // Sto ancora verificando se c'e una sessione attiva.
  if (user === undefined) {
    return (
      <div className="inlab-root">
        <div className="loading">Carico InLab…</div>
      </div>
    );
  }

  // Nessuno loggato: mostra la schermata di accesso.
  if (user === null) {
    return (
      <div className="inlab-root">
        <Login />
      </div>
    );
  }

  // Loggato, ma sto ancora controllando se ha un codice invito riscattato.
  if (authorized === undefined) {
    return (
      <div className="inlab-root">
        <div className="loading">Verifico l'accesso…</div>
      </div>
    );
  }

  // Loggato ma non ancora autorizzato: deve scegliere/creare il suo nome nel team.
  if (authorized === false) {
    return (
      <div className="inlab-root">
        <ChooseIdentity user={user} onAuthorized={() => setAuthorized(true)} />
      </div>
    );
  }

  const ready =
    clients !== null && config !== null && tasks !== null && alertsDone !== null && autoDone !== null;

  function toggleAlertDone(id) {
    setAlertsDone((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleAutoDone(id) {
    setAutoDone((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="inlab-root">
      <TopBar activeSection={activeSection} setActiveSection={setActiveSection} onRefresh={refreshAll} user={user} />

      {!ready ? (
        <div className="loading">Carico i dati…</div>
      ) : (
        <>
          <div style={{ display: activeSection === "home" ? "block" : "none" }}>
            <HomeSection
              clients={clients}
              alertsDone={alertsDone}
              onToggleAlertDone={toggleAlertDone}
              tasks={tasks}
              setTasks={setTasks}
              teamMembers={teamMembers}
            />
          </div>
          <div style={{ display: activeSection === "clienti" ? "block" : "none" }}>
            <ClientiSection clients={clients} setClients={setClients} config={config} setConfig={setConfig} />
          </div>
          <div style={{ display: activeSection === "calendario" ? "block" : "none" }}>
            <CalendarioSection clients={clients} setClients={setClients} />
          </div>
          <div style={{ display: activeSection === "task" ? "block" : "none" }}>
            <TaskSection
              clients={clients}
              tasks={tasks}
              setTasks={setTasks}
              autoDone={autoDone}
              onToggleAutoDone={toggleAutoDone}
              teamMembers={teamMembers}
            />
          </div>
          <div style={{ display: activeSection === "impostazioni" ? "block" : "none" }}>
            <TeamSettingsSection />
          </div>
        </>
      )}

      <div className="save-indicator" data-state={saveState}>
        {saveState === "saving" ? "Salvataggio…" : saveState === "error" ? "Errore salvataggio" : "Salvato"}
      </div>
    </div>
  );
}
