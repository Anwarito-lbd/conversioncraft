
import React from 'react';
import { Truck, ExternalLink, Star } from 'lucide-react';

interface SupplierCardProps {
    suppliers: {
        name: string;
        link: string;
        price: number;
        shipping: string;
        moq: string;
        rating: number;
    }[];
}

const SupplierCard: React.FC<SupplierCardProps> = ({ suppliers }) => {
  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Truck className="text-emerald-400" size={20} /> Sourcing Options
        </h3>
        <div className="space-y-3">
            {suppliers && suppliers.length > 0 ? (
                suppliers.map((sup, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-emerald-500/30 transition-all group">
                        <div>
                            <div className="font-bold text-white text-sm mb-0.5">{sup.name}</div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>${sup.price}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                <span>{sup.shipping}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                <span className="flex items-center gap-0.5 text-amber-500"><Star size={10} fill="currentColor"/> {sup.rating}</span>
                            </div>
                        </div>
                        <a 
                            href={sup.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                        >
                            <ExternalLink size={16} />
                        </a>
                    </div>
                ))
            ) : (
                <div className="text-sm text-slate-500 text-center py-4">
                    No suppliers found.
                </div>
            )}
        </div>
    </div>
  );
};

export default SupplierCard;
