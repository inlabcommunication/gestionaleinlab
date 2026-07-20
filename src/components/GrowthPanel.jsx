import { useMemo } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, FileText } from "lucide-react";
import { computeGrowthSeries } from "../lib/helpers";

export default function GrowthPanel({ client, onAddStat, onUpdateStat, onDeleteStat }) {
  const series = useMemo(() => computeGrowthSeries(client), [client]);
  const baseline = client.followersStart;

  return (
    <div className="growth-section">
      <div className="events-head">
        <h3>Andamento mensile</h3>
        <button className="btn-primary" onClick={onAddStat}>
          <Plus size={14} /> Aggiungi mese
        </button>
      </div>

      {series.length === 0 ? (
        <div className="empty-note">
          {baseline
            ? `Nessuna analisi mensile ancora registrata. Parti da ${baseline} follower iniziali.`
            : "Nessuna analisi mensile ancora registrata. Imposta prima i follower iniziali qui sopra."}
        </div>
      ) : (
        <div className="growth-list">
          {series.map((s) => {
            const trendUp = s.delta !== null && s.delta > 0;
            const trendDown = s.delta !== null && s.delta < 0;
            const Icon = trendUp ? TrendingUp : trendDown ? TrendingDown : Minus;
            return (
              <div className="growth-row" key={s.id}>
                <input
                  type="month"
                  className="cell-input growth-month"
                  value={s.month}
                  onChange={(e) => onUpdateStat(s.id, { month: e.target.value })}
                />
                <input
                  type="number"
                  className="cell-input growth-followers"
                  value={s.followers}
                  onChange={(e) => onUpdateStat(s.id, { followers: e.target.value })}
                  placeholder="Follower"
                />
                <span
                  className={`growth-delta ${trendUp ? "up" : trendDown ? "down" : "flat"}`}
                  title="Variazione rispetto al mese precedente"
                >
                  <Icon size={13} />
                  {s.delta !== null
                    ? `${s.delta > 0 ? "+" : ""}${s.delta}${s.pct !== null ? ` (${s.pct > 0 ? "+" : ""}${s.pct.toFixed(1)}%)` : ""}`
                    : "—"}
                </span>
                <input
                  className="cell-input growth-note"
                  value={s.note}
                  onChange={(e) => onUpdateStat(s.id, { note: e.target.value })}
                  placeholder="Nota del mese (es. reel virale, campagna ads…)"
                />
                <div className="cell-link growth-pdf">
                  <input
                    className="cell-input"
                    value={s.pdfLink || ""}
                    onChange={(e) => onUpdateStat(s.id, { pdfLink: e.target.value })}
                    placeholder="Link PDF report"
                  />
                  {s.pdfLink && (
                    <a href={s.pdfLink} target="_blank" rel="noreferrer" className="cell-link-btn" title="Apri PDF">
                      <FileText size={12} />
                    </a>
                  )}
                </div>
                <button className="btn-icon-sm" onClick={() => onDeleteStat(s.id)} title="Elimina">
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
