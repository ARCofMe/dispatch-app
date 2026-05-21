import Icon from "./Icon";

const TABS = [
  ["board", "Board", "board"],
  ["triage", "Triage", "triage"],
  ["attention", "Attention", "attention"],
  ["sr", "Service Request", "sr"],
  ["routes", "Routes", "routes"],
  ["intake", "Intake", "intake"],
  ["settings", "Settings", "settings"],
];

export default function TabNav({ activeTab, onSelect, badges = {} }) {
  return (
    <nav className="tab-nav" aria-label="Dispatch views">
      {TABS.map(([key, label, icon]) => (
        <button
          key={key}
          className={key === activeTab ? "tab-button active" : "tab-button"}
          aria-current={key === activeTab ? "page" : undefined}
          onClick={() => onSelect(key)}
          type="button"
        >
          <Icon name={icon} className="tab-icon" />
          {label}
          {badges[key] ? <span className="tab-badge">{badges[key]}</span> : null}
        </button>
      ))}
    </nav>
  );
}
