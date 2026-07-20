import { X } from "lucide-react";
import OptionListEditor from "./OptionListEditor";

export default function SettingsModal({ config, onChange, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Personalizza le voci</h3>
          <button className="btn-icon-sm" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <p className="modal-hint">
          Queste liste valgono per il piano editoriale di tutti i clienti: modificale, aggiungi o
          elimina voci di Tipo, Stato e Obiettivo.
        </p>
        <div className="modal-columns">
          <OptionListEditor label="Tipo" items={config.types} onChange={(next) => onChange({ ...config, types: next })} />
          <OptionListEditor
            label="Stato"
            items={config.statuses}
            onChange={(next) => onChange({ ...config, statuses: next })}
          />
          <OptionListEditor label="Obiettivo" items={config.goals} onChange={(next) => onChange({ ...config, goals: next })} />
        </div>
      </div>
    </div>
  );
}
