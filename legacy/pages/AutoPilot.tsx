
import React, { useState, useRef, useEffect } from 'react';
import { Zap, Play, Activity, Package, PenTool, Share2, BarChart3, CheckCircle2, Terminal, Loader2, ChevronRight, AlertTriangle, Download } from 'lucide-react';
import { runAutoPilot } from '../services/geminiService';
import { AutoPilotResult } from '../types';

const AutoPilot: React.FC = () => {
  const [niche, setNiche] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'IDLE' | 'ANALYZE' | 'PLAN' | 'CREATE' | 'PUBLISH' | 'OPTIMIZE' | 'DONE'>('IDLE');
  const [result, setResult] = useState<AutoPilotResult | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const handleStart = async () => {
    if (!niche) return;
    setIsRunning(true);
    setLogs([]);
    setResult(null);
    setCurrentStep('ANALYZE');

    try {
      const data = await runAutoPilot(niche, (log, step) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
        setCurrentStep(step);
      });
      setResult(data);
      setCurrentStep('DONE');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Auto-Pilot workflow completed successfully.`]);
    } catch (e: any) {
      console.error(e);
      setLogs(prev => [...prev, `[ERROR] ${e.message}`]);
      setIsRunning(false);
    }
  };

  const handleDownloadBundle = () => {
      if (!result) return;
      // Simulate downloading a zip/json bundle
      const bundle = {
          product: result.product,
          script: result.adScript,
          page: result.landingPage,
          comfyui_workflow: result.comfyUiWorkflow,
          plan: result.optimizationPlan
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = result.product?.name ? result.product.name.replace(/\s/g, '_') : 'campaign';
      a.download = `autopilot_bundle_${safeName}.json`;
      a.click();
      URL.revokeObjectURL(url);
  }

  const steps = [
    { id: 'ANALYZE', label: 'Analyze', icon: Activity },
    { id: 'PLAN', label: 'Plan', icon: Package },
    { id: 'CREATE', label: 'Create', icon: PenTool },
    { id: 'PUBLISH', label: 'Publish', icon: Share2 },
    { id: 'OPTIMIZE', label: 'Optimize', icon: BarChart3 },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ['ANALYZE', 'PLAN', 'CREATE', 'PUBLISH', 'OPTIMIZE', 'DONE'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (currentIndex > stepIndex) return 'completed';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };

  // Calculate progress percentage for the connection line
  const getProgressWidth = () => {
      if (currentStep === 'DONE') return '100%';
      if (currentStep === 'IDLE') return '0%';
      
      const stepOrder = ['ANALYZE', 'PLAN', 'CREATE', 'PUBLISH', 'OPTIMIZE'];
      const currentIndex = stepOrder.indexOf(currentStep);
      
      // If not in list, return 0
      if (currentIndex === -1) return '0%';

      const segments = stepOrder.length - 1;
      const percentage = Math.min((currentIndex / segments) * 100, 100);
      
      return `${percentage}%`;
  };

  return (
    <div className="space-y-8 animate-in fade-in-up duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="text-amber-400" fill="currentColor" /> Auto-Pilot Mode
          </h2>
          <p className="text-slate-400 mt-1 text-lg">
            Sit back while Gemini orchestrates your entire e-commerce business.
          </p>
        </div>
      </header>

      {/* Input Section */}
      {!isRunning && currentStep !== 'DONE' && (
        <div className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto text-center shadow-2xl shadow-amber-500/10 border-amber-500/20">
           <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 animate-pulse">
              <Zap size={32} className="text-white" fill="currentColor"/>
           </div>
           <h3 className="text-2xl font-bold text-white mb-4">Start New Campaign</h3>
           <p className="text-slate-400 mb-8">Enter a niche or product category. Auto-Pilot will analyze trends, find products, generate assets, and launch campaigns automatically.</p>
           
           <div className="relative max-w-md mx-auto mb-6">
             <input 
               type="text"
               value={niche}
               onChange={(e) => setNiche(e.target.value)} 
               placeholder="e.g. Eco-friendly camping gear"
               className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-lg"
               onKeyDown={(e) => e.key === 'Enter' && handleStart()}
             />
           </div>
           
           <button 
             onClick={handleStart}
             disabled={!niche}
             className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
           >
             <Play size={20} fill="currentColor"/> Initiate Launch
           </button>
        </div>
      )}

      {/* Progress Visualization */}
      {(isRunning || currentStep === 'DONE') && (
        <div className="space-y-8">
            {/* Stepper */}
            <div className="glass-panel p-4 md:p-8 rounded-3xl overflow-hidden">
                <div className="flex justify-between items-center relative px-2 md:px-12">
                    {/* Connection Line Background */}
                    <div className="absolute top-1/2 left-12 right-12 h-1 bg-slate-800 -z-10 transform -translate-y-1/2 hidden md:block rounded-full"></div>
                    
                    {/* Connection Line Progress */}
                    <div 
                        className="absolute top-1/2 left-12 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 -z-10 transform -translate-y-1/2 hidden md:block transition-all duration-700 ease-out rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                        style={{ width: `calc(${getProgressWidth()} - 6rem)` }} 
                    ></div>
                    
                    {steps.map((step, idx) => {
                        const status = getStepStatus(step.id);
                        const Icon = step.icon;
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-3 relative z-10">
                                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                                    status === 'completed' ? 'bg-emerald-500 border-emerald-600 text-white' :
                                    status === 'active' ? 'bg-slate-900 border-amber-500 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110' :
                                    'bg-slate-900 border-slate-800 text-slate-600'
                                }`}>
                                    {status === 'completed' ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                                </div>
                                <span className={`text-xs md:text-sm font-bold uppercase tracking-wider ${
                                    status === 'active' ? 'text-amber-400' : 
                                    status === 'completed' ? 'text-emerald-400' : 'text-slate-600'
                                }`}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Terminal Logs */}
                <div className="glass-panel p-6 rounded-3xl h-[500px] flex flex-col font-mono text-sm border border-slate-800 bg-slate-950/80">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4 text-slate-400">
                        <Terminal size={16} />
                        <span className="font-bold">System Logs</span>
                        {currentStep !== 'DONE' && <Loader2 size={14} className="animate-spin ml-auto text-amber-500" />}
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                        {logs.map((log, i) => (
                            <div key={i} className="text-slate-300 break-words">
                                <span className="text-slate-600 mr-2">{log.split(']')[0]}]</span>
                                <span className={log.includes('ERROR') ? 'text-rose-500' : ''}>{log.split(']')[1]}</span>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>

                {/* Result Preview */}
                <div className="glass-panel p-6 rounded-3xl h-[500px] overflow-hidden relative flex flex-col">
                    {!result ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
                             <Package size={48} className="mb-4 opacity-20"/>
                             <p className="text-lg font-medium">Campaign Assets Generating...</p>
                             <p className="text-sm max-w-xs mx-auto mt-2">AI is creating products, suppliers, copy, images, and strategy plans.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 animate-in fade-in duration-1000">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="text-emerald-500" size={24}/>
                                <div>
                                    <h4 className="font-bold text-white">Launch Successful</h4>
                                    <p className="text-xs text-emerald-200/70">Campaign active on simulated channels</p>
                                </div>
                            </div>

                            {/* Product Card */}
                            <div className="flex gap-4 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                {result.marketingImage && (
                                  <img src={result.marketingImage} className="w-20 h-20 rounded-lg object-cover bg-slate-800" alt="Generated Product"/>
                                )}
                                <div>
                                    <h4 className="font-bold text-white">{result.product.name}</h4>
                                    <div className="flex gap-2 mt-1 text-xs">
                                        <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">Profit: {result.product.profit}</span>
                                        <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">Score: {result.product.competition}/100</span>
                                    </div>
                                    <div className="mt-2 text-xs text-indigo-400 flex items-center gap-1">
                                        <Package size={12}/> {result.suppliers.length} Suppliers Found
                                    </div>
                                </div>
                            </div>

                            {/* Script Snippet */}
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Viral Hook</h5>
                                <p className="text-white font-medium italic">"{result.adScript.hook}"</p>
                            </div>

                             {/* Strategy */}
                             <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Optimization Plan</h5>
                                <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{result.optimizationPlan}</p>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={handleDownloadBundle}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={18}/> Download Assets
                                </button>
                                <button 
                                    onClick={() => {setIsRunning(false); setCurrentStep('IDLE'); setNiche('');}}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-colors"
                                >
                                    Run Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AutoPilot;
