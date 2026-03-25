
import React from 'react';
import { Globe, ShoppingBag, ShoppingCart } from 'lucide-react';

interface SignalsCardProps {
    tiktok: string[];
    amazon: string[];
    aliexpress: string[];
}

const SignalsCard: React.FC<SignalsCardProps> = ({ tiktok, amazon, aliexpress }) => {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="text-cyan-400" size={20} /> Cross-Platform Signals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                 <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
                     <span className="w-2 h-2 rounded-full bg-pink-500"></span> TikTok
                 </div>
                 <ul className="space-y-1">
                     {tiktok.map((s,i) => <li key={i} className="text-xs text-slate-400 truncate">• {s}</li>)}
                 </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                 <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
                     <span className="w-2 h-2 rounded-full bg-orange-500"></span> Amazon
                 </div>
                 <ul className="space-y-1">
                     {amazon.map((s,i) => <li key={i} className="text-xs text-slate-400 truncate">• {s}</li>)}
                 </ul>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                 <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
                     <span className="w-2 h-2 rounded-full bg-red-500"></span> AliExpress
                 </div>
                 <ul className="space-y-1">
                     {aliexpress.map((s,i) => <li key={i} className="text-xs text-slate-400 truncate">• {s}</li>)}
                 </ul>
            </div>
        </div>
    </div>
  );
};

export default SignalsCard;
