import React from "react";

type Props = {
  onSelect: () => void;
  onIdeas: () => void;
};

const Sidebar: React.FC<Props> = ({ onSelect, onIdeas }) => {
  return (
    <nav style={{
      width: 220,
      background: "#111827",
      color: "#fff",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 12
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>ConversionCraft</div>
      <button
        onClick={onSelect}
        style={{
          background: "#1f2937",
          color: "#fff",
          border: "none",
          padding: "10px 12px",
          borderRadius: 6,
          cursor: "pointer",
          textAlign: "left"
        }}
      >
        War Room
      </button>
      <button
        onClick={onIdeas}
        style={{
          marginTop: "auto",
          background: "#06b6d4",
          color: "#042f3b",
          border: "none",
          padding: "10px 12px",
          borderRadius: 6,
          cursor: "pointer"
        }}
      >
        Ideas
      </button>
    </nav>
  );
};

export default Sidebar;