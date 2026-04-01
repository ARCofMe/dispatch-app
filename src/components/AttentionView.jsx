import { useMemo, useState } from "react";

const DEFAULT_FILTERS = {
  stage: "",
  age: "",
  status: "",
  reference: "",
};

export default function AttentionView({ items, loading, error, onRefresh, onSelectItem }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const visibleItems = useMemo(() => {
    return (items || []).filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const current = item?.[key] ?? item?.[camelFromSnake(key)] ?? "";
        return String(current).toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [filters, items]);

  return (
    <section className="panel">
      <div className="attention-toolbar">
        <div className="filter-grid">
          {Object.keys(DEFAULT_FILTERS).map((key) => (
            <label key={key} className="field">
              <span>{labelFor(key)}</span>
              <input
                value={filters[key]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            </label>
          ))}
        </div>
        <button type="button" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {loading && <p>Loading attention queue…</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && visibleItems.length === 0 && <p>No attention items match the current filters.</p>}

      <div className="list-stack">
        {visibleItems.map((item) => (
          <button key={item.itemId || item.item_id} className="attention-card" type="button" onClick={() => onSelectItem(item)}>
            <div className="attention-card-top">
              <strong>{item.reference || item.srReference || "SR"}</strong>
              <span>{item.stageLabel || item.stage || "Stage"}</span>
            </div>
            <p>{item.summary || item.nextAction || "No next action text yet."}</p>
            <div className="attention-card-meta">
              <span>Status: {item.status || "open"}</span>
              <span>Age: {item.ageBucket || item.age_bucket || "n/a"}</span>
              <span>Owner: {item.followUpOwnerLabel || item.follow_up_owner_label || "unassigned"}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function camelFromSnake(value) {
  return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function labelFor(key) {
  if (key === "reference") return "Reference";
  return key.charAt(0).toUpperCase() + key.slice(1);
}
