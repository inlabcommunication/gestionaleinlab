import { Users, CalendarDays, RefreshCw, LogOut } from "lucide-react";
import { logout } from "../firebase";

export default function TopBar({ activeSection, setActiveSection, onRefresh, user }) {
  const label = user ? user.displayName || user.email : "";

  return (
    <div className="app-topbar">
      <div className="brand">
        <span className="brand-mark">IL</span>
        <div>
          <div className="brand-title">InLab</div>
          <div className="brand-sub">Agenzia di comunicazione</div>
        </div>
      </div>
      <div className="app-tabs">
        <button
          className={`app-tab ${activeSection === "clienti" ? "active" : ""}`}
          onClick={() => setActiveSection("clienti")}
        >
          <Users size={14} /> Clienti
        </button>
        <button
          className={`app-tab ${activeSection === "calendario" ? "active" : ""}`}
          onClick={() => setActiveSection("calendario")}
        >
          <CalendarDays size={14} /> Calendario
        </button>
      </div>
      <div className="topbar-user">
        {label && <span className="topbar-email" title={label}>{label}</span>}
        <button className="btn-icon" onClick={onRefresh} title="Aggiorna dati">
          <RefreshCw size={16} />
        </button>
        <button className="btn-icon" onClick={() => logout()} title="Esci">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
