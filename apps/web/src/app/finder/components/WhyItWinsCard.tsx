
import React from 'react';
import { Trophy, CheckCircle2 } from 'lucide-react';

interface WhyItWinsCardProps {
    reason: string;
    benefits: string[];
    angles: string[];
}

const WhyItWinsCard: React.FC<WhyItWinsCardProps> = ({ reason, benefits, angles }) => {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} /> Why It Wins
        </h3>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed border-l-2 border-amber-500 pl-4">
            "{reason}"
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Key Benefits</h4>
                <ul className="space-y-2">
                    {benefits.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0"/> {b}
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Marketing Angles</h4>
                <div className="flex flex-wrap gap-2">
                    {angles.map((a, i) => (
                        <span key={i} className="bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-lg font-medium">
                            {a}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default WhyItWinsCard;
