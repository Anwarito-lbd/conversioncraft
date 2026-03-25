import React from 'react';
import { WinningProduct } from '../../types';
import { X, Check, Minus, TrendingUp, AlertTriangle, DollarSign, ShoppingBag } from 'lucide-react';

interface ComparisonModalProps {
  products: WinningProduct[];
  onClose: () => void;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({ products, onClose }) => {
  if (products.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="text-indigo-500" /> Compare Products
            </h2>
            <p className="text-slate-400 text-sm">Analyzing {products.length} selected opportunities side-by-side.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-6">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="p-4 w-48 bg-slate-900 sticky left-0 z-10 border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Metric
                </th>
                {products.map(p => (
                  <th key={p.id} className="p-4 min-w-[200px] border-b border-slate-800 align-top">
                    <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 mb-3">
                      <img src={p.productImages[0]} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="font-bold text-white text-lg leading-tight mb-1">{p.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{p.id.substring(0, 8)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              
              {/* Financials */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900 z-10 flex items-center gap-2">
                  <DollarSign size={14} className="text-emerald-400"/> Profitability
                </td>
                {products.map(p => (
                  <td key={p.id} className="p-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-400"><span>Price</span> <span className="text-white">${p.price}</span></div>
                      <div className="flex justify-between text-slate-400"><span>Cost</span> <span className="text-white">${p.cost}</span></div>
                      <div className="flex justify-between font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded mt-2">
                        <span>Profit</span> <span>+${p.profit}</span>
                      </div>
                      <div className="text-xs text-center text-slate-500 mt-1">ROI: {p.roi}x</div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Market Health */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900 z-10 flex items-center gap-2">
                   <AlertTriangle size={14} className="text-amber-400"/> Market Health
                </td>
                {products.map(p => (
                  <td key={p.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Saturation</span>
                          <span className={p.saturation > 60 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{p.saturation}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                           <div className={`h-full rounded-full ${p.saturation > 60 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{width: `${p.saturation}%`}}></div>
                        </div>
                      </div>
                      <div>
                         <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Competition</span>
                          <span className="text-blue-400 font-bold">{p.competition}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full rounded-full bg-blue-500" style={{width: `${p.competition}%`}}></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                         <ShoppingBag size={12}/> {p.shopifyStoreCount} Active Stores
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Viral Potential */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900 z-10 flex items-center gap-2">
                  <TrendingUp size={14} className="text-purple-400"/> Viral Potential
                </td>
                {products.map(p => (
                  <td key={p.id} className="p-4">
                    <div className="flex items-center gap-3">
                       <div className={`text-2xl font-bold ${p.viralScore > 80 ? 'text-purple-400' : 'text-slate-400'}`}>{p.viralScore}</div>
                       <div className="text-xs text-slate-500 leading-tight">AI Score based on<br/>social signals</div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Winning Reason */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900 z-10">
                   The "Why"
                </td>
                {products.map(p => (
                  <td key={p.id} className="p-4">
                     <p className="text-xs text-slate-400 italic leading-relaxed">"{p.winningReason}"</p>
                  </td>
                ))}
              </tr>

              {/* Sourcing */}
              <tr className="hover:bg-slate-800/30 transition-colors">
                <td className="p-4 font-semibold text-slate-300 sticky left-0 bg-slate-900 z-10">
                   Best Supplier
                </td>
                {products.map(p => {
                  const bestSupplier = p.suppliers[0];
                  return (
                    <td key={p.id} className="p-4">
                       {bestSupplier ? (
                         <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                            <div className="font-bold text-white text-xs truncate">{bestSupplier.name}</div>
                            <div className="flex justify-between mt-1 text-xs text-slate-500">
                               <span>${bestSupplier.price}</span>
                               <span>{bestSupplier.shipping}</span>
                            </div>
                         </div>
                       ) : <span className="text-xs text-slate-600">-</span>}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end">
           <button onClick={onClose} className="bg-white text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              Close Comparison
           </button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;