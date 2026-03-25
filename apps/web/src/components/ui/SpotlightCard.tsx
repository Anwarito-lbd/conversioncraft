'use client';

import { ReactNode, useState } from 'react';

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
}

export default function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/45 backdrop-blur ${className}`}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width) * 100;
        const ny = ((event.clientY - rect.top) / rect.height) * 100;
        setX(Math.max(0, Math.min(100, nx)));
        setY(Math.max(0, Math.min(100, ny)));
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(280px circle at ${x}% ${y}%, rgba(56, 189, 248, 0.20), transparent 55%)`,
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

