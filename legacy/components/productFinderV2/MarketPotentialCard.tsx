
import React from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface MarketPotentialCardProps {
    potentialText: string;
    saturation: number;
    competition: number;
}

const MarketPotentialCard: React.FC<MarketPotentialCardProps> = ({ potentialText, saturation, competition }) => {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg flex flex-col h-full">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={20} /> Market Analysis
        </h3>
        
        <div className="mb-6 flex-1">
            <p className="text-sm text-slate-400 leading-relaxed">{potentialText}</p>
        </div>

        <div className="space-y-4">
             <div>
                 <div className="flex justify-between text-xs mb-1">
                     <span className="text-slate-500 font-bold uppercase">Saturation</span>
                     <span className="text-white font-mono">{saturation}%</span>
                 </div>
                 <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div 
                        className={`h-full rounded-full ${saturation > 70 ? 'bg-rose-500' : saturation > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{width: `${saturation}%`}}
                    ></div>
                 </div>
             </div>
             <div>
                 <div className="flex justify-between text-xs mb-1">
                     <span className="text-slate-500 font-bold uppercase">Competition</span>
                     <span className="text-white font-mono">{competition}%</span>
                 </div>
                 <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                     <div 
                        className="h-full rounded-full bg-blue-500"
                        style={{width: `${competition}%`}}
                    ></div>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default MarketPotentialCard;
