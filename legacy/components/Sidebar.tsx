

import React from 'react';
import { AppView, BusinessModel } from '../types';
import { LayoutDashboard, Search, ShoppingBag, Video, Settings, X, Zap, Layers, Bot } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  isOpen: boolean;
  onClose: () => void;
  businessModel: BusinessModel | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, onClose, businessModel }) => {
  
  const handleNav = (view: AppView) => {
    setView(view);
    onClose();
  };

  const isService = businessModel === BusinessModel.DROPSERVICING;

  const NavItem = ({ view, label, icon: Icon }: { view: AppView, label: string, icon: any }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => handleNav(view)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden 
        ${isActive ? `bg-slate-800 text-white` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
      >
        {isActive && <div className={`absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full`} />}
        <Icon size={18} className={`transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/60 transform transition-transform duration-300 ease-in-out
        flex flex-col
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/20">
              <Zap className="text-white" size={16} fill="currentColor"/>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">ConversionCraft</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X size={24} />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          
          {/* Core */}
          <div className="space-y-1">
            <div className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Overview</div>
            <NavItem view={AppView.DASHBOARD} label="Dashboard" icon={LayoutDashboard} />
          </div>

          {/* Strategy */}
          <div className="space-y-1">
            <div className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Market Intelligence</div>
            <NavItem view={AppView.PRODUCT_RESEARCH} label={isService ? "Idea & Sourcing" : "Products & Sourcing"} icon={ShoppingBag} />
            <NavItem view={AppView.COMPETITOR_INTEL} label="Competitor Analysis" icon={Search} />
          </div>

          {/* Execution */}
          <div className="space-y-1">
            <div className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Production</div>
            <NavItem view={AppView.PAGE_BUILDER} label="Page Builder" icon={Layers} />
            <NavItem view={AppView.CREATIVE_STUDIO} label="Creative Studio" icon={Video} />
            <NavItem view={AppView.AUTO_PILOT} label="Auto-Pilot" icon={Zap} />
          </div>

          {/* Admin */}
          <div className="space-y-1">
             <div className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Admin</div>
             <NavItem view={AppView.SETTINGS} label="Settings" icon={Settings} />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700">
                <Bot size={16} />
             </div>
             <div>
                <div className="text-xs font-bold text-white">AI System</div>
                <div className="text-[10px] text-emerald-500 flex items-center gap-1">
                   ● Operational
                </div>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;