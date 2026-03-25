
import React from 'react';
import { Check, Zap, Shield, Rocket, CreditCard } from 'lucide-react';
import { BillingPlan } from '../types';

const plans: BillingPlan[] = [
    {
        id: 'starter',
        name: 'Starter',
        price: '$29',
        period: '/mo',
        features: [
            '50 Competitor Scans/mo',
            'Basic Product Finder',
            '5 Video Generations/mo',
            'Standard Support'
        ]
    },
    {
        id: 'pro',
        name: 'Pro Growth',
        price: '$99',
        period: '/mo',
        isPopular: true,
        features: [
            'Unlimited Competitor Scans',
            'Advanced Dropship Metrics',
            '50 Video Generations/mo',
            'Auto-Pilot Mode Access',
            'Priority Support',
            'ComfyUI Workflow Export'
        ]
    },
    {
        id: 'agency',
        name: 'Agency',
        price: '$299',
        period: '/mo',
        features: [
            'Unlimited Everything',
            '5 Seats Included',
            'White Label Reports',
            'API Access',
            'Dedicated Success Manager',
            'Custom AI Model Fine-tuning'
        ]
    }
];

const Billing: React.FC = () => {
  return (
    <div className="space-y-10 animate-in fade-in-up duration-500 pb-20">
        <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Scale your e-commerce empire with the power of Gemini AI. Cancel anytime.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
                <div key={plan.id} className={`relative p-8 rounded-3xl border flex flex-col ${plan.isPopular ? 'bg-indigo-900/10 border-indigo-500 shadow-2xl shadow-indigo-900/20' : 'bg-slate-950/50 border-slate-800'}`}>
                    {plan.isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                            Most Popular
                        </div>
                    )}
                    
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                        <span className="text-4xl font-bold text-white">{plan.price}</span>
                        <span className="text-slate-500">{plan.period}</span>
                    </div>

                    <div className="space-y-4 flex-1 mb-8">
                        {plan.features.map((feat, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                <div className={`mt-0.5 p-0.5 rounded-full ${plan.isPopular ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                    <Check size={10} className="text-white"/>
                                </div>
                                {feat}
                            </div>
                        ))}
                    </div>

                    <button className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${plan.isPopular ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                        {plan.id === 'pro' ? <Zap size={18}/> : <Rocket size={18}/>}
                        {plan.id === 'agency' ? 'Contact Sales' : 'Get Started'}
                    </button>
                </div>
            ))}
        </div>

        <div className="max-w-4xl mx-auto glass-panel p-8 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                    <CreditCard className="text-slate-400"/>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Current Usage</h3>
                    <p className="text-sm text-slate-500">Billing cycle resets on Nov 1, 2024</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">Competitor Scans</span>
                        <span className="text-white font-mono">12 / 50</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '24%' }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-300">AI Video Generations</span>
                        <span className="text-white font-mono">3 / 5</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '60%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Billing;
