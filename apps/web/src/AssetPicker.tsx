import { useState } from "react";
import { Check, LoaderCircle, Search } from "lucide-react";
import type { Artifact } from "./api";
import { ArtifactThumb, Modal } from "./components";

export function AssetPicker({
  artifacts,
  attached,
  onAdd,
  onClose,
}: {
  artifacts: Artifact[];
  attached: Artifact[];
  onAdd: (assets: Artifact[]) => Promise<void>;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const existing = new Set(attached.map((item) => item.id));
  const visible = artifacts.filter((item) =>
    !item.metadata?.auxiliary && item.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Modal
      title="Project assets"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        className="asset-picker"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || !selected.length) return;
          setBusy(true);
          setError("");
          try {
            await onAdd(artifacts.filter((item) => selected.includes(item.id)));
            onClose();
          } catch (value) {
            setError((value as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="asset-picker-search">
          <Search size={16} />
          <input
            autoFocus
            aria-label="Find a project asset"
            placeholder="Find an asset"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="asset-picker-list">
          {visible.map((item) => {
            const checked = existing.has(item.id) || selected.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                className="asset-picker-item"
                aria-label={item.name}
                aria-pressed={checked}
                disabled={busy || existing.has(item.id)}
                onClick={() => {
                  if (!checked && selected.length + attached.length >= 8) {
                    setError("Attach up to 8 files per message.");
                    return;
                  }
                  setError("");
                  setSelected((items) =>
                    checked
                      ? items.filter((id) => id !== item.id)
                      : [...items, item.id],
                  );
                }}
              >
                <ArtifactThumb artifact={item} />
                <span>{item.name}</span>
                <span className="asset-picker-check">
                  {checked && <Check size={16} />}
                </span>
              </button>
            );
          })}
          {!visible.length && (
            <p>
              {artifacts.length ? "No matching assets" : "No project assets"}
            </p>
          )}
        </div>
        {error && (
          <p className="entry-image-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="button primary"
            disabled={busy || !selected.length}
          >
            {busy && <LoaderCircle className="spin" size={15} />}Add{" "}
            {selected.length || ""} {selected.length === 1 ? "asset" : "assets"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
