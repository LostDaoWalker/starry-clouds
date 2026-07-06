const TABS = [
  { key: "home", label: "HOME", active: true },
  { key: "quest", label: "QUEST", active: false },
  { key: "raid", label: "RAID", active: false },
] as const;

export function TabNav() {
  return (
    <nav className="tab-nav" aria-label="Game sections">
      {TABS.map((tab) => (
        <span key={tab.key} className={`tab-btn ${tab.active ? "tab-active" : ""}`}>
          {tab.label}
        </span>
      ))}
    </nav>
  );
}
