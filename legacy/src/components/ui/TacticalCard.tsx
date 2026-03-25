
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface TacticalCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}

export const TacticalCard: React.FC<TacticalCardProps> = ({ title, description, icon, selected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left p-6 rounded-xl border transition-all duration-300 group overflow-hidden
        ${selected 
          ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.2)]' 
          : 'bg-slate-900/40 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40'
        }
      `}
    >
      {selected && (
        <div className="absolute top-3 right-3 text-indigo-400 animate-in zoom-in duration-300">
          <CheckCircle2 size={20} />
        </div>
      )}
      
      <div className={`mb-4 p-3 rounded-lg w-fit transition-colors ${selected ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400'}`}>
        {icon}
      </div>
      
      <h3 className={`text-lg font-bold mb-2 font-sans tracking-tight ${selected ? 'text-white' : 'text-slate-300'}`}>
        {title}
      </h3>
      
      <p className="text-sm text-slate-500 leading-relaxed">
        {description}
      </p>

      {/* Scanline effect overlay */}
      {selected && <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(79,70,229,0.05)_50%)] bg-[length:100%_4px] pointer-events-none" />}
    </button>
  );
};
