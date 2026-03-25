
import React from 'react';

interface ScoreCircleProps {
  score: number;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ score }) => {
  const normalized = Math.min(Math.max(score, 0), 100);
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-full h-full rotate-[-90deg]">
        <circle
          cx="50%"
          cy="50%"
          r="42%"
          stroke="#1e293b"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="50%"
          cy="50%"
          r="42%"
          stroke="#10b981"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="264"
          strokeDashoffset={264 - (264 * normalized) / 100}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-xl font-bold text-white">{normalized}</span>
    </div>
  );
};

export default ScoreCircle;
