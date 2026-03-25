
import React from 'react';
import { TrendingUp, Zap, AlertTriangle, Activity, ArrowRight, Globe, ShoppingBag, Search, Target, Clock, CheckCircle2, Lock, LayoutTemplate, PenTool, Truck } from 'lucide-react';
import { AppView, UserState, ProjectPhase } from '../types';

interface DashboardProps {
  setView: (view: AppView) => void;
  userState: UserState;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, userState }) => {
  const roadmap = [
      {
          id: ProjectPhase.IDEATION,
          label: "Idea & Research",
          description: "Find a winning product or validate your service niche.",
          icon: ShoppingBag,
          action: "Find Product",
          view: AppView.PRODUCT_RESEARCH,
          color: "indigo",
          status: userState.hasItem ? 'completed' : 'current'
      },
      {
          id: ProjectPhase.MARKET_INTEL,
          label: "War Room Intel",
          description: "Analyze competitors, traffic sources, and ad strategies.",
          icon: Target,
          action: "Analyze Competitor",
          view: AppView.COMPETITOR_INTEL,
          color: "rose",
          status: userState.hasItem && userState.currentPhase === ProjectPhase.MARKET_INTEL ? 'current' : userState.completedSteps.includes('intel') ? 'completed' : 'pending'
      },
      {
          id: ProjectPhase.SOURCING,
          label: "Sourcing / Setup",
          description: "Find suppliers or setup service delivery pipelines.",
          icon: Truck,
          action: "Find Suppliers",
          view: AppView.PRODUCT_RESEARCH,
          color: "emerald",
          status: 'pending'
      },
      {
          id: ProjectPhase.CREATION,
          label: "Asset Creation",
          description: "Build landing page, generate ads, and write copy.",
          icon: PenTool,
          action: "Go to Studio",
          view: AppView.CREATIVE_STUDIO,
          color: "fuchsia",
          status: 'pending'
      }
  ];

  return (
    <div className="pb-20 animate-in fade-in duration-500 space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Mission Control</h2>
          <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-slate-400 text-sm font-medium">
                  Active Project: <span className="text-white font-bold">{userState.currentItemName || "Untitled Initiative"}</span>
              </p>
          </div>
        </div>
        <div className="flex gap-3">
           <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2">
              <Clock size={16} className="text-slate-400"/> Activity Log
           </button>
           {/* Auto Pilot Button Removed */}
        </div>
      </div>

      {/* PROJECT ROADMAP (THE STRUCTURE) */}
      <div>
          <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Project Roadmap</h3>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Phase {roadmap.findIndex(r => r.status === 'current') + 1} of {roadmap.length}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roadmap.map((step, i) => {
                  const isCompleted = step.status === 'completed';
                  const isCurrent = step.status === 'current';
                  const isPending = step.status === 'pending';
                  
                  return (
                      <div 
                        key={step.id} 
                        onClick={() => !isPending && setView(step.view)}
                        className={`
                            relative p-6 rounded-2xl border transition-all duration-300 group cursor-pointer
                            ${isCurrent ? `bg-slate-900 border-${step.color}-500 ring-1 ring-${step.color}-500 shadow-lg shadow-${step.color}-500/10` : 
                              isCompleted ? 'bg-slate-950/50 border-emerald-500/30' : 
                              'bg-slate-950 border-slate-800 opacity-60 hover:opacity-80'}
                        `}
                      >
                          {isCompleted && (
                              <div className="absolute top-3 right-3 text-emerald-500">
                                  <CheckCircle2 size={20} />
                              </div>
                          )}
                          {isPending && (
                              <div className="absolute top-3 right-3 text-slate-600">
                                  <Lock size={16} />
                              </div>
                          )}
                          
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${isCurrent ? `bg-${step.color}-500 text-white` : isCompleted ? 'bg-emerald-900/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                              <step.icon size={24} />
                          </div>
                          
                          <h4 className={`font-bold text-lg mb-1 ${isCurrent ? 'text-white' : 'text-slate-300'}`}>{step.label}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[40px]">{step.description}</p>
                          
                          {isCurrent && (
                              <button className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-${step.color}-500/10 text-${step.color}-400 border border-${step.color}-500/20 flex items-center justify-center gap-2 group-hover:bg-${step.color}-500 group-hover:text-white transition-all`}>
                                  {step.action} <ArrowRight size={12} />
                              </button>
                          )}
                      </div>
                  )
              })}
          </div>
      </div>

      {/* Lower Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Activity className="text-blue-500" /> Quick Actions
              </h3>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                 { label: "New Ad Script", icon: Zap, view: AppView.CREATIVE_STUDIO, desc: "Generate Viral Hook" },
                 { label: "Scan Competitor", icon: Search, view: AppView.COMPETITOR_INTEL, desc: "War Room Intel" },
                 { label: "Find Supplier", icon: Globe, view: AppView.PRODUCT_RESEARCH, desc: "Source Product" },
                 { label: "Page Builder", icon: LayoutTemplate, view: AppView.PAGE_BUILDER, desc: "Edit Landing Page" },
              ].map((tool, i) => (
                 <button 
                    key={i}
                    onClick={() => setView(tool.view)}
                    className="bg-slate-900/50 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 p-4 rounded-2xl flex flex-col items-start justify-between gap-3 transition-all group h-32"
                 >
                    <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/50 transition-all">
                       <tool.icon size={20} className="text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <div className="text-left">
                        <span className="text-sm font-bold text-white block">{tool.label}</span>
                        <span className="text-sm text-slate-500">{tool.desc}</span>
                    </div>
                 </button>
              ))}
           </div>
        </div>

        {/* Alerts Panel */}
        <div className="lg:col-span-1">
           <div className="glass-panel rounded-3xl h-full border border-white/5 flex flex-col overflow-hidden bg-slate-950/30">
              <div className="p-5 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                 <h3 className="font-bold text-white flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" /> Alerts
                 </h3>
                 <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-1 rounded border border-amber-500/20">2 New</span>
              </div>
              <div className="flex-1 p-5 space-y-4">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span className="text-xs font-bold text-white">Competitor Price Drop</span>
                      </div>
                      <p className="text-xs text-slate-400">"Lumina" dropped price by 15% on Amazon.</p>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span className="text-xs font-bold text-white">Supplier Found</span>
                      </div>
                      <p className="text-xs text-slate-400">Verified supplier found with 5-day US shipping.</p>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
