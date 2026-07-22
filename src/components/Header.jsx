export default function Header({ view, setView }) {
  const tabs = [
    { id: "home", label: "대시보드" },
    { id: "contact", label: "문의" },
  ];
  return (
    <div className="header">
      <div className="display header-logo">
        대시보드 <span className="accent">드롭</span>
      </div>
      <nav className="header-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`btn tab ${view === t.id ? "tab--active" : ""}`}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
