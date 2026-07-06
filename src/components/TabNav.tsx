export type GameTab = "home" | "quest" | "raid";

const TABS: { key: GameTab; label: string }[] = [
  { key: "home", label: "HOME" },
  { key: "quest", label: "QUEST" },
  { key: "raid", label: "RAID" },
];

type TabNavProps = {
  active: GameTab;
  onChange: (tab: GameTab) => void;
  questBadge?: number;
  arenaFights?: number;
};

export function TabNav({ active, onChange, questBadge = 0, arenaFights = 0 }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="Game sections">
      {TABS.map((tab) => {
        const badge =
          tab.key === "quest" && questBadge > 0
            ? questBadge
            : tab.key === "raid" && arenaFights > 0
              ? arenaFights
              : 0;
        return (
          <button
            key={tab.key}
            type="button"
            className={`tab-btn ${active === tab.key ? "tab-active" : ""}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {badge > 0 && <span className="tab-badge">{badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}
