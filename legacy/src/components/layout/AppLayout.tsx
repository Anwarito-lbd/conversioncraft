
import React from 'react';
import { Sidebar } from './Sidebar';
import { AppView } from '../../types';

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  setView: (view: AppView) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, currentView, setView }) => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      <Sidebar currentView={currentView} setView={setView} />
      <main className="flex-1 overflow-x-hidden">
        {/* Topbar HUD */}
        <header className="h-16 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-500">SECURE CONNECTION // ENCRYPTED</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
              V.2.0.4
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <span className="text-xs font-bold text-white">CMD</span>
            </div>
          </div>
        </header>
        
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
