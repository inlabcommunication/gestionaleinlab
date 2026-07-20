import { Home, Users, CalendarDays, ListChecks, Settings, RefreshCw, LogOut } from "lucide-react";
import { logout } from "../firebase";

const NAV_ITEMS = [
  { key: "home", label: "Home", Icon: Home },
  { key: "clienti", label: "Clienti", Icon: Users },
  { key: "calendario", label: "Calendario", Icon: CalendarDays },
  { key: "task", label: "Task", Icon: ListChecks },
  { key: "impostazioni", label: "Impostazioni", Icon: Settings },
];

export default function TopBar({ activeSection, setActiveSection, onRefresh, user }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="brand-mark">IL</span>
        <div className="topbar-brand-text">
          <div className="brand-title">InLab</div>
          <div className="brand-sub">Agenzia di comunicazione</div>
        </div>
      </div>

      <nav className="topbar-nav">
        {NAV_ITEMS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`topbar-nav-item ${activeSection === key ? "active" : ""}`}
            onClick={() => setActiveSection(key)}
          >
            <Icon size={16} />
            <span className="topbar-nav-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button className="btn-icon-sm" onClick={onRefresh} title="Ricarica i dati">
          <RefreshCw size={15} />
        </button>
        {user && (
          <span className="topbar-user" title={user.email || ""}>
            {(user.email || "?")[0].toUpperCase()}
          </span>
        )}
        <button className="btn-icon-sm" onClick={() => logout()} title="Esci">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
