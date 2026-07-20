import { useState } from "react";
import { Trash2, Plus } from "lucide-react";

export default function OptionListEditor({ label, items, onChange }) {
  const [draft, setDraft] = useState("");

  function update(i, val) {
    const next = [...items];
    next[i] = val;
    onChange(next);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  }

  return (
    <div className="option-editor">
      <div className="option-editor-label">{label}</div>
      {items.map((it, i) => (
        <div className="option-row" key={i}>
          <input value={it} onChange={(e) => update(i, e.target.value)} />
          <button className="btn-icon-sm" onClick={() => remove(i)} title="Elimina voce">
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <div className="option-row option-row-add">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          placeholder="Aggiungi voce…"
        />
        <button className="btn-icon-sm" onClick={add} title="Aggiungi">
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
