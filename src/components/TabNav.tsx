export type GameTab = "home" | "quest" | "raid";

const TABS: { key: GameTab; label: string }[] = [
  { key: "home", label: "HOME" },
  { key: "quest", label: "QUEST" },
  { key: "raid", label: "RAID" },
];

type TabNavProps = {
  active: GameTab;
  onChange: (tab: GameTab) => void;
};

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="Game sections">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab-btn ${active === tab.key ? "tab-active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
