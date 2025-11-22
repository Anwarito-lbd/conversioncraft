import React, { useEffect, useState } from "react";
import { loadIdeas, saveIdea } from "../services/ideaStore";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const SidePanelIdeas: React.FC<Props> = ({ isOpen, onClose }) => {
  const [ideas, setIdeas] = useState<string[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    setIdeas(loadIdeas());
  }, [isOpen]);

  const handleSave = () => {
    if (!text.trim()) return;
    saveIdea(text.trim());
    setText("");
    setIdeas(loadIdeas());
  };

  return (
    <aside style={{
      width: isOpen ? 360 : 0,
      transition: "width 200ms ease",
      background: "#fff",
      borderLeft: "1px solid #e6e6e6",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ padding: 16, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}>
        <strong>Ideas</strong>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer" }}>Close</button>
      </div>
      <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Save an insight or prompt..."
          style={{ width: "100%", minHeight: 80, padding: 8 }}
        />
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <button onClick={handleSave} style={{ background: "#06b6d4", border: "none", padding: "8px 12px", color: "#042f3b", borderRadius: 6 }}>Save</button>
        </div>

        <hr style={{ margin: "16px 0" }} />

        <div>
          {ideas.length === 0 && <div style={{ color: "#6b7280" }}>No saved ideas yet.</div>}
          {ideas.map((i, idx) => (
            <div key={idx} style={{ padding: 8, borderRadius: 6, background: "#f3f4f6", marginBottom: 8 }}>
              {i}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SidePanelIdeas;