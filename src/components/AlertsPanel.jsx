import { useMemo } from "react";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { computeAlerts } from "../lib/helpers";

export default function AlertsPanel({ client }) {
  const alerts = useMemo(() => computeAlerts(client), [client]);
  const icons = { calendar: CalendarClock, alert: AlertTriangle, clock: AlertTriangle };

  return (
    <div className="alerts-section">
      <h3>Avvisi</h3>
      {alerts.length === 0 ? (
        <div className="alert-ok">Nessun avviso al momento — tutto sotto controllo.</div>
      ) : (
        <ul className="alerts-list">
          {alerts.map((a, i) => {
            const Icon = icons[a.icon] || AlertTriangle;
            return (
              <li key={i} className={`alert-item alert-${a.type}`}>
                <Icon size={14} />
                <span>{a.text}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
