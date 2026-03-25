
import React, { useState } from 'react';
import { findSuppliers } from '../services/geminiService';
import { Supplier } from '../types';
import { Search, Loader2, ExternalLink, Truck, Package, Star, ShieldCheck, Globe, DollarSign, ArrowRight } from 'lucide-react';

const SupplierFinder: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setSuppliers([]);
    try {
      const jsonStr = await findSuppliers(query);
      const parsed = JSON.parse(jsonStr);
      setSuppliers(parsed);
    } catch (e) {
      console.error(e);
      alert("Failed to find suppliers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-up duration-500 pb-20">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center justify-center gap-3">
           <Truck className="text-blue-400" /> Global Supplier Finder
        </h2>
        <p className="text-slate-400 text-lg">
           Source verified manufacturers and dropshipping partners from AliExpress, Alibaba, and CJ Dropshipping using AI Search Grounding.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto glass-panel p-2 rounded-2xl flex gap-2 shadow-xl shadow-blue-900/10">
         <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter product name (e.g. 'Portable Neck Fan')..."
            className="flex-1 bg-transparent border-none text-white px-6 py-3 text-lg focus:ring-0 placeholder:text-slate-600"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
         />
         <button 
            onClick={handleSearch}
            disabled={loading || !query}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
         >
             {loading ? <Loader2 className="animate-spin" /> : <Search size={20}/>}
             Find
         </button>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {suppliers.map((supplier, idx) => (
             <div key={idx} className="glass-panel p-6 rounded-2xl hover:border-blue-500/30 transition-all group flex flex-col">
                 <div className="flex justify-between items-start mb-4">
                     <div>
                         <h3 className="font-bold text-white text-lg">{supplier.name}</h3>
                         <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                             <Globe size={12}/> {supplier.location || 'International'}
                         </div>
                     </div>
                     {supplier.isVerified && (
                         <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-emerald-500/20">
                             <ShieldCheck size={12}/> Verified
                         </span>
                     )}
                 </div>

                 <div className="space-y-3 mb-6 flex-1">
                     <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                         <span className="text-slate-400 flex items-center gap-2"><DollarSign size={14}/> Est. Cost</span>
                         <span className="text-white font-mono font-bold">{supplier.price}</span>
                     </div>
                     <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                         <span className="text-slate-400 flex items-center gap-2"><Truck size={14}/> Shipping</span>
                         <span className="text-white">{supplier.shippingTime || 'Unknown'}</span>
                     </div>
                     <div className="flex justify-between text-sm border-b border-white/5 pb-2">
                         <span className="text-slate-400 flex items-center gap-2"><Package size={14}/> MOQ</span>
                         <span className="text-white">{supplier.moq || '1 Unit'}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-400 flex items-center gap-2"><Star size={14}/> Rating</span>
                         <span className="text-amber-400 font-bold">{supplier.rating || '4.5'}/5.0</span>
                     </div>
                 </div>

                 <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 mb-4">
                     <p className="text-xs text-slate-400 italic line-clamp-2">"{supplier.notes}"</p>
                 </div>

                 <a 
                    href={supplier.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 group-hover:bg-blue-600"
                 >
                     View Supplier <ExternalLink size={16}/>
                 </a>
             </div>
         ))}
      </div>

      {!loading && suppliers.length === 0 && (
          <div className="text-center py-20 text-slate-500">
              <Package size={48} className="mx-auto mb-4 opacity-20"/>
              <p>Enter a product above to source global suppliers.</p>
          </div>
      )}
    </div>
  );
};

export default SupplierFinder;
