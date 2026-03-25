
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CompetitorIntel from './pages/CompetitorIntel';
import ProductFinder from './pages/ProductFinder';
import CreativeStudio from './pages/CreativeStudio';
import PageBuilder from './pages/PageBuilder';
import AutoPilot from './pages/AutoPilot';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import SidePanelIdeas from './components/SidePanelIdeas';
import { AppView, BusinessModel, UserState, ProjectPhase } from './types';
import { Menu, Lightbulb, Box, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  // Default to Dashboard
  const [currentView, setView] = useState<AppView>(AppView.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isIdeasPanelOpen, setIsIdeasPanelOpen] = useState(false);
  
  // User State Management
  const [userState, setUserState] = useState<UserState>({
      onboardingComplete: false,
      businessModel: null,
      hasItem: false,
      currentItemName: '',
      currentReferenceUrl: '',
      currentPhase: ProjectPhase.IDEATION,
      completedSteps: []
  });

  const handleOnboardingComplete = (state: Partial<UserState>) => {
      let initialPhase = ProjectPhase.IDEATION;
      if (state.hasItem) initialPhase = ProjectPhase.MARKET_INTEL;

      setUserState(prev => ({ 
          ...prev, 
          ...state,
          currentPhase: initialPhase,
          currentItemName: state.currentItemName || "New Project"
      }));
      
      if (state.hasItem) {
          setView(AppView.COMPETITOR_INTEL);
      } else {
          setView(AppView.PRODUCT_RESEARCH);
      }
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard setView={setView} userState={userState} />;
      case AppView.AUTO_PILOT:
        return <AutoPilot />;
      case AppView.COMPETITOR_INTEL:
        return <CompetitorIntel />;
      case AppView.PRODUCT_RESEARCH:
        return <ProductFinder businessModel={userState.businessModel} />;
      case AppView.CREATIVE_STUDIO:
        return <CreativeStudio />;
      case AppView.PAGE_BUILDER:
        return <PageBuilder businessModel={userState.businessModel} />;
      case AppView.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard setView={setView} userState={userState} />;
    }
  };

  if (!userState.onboardingComplete) {
      return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden relative">
      
      {/* Clean SaaS Background (No heavy scanlines) */}
      <div className="absolute inset-0 bg-slate-950 pointer-events-none -z-10"></div>
      
      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        businessModel={userState.businessModel}
      />

      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative z-10">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-30 sticky top-0">
            <div className="flex items-center gap-4 lg:hidden">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-slate-400 hover:text-white active:bg-slate-800 rounded-lg transition-colors"
                >
                    <Menu size={20} />
                </button>
                <span className="font-bold text-white tracking-tight">ConversionCraft</span>
            </div>

            {/* Desktop Project Context */}
            <div className="hidden lg:flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                    <Box size={16}/>
                </div>
                <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Project</div>
                    <div className="text-white font-medium leading-none">{userState.currentItemName || "New Project"}</div>
                </div>
                <div className="h-8 w-px bg-slate-800 mx-2"></div>
                <div className="flex items-center gap-2 text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-medium">{userState.currentPhase} Phase</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsIdeasPanelOpen(true)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700"
                >
                    <Lightbulb size={14}/> 
                    <span className="hidden md:inline">Ideas</span>
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 border-2 border-slate-900"></div>
            </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scroll-smooth custom-scrollbar bg-slate-950">
          <div className="max-w-[1600px] mx-auto min-h-full pb-20 lg:pb-0">
            {renderView()}
          </div>
        </main>

        <SidePanelIdeas isOpen={isIdeasPanelOpen} onClose={() => setIsIdeasPanelOpen(false)} />

      </div>
    </div>
  );
};

export default App;
