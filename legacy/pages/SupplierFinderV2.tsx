
import React, { useState, useEffect } from 'react';
import { findSuppliersV2, findArbitrageOpportunities } from '../services/geminiService';
import { SupplierV2, ArbitrageOpportunity } from '../types';
import { Search, Loader2, Globe, Filter, Truck, TrendingUp, ArrowRight, DollarSign } from 'lucide-react';
import SupplierTable from '../components/supplierFinderV2/SupplierTable';
import SupplierDrawer from '../components/supplierFinderV2/SupplierDrawer';

const SupplierFinderV2: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'SOURCING' | 'ARBITRAGE'>('SOURCING');
  
  const [suppliers, setSuppliers] = useState<SupplierV2[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierV2 | null>(null);
  
  const [arbitrageOps, setArbitrageOps] = useState<ArbitrageOpportunity[]>([]);

  // Auto-search if URL param exists (Integration with ProductFinderV2)
  useEffect(() => {
      const searchParams = new URLSearchParams(window.location.search);
      const product = searchParams.get('product');
      if (product) {
          setQuery(product);
          handleSearch(product);
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
      }
  }, []);

  const handleSearch = async (searchTerm: string) => {
      if (!searchTerm) return;
      setLoading(true);
      
      if (mode === 'SOURCING') {
          setSuppliers([]);
          try {
              const jsonStr = await findSuppliersV2(searchTerm);
              const parsed = JSON.parse(jsonStr);
              setSuppliers(parsed);
          } catch (e) {
              console.error(e);
              alert("Failed to find suppliers.");
          } finally {
              setLoading(false);
          }
      } else {
          setArbitrageOps([]);
          try {
              const ops = await findArbitrageOpportunities(searchTerm);
              setArbitrageOps(ops);
          } catch (e) {
              console.error(e);
              alert("Arbitrage scan failed.");
          } finally {
              setLoading(false);
          }
      }
  };

  return (
    <div className="pb-20 animate-in fade-in-up duration-500">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 mb-2">
                    <Truck className="text-blue-500" size={32}/> Global Sourcing & Arbitrage
                </h2>
                <p className="text-slate-400">Source verified manufacturers or find instant price arbitrage gaps.</p>
            </div>
            
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button 
                  onClick={() => setMode('SOURCING')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'SOURCING' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    Direct Sourcing
                </button>
                <button 
                   onClick={() => setMode('ARBITRAGE')}
                   className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'ARBITRAGE' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                    <DollarSign size={14}/> Arbitrage Hunter
                </button>
            </div>
        </div>

        {/* Search Bar */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 shadow-lg mb-8">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                    placeholder={mode === 'SOURCING' ? "Search for a product to source (e.g. 'Wireless Earbuds')..." : "Enter a niche to scan for price gaps (e.g. 'Kitchen Gadgets')..."}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-12 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => handleSearch(query)}
                    disabled={loading || !query}
                    className={`px-8 py-3 text-white rounded-xl font-bold shadow-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${mode === 'SOURCING' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'}`}
                >
                    {loading ? <Loader2 className="animate-spin"/> : (mode === 'SOURCING' ? <Globe size={18}/> : <TrendingUp size={18}/>)}
                    {mode === 'SOURCING' ? 'Source' : 'Scan Gaps'}
                </button>
            </div>
        </div>

        {loading ? (
             <div className="h-96 flex flex-col items-center justify-center text-slate-500">
                <Loader2 size={48} className={`animate-spin mb-4 ${mode === 'SOURCING' ? 'text-blue-500' : 'text-emerald-500'}`}/>
                <p className="font-medium text-lg">{mode === 'SOURCING' ? 'Analyzing Global Supply Chain...' : 'Scanning Marketplaces for Arbitrage...'}</p>
                <p className="text-sm">{mode === 'SOURCING' ? 'Verifying warehouses, checking MOQs, and assessing risk scores.' : 'Comparing AliExpress vs Amazon prices in real-time.'}</p>
             </div>
        ) : mode === 'SOURCING' ? (
            <>
                <SupplierTable suppliers={suppliers} onSelect={setSelectedSupplier} />
                <SupplierDrawer supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} />
            </>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {arbitrageOps.map((op) => (
                    <div key={op.id} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-bl-xl">
                            {op.confidenceScore}% Match
                        </div>
                        
                        <h3 className="text-lg font-bold text-white mb-4 pr-12 line-clamp-1">{op.productName}</h3>
                        
                        <div className="flex items-center justify-between mb-6 bg-slate-950/50 p-4 rounded-xl border border-white/5">
                            <div className="text-center">
                                <div className="text-xs text-slate-500 uppercase">Source</div>
                                <div className="text-xl font-mono text-slate-300">${op.sourcePrice}</div>
                            </div>
                            <ArrowRight className="text-slate-600"/>
                            <div className="text-center">
                                <div className="text-xs text-slate-500 uppercase">Target</div>
                                <div className="text-xl font-mono text-emerald-400">${op.targetPrice}</div>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <Globe size={14}/> {op.platform}
                            </div>
                            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-lg font-bold text-sm">
                                +${op.margin} Margin
                            </div>
                        </div>
                        
                        <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all">
                            Capitalize Now
                        </button>
                    </div>
                ))}
                {arbitrageOps.length === 0 && !loading && (
                    <div className="col-span-full text-center py-20 text-slate-500">
                        <TrendingUp size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Enter a niche to scan for price discrepancies.</p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default SupplierFinderV2;
