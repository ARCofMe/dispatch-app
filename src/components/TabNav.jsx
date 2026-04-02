const TABS = [
  ["board", "Board"],
  ["attention", "Attention"],
  ["sr", "Service Request"],
  ["routes", "Routes"],
  ["intake", "Intake"],
];

export default function TabNav({ activeTab, onSelect }) {
  return (
    <nav className="tab-nav" aria-label="Dispatch views">
      {TABS.map(([key, label]) => (
        <button
          key={key}
          className={key === activeTab ? "tab-button active" : "tab-button"}
          onClick={() => onSelect(key)}
          type="button"
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
