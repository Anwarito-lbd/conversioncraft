
import React, { useState } from 'react';
import { FlaskConical, Users, BrainCircuit, Target, Zap, Activity, ChevronRight, Loader2, Play } from 'lucide-react';
import { runMarketSimulation, runTrendGenesis } from '../services/geminiService';
import { MarketSimulationResult, TrendGenesisResult } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const InnovationLab: React.FC = () => {
  const [activeModule, setActiveModule] = useState<'DIGITAL_TWIN' | 'TREND_GENESIS' | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Simulation State
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState(29.99);
  const [simResult, setSimResult] = useState<MarketSimulationResult | null>(null);
  
  // Trend State
  const [trendResult, setTrendResult] = useState<TrendGenesisResult | null>(null);

  const handleSimulate = async () => {
    if (!productName) return;
    setLoading(true);
    try {
      const res = await runMarketSimulation(productName, price);
      setSimResult(res);
    } catch (e) {
      console.error(e);
      alert("Simulation failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleTrendPredict = async () => {
    setLoading(true);
    try {
      const res = await runTrendGenesis();
      setTrendResult(res);
    } catch (e) {
      console.error(e);
      alert("Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-up duration-500 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-900 p-8 md:p-12 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <FlaskConical className="text-white" size={32} />
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tight">Innovation Lab</h2>
          </div>
          <p className="text-purple-200 text-xl max-w-2xl leading-relaxed">
            Experimental AI modules from the future. Predict trends before they happen and simulate markets with 10,000 digital clones.
          </p>
        </div>
      </div>

      {/* Module Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button 
          onClick={() => setActiveModule('DIGITAL_TWIN')}
          className={`p-8 rounded-3xl border text-left transition-all group relative overflow-hidden ${activeModule === 'DIGITAL_TWIN' ? 'bg-slate-900 border-fuchsia-500 ring-1 ring-fuchsia-500' : 'bg-slate-900/50 border-white/5 hover:bg-slate-900'}`}
        >
           <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="relative z-10">
             <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <Users className="text-fuchsia-400" size={28} />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">Digital Twin Simulator</h3>
             <p className="text-slate-400">Deploy 10,000 AI personas to test your product, pricing, and landing page before you spend $1 on ads.</p>
           </div>
        </button>

        <button 
          onClick={() => setActiveModule('TREND_GENESIS')}
          className={`p-8 rounded-3xl border text-left transition-all group relative overflow-hidden ${activeModule === 'TREND_GENESIS' ? 'bg-slate-900 border-cyan-500 ring-1 ring-cyan-500' : 'bg-slate-900/50 border-white/5 hover:bg-slate-900'}`}
        >
           <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <div className="relative z-10">
             <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
               <BrainCircuit className="text-cyan-400" size={28} />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">Trend Genesis Engine</h3>
             <p className="text-slate-400">Predict the next viral wave by analyzing supply chain signals, patent filings, and aesthetic clusters.</p>
           </div>
        </button>
      </div>

      {/* DIGITAL TWIN MODULE */}
      {activeModule === 'DIGITAL_TWIN' && (
        <div className="glass-panel p-8 rounded-3xl border-t-4 border-t-fuchsia-500 animate-in fade-in duration-500">
           {!simResult ? (
             <div className="max-w-xl mx-auto">
               <h3 className="text-2xl font-bold text-white mb-6 text-center">Configure Simulation</h3>
               <div className="space-y-4">
                 <div>
                   <label className="text-sm font-bold text-slate-400">Product Name</label>
                   <input 
                     type="text" 
                     value={productName}
                     onChange={(e) => setProductName(e.target.value)}
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white mt-1 focus:border-fuchsia-500 outline-none"
                     placeholder="e.g. Levitating Moon Lamp"
                   />
                 </div>
                 <div>
                   <label className="text-sm font-bold text-slate-400">Target Price ($)</label>
                   <input 
                     type="number" 
                     value={price}
                     onChange={(e) => setPrice(Number(e.target.value))}
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white mt-1 focus:border-fuchsia-500 outline-none"
                   />
                 </div>
                 <button 
                    onClick={handleSimulate}
                    disabled={loading || !productName}
                    className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-fuchsia-500/20 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                 >
                   {loading ? <Loader2 className="animate-spin" /> : <Play fill="currentColor" />} 
                   Launch 10,000 Agents
                 </button>
               </div>
               {loading && (
                 <div className="mt-8 text-center space-y-4">
                   <div className="flex justify-center gap-1">
                     {[...Array(5)].map((_, i) => (
                       <div key={i} className="w-3 h-3 bg-fuchsia-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 100}ms` }}></div>
                     ))}
                   </div>
                   <p className="text-fuchsia-300 font-mono text-sm">Agents interacting: {Math.floor(Math.random() * 9000) + 1000}...</p>
                 </div>
               )}
             </div>
           ) : (
             <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 text-center">
                   <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Predicted CVR</div>
                   <div className="text-4xl font-bold text-white">{simResult.predictedCVR}%</div>
                   <div className="text-emerald-400 text-xs mt-1">High Confidence</div>
                 </div>
                 <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 text-center">
                   <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Predicted ROAS</div>
                   <div className="text-4xl font-bold text-white">{simResult.predictedROAS}x</div>
                   <div className="text-slate-400 text-xs mt-1">Breakeven: 1.6x</div>
                 </div>
                 <div className="bg-slate-950 p-6 rounded-2xl border border-white/10 text-center flex flex-col justify-center">
                   <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Verdict</div>
                   <div className={`text-3xl font-bold ${simResult.verdict.includes('GO') ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {simResult.verdict}
                   </div>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div>
                   <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Target className="text-fuchsia-400"/> Agent Behavior Breakdown
                   </h4>
                   <div className="space-y-4">
                     {simResult.audienceBreakdown.map((seg, i) => (
                       <div key={i} className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                         <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-white">{seg.segment}</span>
                           <span className="text-fuchsia-400 font-mono">{seg.conversionRate}% Conv.</span>
                         </div>
                         <p className="text-sm text-slate-400">
                           <span className="text-rose-400 font-bold">Objection:</span> "{seg.objection}"
                         </p>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                     <Activity className="text-blue-400"/> Hourly Sales Heatmap
                   </h4>
                   <div className="h-[250px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={simResult.salesHeatmap}>
                         <XAxis dataKey="hour" hide />
                         <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#fff' }} />
                         <Area type="monotone" dataKey="sales" stroke="#d946ef" fill="#d946ef" fillOpacity={0.2} />
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               </div>
               
               <button onClick={() => setSimResult(null)} className="text-slate-400 hover:text-white text-sm font-medium underline">
                 Reset Simulation
               </button>
             </div>
           )}
        </div>
      )}

      {/* TREND GENESIS MODULE */}
      {activeModule === 'TREND_GENESIS' && (
        <div className="glass-panel p-8 rounded-3xl border-t-4 border-t-cyan-500 animate-in fade-in duration-500">
          {!trendResult ? (
            <div className="text-center py-12">
              <BrainCircuit size={64} className="mx-auto text-cyan-500 mb-6 animate-pulse" />
              <h3 className="text-2xl font-bold text-white mb-2">Initialize Genesis Engine</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-8">
                Scan 50M+ data points from factories, social media, and patents to predict the future.
              </p>
              <button 
                onClick={handleTrendPredict}
                disabled={loading}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 mx-auto"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Zap fill="currentColor" />}
                Predict Future Trend
              </button>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
               <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                 <div>
                   <div className="flex items-center gap-3 mb-2">
                     <h3 className="text-4xl font-bold text-white tracking-tight">{trendResult.trendName}</h3>
                     <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full text-xs font-bold">
                       {trendResult.confidenceScore}% Confidence
                     </span>
                   </div>
                   <p className="text-xl text-slate-300">{trendResult.description}</p>
                 </div>
                 <div className="bg-slate-950 p-4 rounded-xl border border-white/10 text-right">
                   <div className="text-slate-500 text-xs font-bold uppercase">Origin Signal</div>
                   <div className="text-white font-bold">{trendResult.originSignal}</div>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                    <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Projected Growth Trajectory</h4>
                    <div className="h-[200px]">
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={trendResult.growthTrajectory}>
                         <XAxis dataKey="week" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                         <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#fff' }} />
                         <Area type="monotone" dataKey="score" stroke="#22d3ee" strokeWidth={3} fill="url(#colorTrend)" />
                         <defs>
                           <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 <div>
                   <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Aesthetic DNA</h4>
                   <div className="flex flex-wrap gap-3">
                     {trendResult.aestheticKeywords.map((kw, i) => (
                       <span key={i} className="px-4 py-2 bg-slate-800 rounded-lg text-slate-200 border border-white/5 font-medium">
                         #{kw}
                       </span>
                     ))}
                   </div>
                   <div className="mt-6 p-4 bg-fuchsia-900/10 border border-fuchsia-500/20 rounded-xl">
                     <h5 className="text-fuchsia-400 font-bold text-sm mb-1 flex items-center gap-2"><Zap size={14}/> First Mover Advantage</h5>
                     <p className="text-xs text-slate-400">
                       Launch a product in this niche before {trendResult.growthTrajectory[2]?.week || 'Week 3'} to capture 80% of the market share.
                     </p>
                   </div>
                 </div>
               </div>
               
               <div className="mt-8 text-center">
                  <button onClick={() => setTrendResult(null)} className="text-slate-500 hover:text-white text-sm">
                    Start New Prediction
                  </button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InnovationLab;
