

import React, { useState } from 'react';
import { Package, Briefcase, CheckCircle2, ArrowRight, Rocket, Link as LinkIcon, ShieldAlert, Search, TrendingUp, Target } from 'lucide-react';
import { BusinessModel, UserState } from '../types';

interface OnboardingProps {
  onComplete: (state: Partial<UserState>) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [model, setModel] = useState<BusinessModel | null>(null);
  const [hasItem, setHasItem] = useState<boolean | null>(null);
  const [itemName, setItemName] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');

  const handleNext = () => {
    if (step === 1 && model) setStep(2);
    else if (step === 2 && hasItem !== null) setStep(3);
    else if (step === 3) {
        if (!hasItem) {
            // "No, find me one" flow -> Leads to Product Research
             onComplete({
                businessModel: model,
                hasItem: false,
                currentItemName: "Market Research",
                currentReferenceUrl: "",
                onboardingComplete: true
            });
        } else {
            // "Yes, I have one" flow -> Leads to Competitor Intel
            onComplete({
                businessModel: model,
                hasItem: true,
                currentItemName: itemName,
                currentReferenceUrl: referenceUrl,
                onboardingComplete: true
            });
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(79,70,229,0.1),transparent_60%)]"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

      <div className="relative z-10 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">ConversionCraft</span>
            </h1>
            <p className="text-slate-400 text-lg">AI-Powered Commerce OS. Let's configure your workspace.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-12">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50' : 'bg-slate-900 text-slate-600 border border-slate-800'}`}>
                        {step > i ? <CheckCircle2 size={20}/> : i}
                    </div>
                    {i < 3 && <div className={`w-20 h-1 mx-2 rounded-full transition-all ${step > i ? 'bg-indigo-600' : 'bg-slate-800'}`}></div>}
                </div>
            ))}
        </div>

        {/* Content Area */}
        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl min-h-[400px] flex flex-col">
            
            {/* STEP 1: Business Model */}
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">What are you building?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button 
                            onClick={() => setModel(BusinessModel.DROPSHIPPING)}
                            className={`p-8 rounded-2xl border-2 text-left transition-all group hover:scale-[1.02] ${model === BusinessModel.DROPSHIPPING ? 'bg-indigo-600/10 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                        >
                            <div className="w-16 h-16 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform">
                                <Package size={32}/>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Dropshipping</h3>
                            <p className="text-slate-400 text-sm">Physical products. Sourcing from China/US. Selling via Shopify/WooCommerce.</p>
                        </button>

                        <button 
                            onClick={() => setModel(BusinessModel.DROPSERVICING)}
                            className={`p-8 rounded-2xl border-2 text-left transition-all group hover:scale-[1.02] ${model === BusinessModel.DROPSERVICING ? 'bg-fuchsia-600/10 border-fuchsia-500 ring-1 ring-fuchsia-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
                        >
                            <div className="w-16 h-16 bg-fuchsia-500/20 rounded-xl flex items-center justify-center mb-6 text-fuchsia-400 group-hover:scale-110 transition-transform">
                                <Briefcase size={32}/>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Dropservicing</h3>
                            <p className="text-slate-400 text-sm">Digital services. Arbitrage agencies. High-ticket B2B offers. No inventory.</p>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: Status Check */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center h-full">
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">Current Status</h2>
                    <p className="text-slate-400 mb-10 text-center">Do you already have a {model === BusinessModel.DROPSHIPPING ? 'product to sell' : 'service idea'}?</p>
                    
                    <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
                        <button 
                            onClick={() => setHasItem(true)}
                            className={`flex-1 p-6 rounded-2xl border-2 transition-all text-center ${hasItem === true ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'}`}
                        >
                            <span className="text-3xl mb-2 block">🚀</span>
                            <h3 className="text-lg font-bold text-white">Yes, I have one</h3>
                            <p className="text-slate-500 text-xs mt-1">I need to analyze and launch it.</p>
                        </button>
                        
                        <button 
                            onClick={() => setHasItem(false)}
                            className={`flex-1 p-6 rounded-2xl border-2 transition-all text-center ${hasItem === false ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-900 border-slate-800 hover:border-blue-500/50'}`}
                        >
                            <span className="text-3xl mb-2 block">🔍</span>
                            <h3 className="text-lg font-bold text-white">No, find me one</h3>
                            <p className="text-slate-500 text-xs mt-1">I need AI to find a winner.</p>
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: Details (If Yes) or Briefing (If No) */}
            {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
                    {hasItem ? (
                        <div className="max-w-xl mx-auto w-full">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">Tell us about it</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-300">{model === BusinessModel.DROPSHIPPING ? 'Product Name' : 'Service Name'}</label>
                                    <input 
                                        type="text" 
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                        className="glass-input w-full px-4 py-3 rounded-xl text-white mt-2"
                                        placeholder={model === BusinessModel.DROPSHIPPING ? "e.g. Portable Neck Fan" : "e.g. AI Chatbot Agency"}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-bold text-slate-300">Reference URL (Optional)</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                                        <input 
                                            type="text" 
                                            value={referenceUrl}
                                            onChange={(e) => setReferenceUrl(e.target.value)}
                                            className="glass-input w-full pl-10 px-4 py-3 rounded-xl text-white mt-2"
                                            placeholder="Competitor or Supplier Link"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto w-full h-full flex flex-col justify-center">
                            <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-2xl mb-6 flex gap-4 items-start">
                                <div className="bg-blue-500/20 p-3 rounded-lg">
                                    <ShieldAlert className="text-blue-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Pre-flight Briefing</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        Selecting a high-velocity product is 80% of the battle. We will redirect you to the 
                                        <span className="text-blue-400 font-bold"> Market Research Center</span> to find a winning opportunity.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                                    <Search className="mx-auto text-slate-500 mb-2" size={20}/>
                                    <div className="text-xs font-bold text-slate-300">Analyze Trends</div>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                                    <TrendingUp className="mx-auto text-slate-500 mb-2" size={20}/>
                                    <div className="text-xs font-bold text-slate-300">Validate Demand</div>
                                </div>
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-center">
                                    <Target className="mx-auto text-slate-500 mb-2" size={20}/>
                                    <div className="text-xs font-bold text-slate-300">Select Winner</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Footer Navigation */}
            <div className="mt-auto pt-8 flex justify-between items-center">
                <button 
                    onClick={() => step > 1 && setStep(step - 1)}
                    className={`text-slate-500 hover:text-white font-medium transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    Back
                </button>
                <button 
                    onClick={handleNext}
                    disabled={(step === 1 && !model) || (step === 2 && hasItem === null)}
                    className="bg-white text-slate-950 hover:bg-indigo-50 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                    {step === 3 ? 'Launch Dashboard' : 'Continue'} <ArrowRight size={18}/>
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Onboarding;