
import React from 'react';

interface ScoreCircleProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ 
  score, 
  size = 120, 
  strokeWidth = 10 
}) => {
  // Clamp score between 0 and 100 and ensure valid number
  const normalized = Math.min(Math.max(Number(score) || 0, 0), 100);
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * normalized) / 100;
  
  // Determine color based on score
  const getColor = (val: number) => {
    if (val >= 80) return '#10b981'; // Emerald-500
    if (val >= 50) return '#f59e0b'; // Amber-500
    return '#f43f5e'; // Rose-500
  };

  const color = getColor(normalized);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Rotating container to start from top */}
      <svg 
        className="w-full h-full transform -rotate-90 drop-shadow-md"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b" // Slate-800
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-50"
        />
        
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      
      {/* Text content - Unrotated */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white leading-none select-none">
        <span 
            className="font-bold tracking-tighter text-white"
            style={{ fontSize: `${size * 0.3}px`, lineHeight: 1 }}
        >
            {normalized}
        </span>
        {size > 50 && (
            <span 
                className="font-bold uppercase tracking-wider text-slate-500 mt-1"
                style={{ fontSize: `${size * 0.12}px` }}
            >
                Score
            </span>
        )}
      </div>
    </div>
  );
};

export default ScoreCircle;
