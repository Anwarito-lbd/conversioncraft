import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import SidePanelIdeas from "./components/SidePanelIdeas";
import CompetitorIntel from "./pages/CompetitorIntel";

const App: React.FC = () => {
  const [view] = useState<"COMPETITOR_INTEL">("COMPETITOR_INTEL");
  const [ideasOpen, setIdeasOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sidebar onSelect={() => { /* no-op: single view */ }} onIdeas={() => setIdeasOpen(true)} />
      <main style={{ flex: 1, padding: 24, background: "#f7f8fb" }}>
        {view === "COMPETITOR_INTEL" && <CompetitorIntel />}
      </main>
      <SidePanelIdeas isOpen={ideasOpen} onClose={() => setIdeasOpen(false)} />
    </div>
  );
};

export default App;