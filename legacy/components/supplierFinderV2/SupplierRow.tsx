
import React from 'react';
import { SupplierV2 } from '../../types';
import { ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';

interface SupplierRowProps {
  supplier: SupplierV2;
  onClick: () => void;
}

const SupplierRow: React.FC<SupplierRowProps> = ({ supplier, onClick }) => {
  return (
    <tr 
      onClick={onClick}
      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer group"
    >
      <td className="py-4 px-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                <img 
                    src={supplier.productImages[0] || `https://picsum.photos/seed/${supplier.name}/100/100`} 
                    alt={supplier.name} 
                    className="w-full h-full object-cover"
                />
           </div>
           <div>
               <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{supplier.name}</div>
               <div className="text-xs text-slate-500">{supplier.warehouseLocations.slice(0,2).join(', ')}</div>
           </div>
        </div>
      </td>
      <td className="py-4 px-6 text-slate-300 font-mono font-medium">{supplier.price}</td>
      <td className="py-4 px-6 text-slate-400 text-sm">{supplier.shippingTimeEstimated}</td>
      <td className="py-4 px-6">
          <span className="text-amber-400 font-bold text-sm">{supplier.rating}/5.0</span>
      </td>
      <td className="py-4 px-6">
         {supplier.verifiedSeller ? (
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                 <ShieldCheck size={12}/> Verified
             </span>
         ) : (
             <span className="text-xs text-slate-500">-</span>
         )}
      </td>
      <td className="py-4 px-6">
          <div className="flex items-center gap-2">
               <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                   <div className="h-full rounded-full bg-blue-500" style={{width: `${supplier.productMatchConfidence}%`}}></div>
               </div>
               <span className="text-xs text-slate-400">{supplier.productMatchConfidence}%</span>
          </div>
      </td>
      <td className="py-4 px-6">
           <span className={`flex items-center gap-1.5 text-xs font-bold ${supplier.supplyChainRiskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
               {supplier.supplyChainRiskScore > 50 && <AlertTriangle size={12}/>}
               {supplier.supplyChainRiskScore > 50 ? 'High Risk' : 'Safe'}
           </span>
      </td>
      <td className="py-4 px-6">
          <button className="p-2 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-white transition-colors">
              <ExternalLink size={16}/>
          </button>
      </td>
    </tr>
  );
};

export default SupplierRow;
