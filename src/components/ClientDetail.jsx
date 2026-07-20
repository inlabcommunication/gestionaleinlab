import {
  Plus, Trash2, Eye, EyeOff, ExternalLink, ChevronLeft,
  CalendarDays, CreditCard, FileText, FolderOpen,
  Link as LinkIcon, TrendingUp,
} from "lucide-react";
import { lastReadyOrRecent, colorForStatus, formatDateIt, withFallback } from "../lib/helpers";
import GrowthPanel from "./GrowthPanel";
import AlertsPanel from "./AlertsPanel";

export default function ClientDetail({
  client,
  config,
  onBack,
  onUpdate,
  onUpdatePayment,
  onToggleHidden,
  onDelete,
  monthFilter,
  setMonthFilter,
  months,
  rows,
  onAddRow,
  onUpdateRow,
  onDeleteRow,
  slotsWanted,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onAddStat,
  onUpdateStat,
  onDeleteStat,
}) {
  const last = lastReadyOrRecent(client.editorial);
  const lastColor = last ? colorForStatus(config.statuses, last.kind) : null;
  const isMonthView = monthFilter !== "tutti";
  const slotsFilled = rows.length;
  const atCapacity = isMonthView && slotsWanted > 0 && slotsFilled >= slotsWanted;

  function handleDeleteOrClear(row) {
    if (isMonthView && slotsWanted > 0 && slotsFilled <= slotsWanted) {
      onUpdateRow(row.id, {
        title: "",
        type: config.types[0] || "",
        status: config.statuses[0] || "",
        goal: config.goals[0] || "",
        link: "",
        note: "",
      });
    } else {
      onDeleteRow(row.id);
    }
  }

  return (
    <div className="client-detail">
      <button className="btn-back show-mobile" onClick={onBack}>
        <ChevronLeft size={16} /> Elenco clienti
      </button>

      <div className="detail-header">
        <input className="name-input" value={client.name} onChange={(e) => onUpdate({ name: e.target.value })} />
        <div className="header-actions">
          <button className="btn-ghost" onClick={onToggleHidden}>
            {client.hidden ? <Eye size={15} /> : <EyeOff size={15} />}
            {client.hidden ? "Mostra" : "Nascondi"}
          </button>
          <button className="btn-ghost danger" onClick={onDelete}>
            <Trash2 size={15} /> Elimina
          </button>
        </div>
      </div>

      <div className="ready-banner" style={last ? { borderLeftColor: lastColor.color, background: lastColor.bg } : undefined}>
        {last ? (
          <>
            <span className="ready-label">
              {last.kind === "Pubblicato" ? "Ultimo contenuto pubblicato" : `Ultimo contenuto pronto — ${last.kind}`}
            </span>
            <span className="ready-title">{last.item.title || "(senza titolo)"}</span>
            <span className="ready-date">{formatDateIt(last.item.date)}</span>
          </>
        ) : (
          <span className="ready-label">Nessun contenuto ancora registrato nel piano editoriale</span>
        )}
      </div>

      <div className="info-grid">
        <div className="info-card">
          <div className="info-label">
            <FileText size={14} /> Contenuti mensili
          </div>
          <input
            className="info-input"
            type="number"
            min="0"
            value={client.monthlyContent}
            onChange={(e) => onUpdate({ monthlyContent: e.target.value })}
            placeholder="es. 12"
          />
        </div>

        <div className="info-card">
          <div className="info-label">
            <TrendingUp size={14} /> Follower iniziali
          </div>
          <input
            className="info-input"
            type="number"
            min="0"
            value={client.followersStart}
            onChange={(e) => onUpdate({ followersStart: e.target.value })}
            placeholder="es. 1200"
          />
        </div>

        <div className="info-card">
          <div className="info-label">
            <CreditCard size={14} /> Pagamento
          </div>
          <div className="payment-row">
            <input
              className="info-input small"
              value={client.payment.amount}
              onChange={(e) => onUpdatePayment({ amount: e.target.value })}
              placeholder="€"
            />
            <select
              className="info-input small"
              value={client.payment.frequency}
              onChange={(e) => onUpdatePayment({ frequency: e.target.value })}
            >
              <option>Mensile</option>
              <option>Trimestrale</option>
              <option>Una tantum</option>
              <option>Altro</option>
            </select>
            <input
              className="info-input small"
              value={client.payment.day}
              onChange={(e) => onUpdatePayment({ day: e.target.value })}
              placeholder="giorno"
            />
          </div>
        </div>

        <div className="info-card">
          <div className="info-label">
            <CalendarDays size={14} /> Prossimo appuntamento
          </div>
          <input
            className="info-input"
            type="date"
            value={client.appointmentDate}
            onChange={(e) => onUpdate({ appointmentDate: e.target.value })}
          />
        </div>

        <div className="info-card">
          <div className="info-label">
            <FolderOpen size={14} /> Cartella Google Drive
          </div>
          <div className="link-row">
            <input
              className="info-input"
              value={client.driveLink}
              onChange={(e) => onUpdate({ driveLink: e.target.value })}
              placeholder="Incolla il link della cartella"
            />
            {client.driveLink && (
              <a href={client.driveLink} target="_blank" rel="noreferrer" className="btn-icon-sm">
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        <div className="info-card">
          <div className="info-label">
            <FileText size={14} /> Presentazione (PDF)
          </div>
          <div className="link-row">
            <input
              className="info-input"
              value={client.presentationLink}
              onChange={(e) => onUpdate({ presentationLink: e.target.value })}
              placeholder="Link al PDF (es. su Drive)"
            />
            {client.presentationLink && (
              <a href={client.presentationLink} target="_blank" rel="noreferrer" className="btn-icon-sm">
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        <div className="info-card wide">
          <div className="info-label">Note</div>
          <textarea
            className="info-input"
            rows={2}
            value={client.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Appunti liberi sul cliente…"
          />
        </div>
      </div>

      <GrowthPanel client={client} onAddStat={onAddStat} onUpdateStat={onUpdateStat} onDeleteStat={onDeleteStat} />

      <AlertsPanel client={client} />

      <div className="activities-section">
        <div className="events-head">
          <h3>Attività</h3>
          <button className="btn-primary" onClick={onAddActivity}>
            <Plus size={14} /> Aggiungi attività
          </button>
        </div>
        {!client.activities || client.activities.length === 0 ? (
          <div className="empty-note">
            Nessuna attività extra. Aggiungi cose come "Fare sponsorizzata", "Scrivere articolo sito"…
          </div>
        ) : (
          <div className="events-list">
            {client.activities.map((act) => (
              <div className="event-row" key={act.id}>
                <input
                  className="cell-input event-name"
                  value={act.text}
                  onChange={(e) => onUpdateActivity(act.id, { text: e.target.value })}
                  placeholder="Es. Fare sponsorizzata, scrivere articolo sito…"
                />
                <button className="btn-icon-sm" onClick={() => onDeleteActivity(act.id)} title="Elimina attività">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="events-section">
        <div className="events-head">
          <h3>Eventi</h3>
          <button className="btn-primary" onClick={onAddEvent}>
            <Plus size={14} /> Aggiungi evento
          </button>
        </div>
        {!client.events || client.events.length === 0 ? (
          <div className="empty-note">
            Nessun evento in programma. Aggiungi open day, matrimoni o altre occasioni del cliente.
          </div>
        ) : (
          <div className="events-list">
            {client.events.map((ev) => (
              <div className="event-row" key={ev.id}>
                <input
                  className="cell-input event-name"
                  value={ev.name}
                  onChange={(e) => onUpdateEvent(ev.id, { name: e.target.value })}
                  placeholder="Nome evento (es. Open day, Matrimonio…)"
                />
                <input
                  type="date"
                  className="cell-input event-date"
                  value={ev.date}
                  onChange={(e) => onUpdateEvent(ev.id, { date: e.target.value })}
                />
                <button className="btn-icon-sm" onClick={() => onDeleteEvent(ev.id)} title="Elimina evento">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="editorial-section">
        <div className="editorial-head">
          <h3>Piano editoriale</h3>
          <div className="editorial-controls">
            <select className="info-input small" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="tutti">Tutti i mesi</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {new Date(m + "-01").toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                </option>
              ))}
            </select>
            {(!isMonthView || slotsWanted === 0 || !atCapacity) && (
              <button className="btn-primary" onClick={onAddRow}>
                <Plus size={14} /> Aggiungi contenuto
              </button>
            )}
          </div>
        </div>

        {isMonthView && (
          <div className="slot-note">
            {slotsWanted > 0 ? (
              <>
                Slot <strong>{Math.min(slotsFilled, slotsWanted)}/{slotsWanted}</strong> in base ai
                contenuti mensili. Per averne di più o di meno, cambia il numero qui sopra.
              </>
            ) : (
              <>Imposta “Contenuti mensili” qui sopra per generare gli slot automaticamente.</>
            )}
          </div>
        )}

        <div className="table-wrap">
          <table className="editorial-table">
            <thead>
              <tr>
                <th style={{ width: "110px" }}>Data</th>
                <th style={{ minWidth: "150px" }}>Titolo</th>
                <th style={{ width: "110px" }}>Tipo</th>
                <th style={{ width: "125px" }}>Stato</th>
                <th style={{ width: "125px" }}>Obiettivo</th>
                <th style={{ width: "130px" }}>Link</th>
                <th style={{ width: "150px" }}>Note</th>
                <th style={{ width: "36px" }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-row">
                    Nessun contenuto in questo periodo. Aggiungine uno.
                  </td>
                </tr>
              )}
              {rows.map((r, idx) => (
                <tr key={r.id}>
                  <td>
                    <input
                      type="date"
                      className="cell-input"
                      value={r.date}
                      onChange={(e) => onUpdateRow(r.id, { date: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      value={r.title}
                      onChange={(e) => onUpdateRow(r.id, { title: e.target.value })}
                      placeholder={
                        isMonthView && slotsWanted > 0 ? `Contenuto ${idx + 1} di ${slotsWanted}` : "Titolo del contenuto"
                      }
                    />
                  </td>
                  <td>
                    <select className="cell-input" value={r.type} onChange={(e) => onUpdateRow(r.id, { type: e.target.value })}>
                      {withFallback(config.types, r.type).map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="cell-input status-select"
                      value={r.status}
                      onChange={(e) => onUpdateRow(r.id, { status: e.target.value })}
                      style={{ color: colorForStatus(config.statuses, r.status).color }}
                    >
                      {withFallback(config.statuses, r.status).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select className="cell-input" value={r.goal} onChange={(e) => onUpdateRow(r.id, { goal: e.target.value })}>
                      <option value="">—</option>
                      {withFallback(config.goals, r.goal).map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="cell-link">
                      <input
                        className="cell-input"
                        value={r.link}
                        onChange={(e) => onUpdateRow(r.id, { link: e.target.value })}
                        placeholder="URL"
                      />
                      {r.link && (
                        <a href={r.link} target="_blank" rel="noreferrer" className="cell-link-btn" title="Apri link">
                          <LinkIcon size={12} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <input
                      className="cell-input"
                      value={r.note}
                      onChange={(e) => onUpdateRow(r.id, { note: e.target.value })}
                      placeholder="Nota"
                    />
                  </td>
                  <td>
                    <button
                      className="btn-icon-sm"
                      onClick={() => handleDeleteOrClear(r)}
                      title={isMonthView && slotsWanted > 0 && slotsFilled <= slotsWanted ? "Svuota slot" : "Elimina"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
