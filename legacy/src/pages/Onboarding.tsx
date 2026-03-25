
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { TacticalCard } from '../components/ui/TacticalCard';
import { Box, Zap, Package, Search, ShieldAlert, ArrowRight, Crosshair } from 'lucide-react';
import { BusinessModel } from '../../types';

const Onboarding: React.FC = () => {
  const { updateState, completeOnboarding } = useProject();
  const [step, setStep] = useState(1);
  
  // Local state for the form
  const [model, setModel] = useState<BusinessModel | null>(null);
  const [hasAsset, setHasAsset] = useState<boolean | null>(null);
  const [productName, setProductName] = useState('');
  
  const handleNext = () => {
    if (step === 1 && model) {
      updateState({ model });
      setStep(2);
    } else if (step === 2 && hasAsset !== null) {
      updateState({ hasProduct: hasAsset, productName: hasAsset ? productName : undefined });
      setStep(3);
    } else if (step === 3) {
      completeOnboarding();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 z-0" />
      <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

      <div className="relative z-10 max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-12 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-mono uppercase tracking-widest mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            System Initialization
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
            STRATEGY ARCHITECT
          </h1>
          <p className="text-slate-400 text-lg">Configure your operational parameters.</p>
        </div>

        {/* Steps Visualization */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-500 shadow-[0_0_10px_indigo]' : 'bg-slate-800'}`} />
          ))}
        </div>

        {/* STEP 1: PROTOCOL SELECTION */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TacticalCard 
                title="Dropshipping Protocol"
                description="Physical logistics. Sourcing from China/US. High volume, shipping intensive."
                icon={<Package size={24} />}
                selected={model === BusinessModel.DROPSHIPPING}
                onClick={() => setModel(BusinessModel.DROPSHIPPING)}
              />
              <TacticalCard 
                title="Dropservicing Protocol"
                description="Digital arbitrage. B2B services. High margin, lead generation intensive."
                icon={<Zap size={24} />}
                selected={model === BusinessModel.DROPSERVICING}
                onClick={() => setModel(BusinessModel.DROPSERVICING)}
              />
            </div>
          </div>
        )}

        {/* STEP 2: ASSET VERIFICATION */}
        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
            <h2 className="text-xl font-bold text-white text-center">Do you possess a Winning Asset?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TacticalCard 
                title="Asset Acquired"
                description="I have a product or service ready to scale."
                icon={<Box size={24} />}
                selected={hasAsset === true}
                onClick={() => setHasAsset(true)}
              />
              <TacticalCard 
                title="Asset Required"
                description="I need AI to identify a winning opportunity."
                icon={<Search size={24} />}
                selected={hasAsset === false}
                onClick={() => setHasAsset(false)}
              />
            </div>
            
            {hasAsset && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <label className="block text-xs font-mono text-indigo-400 mb-2 uppercase">Asset Designation</label>
                <input 
                  type="text" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Quantum Neck Fan"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-lg p-4 text-white outline-none transition-all font-mono"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 3: THREAT ASSESSMENT */}
        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500 text-center">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 text-rose-500 border border-rose-500/20">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Initialize War Room?</h2>
              <p className="text-slate-400 max-w-md mb-8">
                We will immediately scan for hostiles in your niche upon initialization.
              </p>
              
              <button 
                onClick={handleNext}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 font-lg rounded-lg hover:bg-indigo-500 focus:outline-none ring-offset-2 focus:ring-2 ring-indigo-400"
              >
                <span className="mr-2">ENGAGE SYSTEMS</span>
                <Crosshair size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                <div className="absolute inset-0 rounded-lg ring-2 ring-white/20 group-hover:scale-105 transition-all duration-300" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-12 flex justify-between items-center border-t border-white/5 pt-6">
          <button 
            onClick={() => step > 1 && setStep(step - 1)}
            className={`text-slate-500 hover:text-white transition-colors font-mono text-sm ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
          >
            {'<'} ABORT STEP
          </button>
          
          {step < 3 && (
            <button 
              onClick={handleNext}
              disabled={(step === 1 && !model) || (step === 2 && hasAsset === null)}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-mono text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              PROCEED {'>'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
