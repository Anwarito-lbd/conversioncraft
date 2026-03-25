
import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import Onboarding from './pages/Onboarding';
import { AppLayout } from './components/layout/AppLayout';
import { WarRoom } from './pages/WarRoom';
import { AppView } from './types';
import { LayoutDashboard } from 'lucide-react';

const AppContent: React.FC = () => {
  const { state } = useProject();
  const [view, setView] = useState<AppView>('DASHBOARD');

  if (!state.isInitialized) {
    return <Onboarding />;
  }

  return (
    <AppLayout currentView={view} setView={setView}>
      {view === 'DASHBOARD' && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in">
          <div className="w-20 h-20 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center shadow-2xl">
            <LayoutDashboard size={40} className="text-indigo-500" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Mission Control Center</h2>
            <p className="text-slate-400 mt-2">Project: {state.productName || 'Classified'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mt-8">
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-sm text-slate-500 font-mono uppercase">Phase</div>
              <div className="text-xl font-bold text-white">{state.currentMissionPhase}</div>
            </div>
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-sm text-slate-500 font-mono uppercase">Protocol</div>
              <div className="text-xl font-bold text-white">{state.model}</div>
            </div>
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-sm text-slate-500 font-mono uppercase">Status</div>
              <div className="text-xl font-bold text-emerald-400">ACTIVE</div>
            </div>
          </div>
        </div>
      )}
      
      {view === 'WAR_ROOM' && <WarRoom />}
      
      {/* Placeholders for other views */}
      {(view === 'CREATIVE_STUDIO' || view === 'SUPPLIER_HUNTER' || view === 'AUTO_PILOT') && (
        <div className="flex items-center justify-center h-[50vh] text-slate-500 font-mono uppercase">
          Module Under Construction // Coming Soon
        </div>
      )}
    </AppLayout>
  );
};

const App: React.FC = () => {
  return (
    <ProjectProvider>
      <AppContent />
    </ProjectProvider>
  );
};

export default App;
