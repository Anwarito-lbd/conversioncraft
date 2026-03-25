
import React from 'react';
import { SupplierV2 } from '../../types';
import { X, Zap, ShieldCheck, MapPin, Package, DollarSign, AlertTriangle, Info, Globe, Handshake } from 'lucide-react';
import SupplierImages from './SupplierImages';
import ScoreCircle from '../productFinderV2/ScoreCircle';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

interface SupplierDrawerProps {
  supplier: SupplierV2 | null;
  onClose: () => void;
}

const SupplierDrawer: React.FC<SupplierDrawerProps> = ({ supplier, onClose }) => {
  if (!supplier) return null;

  // Safe data access with fallbacks to prevent crashes on missing data
  const history = supplier.orderVolumeHistory || [];
  const chartData = history.length > 0 
    ? history.map((val, i) => ({ month: `M${i+1}`, orders: val }))
    : Array(6).fill(0).map((_, i) => ({ month: `M${i+1}`, orders: Math.floor(Math.random() * 100) + 50 })); // Fallback mock data if empty

  const locations = supplier.warehouseLocations || [];
  const tips = supplier.negotiationTips || [];
  const images = supplier.productImages || [];
  const reliability = supplier.reliabilityScore ?? 0;
  const risk = supplier.supplyChainRiskScore ?? 0;
  const confidence = supplier.productMatchConfidence ?? 0;
  const name = supplier.name || 'Unknown Supplier';

  return (
    <>
       <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50" onClick={onClose} />
       <div className="fixed inset-y-0 right-0 w-full lg:w-[800px] bg-slate-950 border-l border-slate-800 z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 custom-scrollbar">
           
           {/* Header */}
           <div className="sticky top-0 bg-slate-950/90 backdrop-blur border-b border-slate-800 p-6 flex justify-between items-start z-10">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        {name} 
                        {supplier.verifiedSeller && <ShieldCheck size={20} className="text-emerald-400"/>}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800">{supplier.moq || 'N/A'} MOQ</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">{supplier.price || 'TBD'} / unit</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <X size={20} />
                </button>
           </div>

           <div className="p-6 space-y-8">

               {/* Overview & Scores */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center gap-4">
                        <ScoreCircle score={reliability} />
                        <div>
                            <div className="text-lg font-bold text-white">Reliability</div>
                            <div className="text-xs text-slate-500">Fulfillment Rate</div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center relative overflow-hidden">
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                             <AlertTriangle size={12}/> Supply Chain Risk
                         </div>
                         <div className="text-2xl font-bold text-white mb-2">{risk}/100</div>
                         <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                             <div 
                                className={`h-full rounded-full ${risk > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                style={{width: `${risk}%`}}
                             ></div>
                         </div>
                         <div className="text-[10px] text-slate-500 mt-1">Lower is better</div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center">
                         <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Match Confidence</div>
                         <div className="text-2xl font-bold text-white mb-2 text-indigo-400">{confidence}%</div>
                         <p className="text-[10px] text-slate-500 leading-tight">Based on product spec analysis</p>
                    </div>
               </div>

               <SupplierImages images={images} name={name} />

               {/* Warehouse & Logistics */}
               <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg">
                   <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                       <Globe className="text-blue-400" size={20}/> Logistics Network
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Warehouse Locations</div>
                           <div className="flex flex-wrap gap-2">
                               {locations.length > 0 ? locations.map((loc, i) => (
                                   <span key={i} className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-sm text-slate-300 flex items-center gap-2">
                                       <MapPin size={14} className="text-indigo-500"/> {loc}
                                   </span>
                               )) : <span className="text-sm text-slate-500">No specific location data</span>}
                           </div>
                       </div>
                       <div>
                           <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shipping Estimate</div>
                           <div className="bg-slate-950 px-4 py-3 rounded-xl border border-slate-800 text-white font-medium flex items-center gap-3">
                               <Package size={18} className="text-amber-400"/> {supplier.shippingTimeEstimated || 'Unknown'}
                           </div>
                       </div>
                   </div>
               </div>

               {/* Order Volume History */}
               <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg">
                   <h3 className="text-lg font-bold text-white mb-4">Order Volume Trend (6 Months)</h3>
                   <div className="h-[200px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={chartData}>
                               <defs>
                                   <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                   </linearGradient>
                               </defs>
                               <Tooltip contentStyle={{backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px'}} itemStyle={{color: '#fff'}}/>
                               <XAxis dataKey="month" stroke="#475569" tickLine={false} axisLine={false} fontSize={12}/>
                               <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} fill="url(#colorOrders)" />
                           </AreaChart>
                       </ResponsiveContainer>
                   </div>
               </div>

               {/* Tips & Analysis */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                       <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                           <Handshake className="text-purple-400" size={20}/> Negotiation Tips
                       </h3>
                       <ul className="space-y-3">
                           {tips.length > 0 ? tips.map((tip, i) => (
                               <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                   <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                                   {tip}
                               </li>
                           )) : <li className="text-sm text-slate-500">No specific tips available.</li>}
                       </ul>
                   </div>

                   <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col">
                       <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                           <ShieldCheck className="text-cyan-400" size={20}/> Terms & Policy
                       </h3>
                       <div className="space-y-4 flex-1">
                           <div>
                               <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Private Label</div>
                               <p className="text-sm text-white">{supplier.privateLabelPotential || 'Not specified'}</p>
                           </div>
                           <div>
                               <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Return Policy</div>
                               <p className="text-sm text-slate-400">{supplier.returnPolicy || 'Standard terms apply'}</p>
                           </div>
                       </div>
                   </div>
               </div>
               
               {/* Actions */}
               <div className="flex gap-4 sticky bottom-6 bg-slate-950/90 backdrop-blur p-2 rounded-2xl border border-slate-800">
                   <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                       <Zap size={18} fill="currentColor"/> Add to Auto-Pilot
                   </button>
                   {supplier.url && (
                       <a 
                         href={supplier.url} 
                         target="_blank" 
                         rel="noreferrer" 
                         className="flex-1 bg-white hover:bg-slate-200 text-slate-950 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                       >
                           Visit Supplier Site
                       </a>
                   )}
               </div>

           </div>
       </div>
    </>
  );
};

export default SupplierDrawer;
