
import React from 'react';
import { LayoutDashboard, Crosshair, PenTool, Truck, Zap, Settings, LogOut } from 'lucide-react';
import { AppView } from '../../types';
import { useProject } from '../../context/ProjectContext';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { resetMission } = useProject();

  const NavItem = ({ view, icon: Icon, label, danger = false }: { view: AppView, icon: any, label: string, danger?: boolean }) => {
    const active = currentView === view;
    return (
      <button
        onClick={() => setView(view)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all duration-200 group relative overflow-hidden
          ${active 
            ? 'bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-500' 
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }
          ${danger && active ? 'text-rose-400 border-rose-500 bg-rose-500/10' : ''}
        `}
      >
        <Icon size={20} className={active ? (danger ? 'text-rose-400' : 'text-indigo-400') : 'text-slate-500'} />
        <span className="font-medium text-sm tracking-wide">{label}</span>
        {active && <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 pointer-events-none" />}
      </button>
    );
  };

  return (
    <div className="w-64 bg-slate-950 border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-black text-white tracking-tighter italic flex items-center gap-2">
          <Zap size={20} className="text-indigo-500" fill="currentColor" />
          CONVERSION<span className="text-indigo-500">CRAFT</span>
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-500 uppercase">Systems Online</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-3">
        <div className="text-[10px] font-mono text-slate-600 uppercase px-4 mb-2 tracking-widest">Command</div>
        <NavItem view="DASHBOARD" label="Mission Control" icon={LayoutDashboard} />
        
        <div className="text-[10px] font-mono text-slate-600 uppercase px-4 mb-2 mt-6 tracking-widest">Tactical</div>
        <NavItem view="WAR_ROOM" label="The War Room" icon={Crosshair} danger />
        <NavItem view="CREATIVE_STUDIO" label="Creative Studio" icon={PenTool} />
        <NavItem view="SUPPLIER_HUNTER" label="Supplier Hunter" icon={Truck} />
        
        {/* Auto-Pilot Hidden as requested */}
        {/* 
        <div className="text-[10px] font-mono text-slate-600 uppercase px-4 mb-2 mt-6 tracking-widest">Automation</div>
        <NavItem view="AUTO_PILOT" label="Auto-Pilot" icon={Zap} />
        */}
      </div>

      <div className="p-4 border-t border-white/10">
        <button onClick={resetMission} className="w-full flex items-center gap-2 px-4 py-2 text-xs font-mono text-slate-500 hover:text-rose-400 transition-colors">
          <LogOut size={14} /> ABORT MISSION
        </button>
      </div>
    </div>
  );
};
