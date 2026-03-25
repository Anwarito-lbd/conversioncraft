
import React, { useState, useEffect } from 'react';
import FiltersBar from '../components/productFinderV2/FiltersBar';
import ProductTable from '../components/productFinderV2/ProductTable';
import ProductDrawer from '../components/productFinderV2/ProductDrawer';
import ComparisonModal from '../components/productFinderV2/ComparisonModal';
import SupplierTable from '../components/supplierFinderV2/SupplierTable';
import SupplierDrawer from '../components/supplierFinderV2/SupplierDrawer';
import { BusinessModel, WinningProduct, SupplierV2, ArbitrageOpportunity } from '../types';
import { findWinningProducts, findWinningServices, findSuppliersV2, findArbitrageOpportunities } from '../services/geminiService';
import { ShoppingBag, Loader2, CheckCircle2, X, Sparkles, Zap, Lightbulb, Truck, TrendingUp, Globe, Search, DollarSign, ArrowRight } from 'lucide-react';

interface ProductFinderProps {
    businessModel: BusinessModel | null;
}

enum ResearchTab {
    DISCOVERY = 'DISCOVERY',
    SOURCING = 'SOURCING',
    ARBITRAGE = 'ARBITRAGE'
}

const ProductFinder: React.FC<ProductFinderProps> = ({ businessModel }) => {
  const [activeTab, setActiveTab] = useState<ResearchTab>(ResearchTab.DISCOVERY);
  const [loading, setLoading] = useState(false);
  
  // Discovery State
  const [products, setProducts] = useState<WinningProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<WinningProduct | null>(null);
  const [currentNiche, setCurrentNiche] = useState('Global Viral Trends');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isComparisonComparisonOpen, setIsComparisonOpen] = useState(false);

  // Sourcing State
  const [supplierQuery, setSupplierQuery] = useState('');
  const [suppliers, setSuppliers] = useState<SupplierV2[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierV2 | null>(null);
  const [arbitrageOps, setArbitrageOps] = useState<ArbitrageOpportunity[]>([]);

  const isService = businessModel === BusinessModel.DROPSERVICING;

  // Auto-load trending products on mount
  useEffect(() => {
    handleDiscoverySearch("Global Viral Trends");
  }, [businessModel]);

  const handleDiscoverySearch = async (niche: string) => {
      if (!niche) return;
      setLoading(true);
      setCurrentNiche(niche);
      setProducts([]);
      setSelectedIds([]);
      try {
          let jsonStr = "";
          if (isService) {
              jsonStr = await findWinningServices(niche);
          } else {
              jsonStr = await findWinningProducts(niche);
          }
          const parsed = JSON.parse(jsonStr);
          setProducts(parsed);
      } catch (e) {
          console.error(e);
          alert("Failed to fetch market data.");
      } finally {
          setLoading(false);
      }
  }

  const handleSourcingSearch = async (query: string) => {
      if (!query) return;
      setLoading(true);
      setSuppliers([]);
      setArbitrageOps([]);
      try {
          if (activeTab === ResearchTab.SOURCING) {
              const jsonStr = await findSuppliersV2(query);
              setSuppliers(JSON.parse(jsonStr));
          } else if (activeTab === ResearchTab.ARBITRAGE) {
              const ops = await findArbitrageOpportunities(query);
              setArbitrageOps(ops);
          }
      } catch (e) {
          console.error(e);
          alert("Sourcing scan failed.");
      } finally {
          setLoading(false);
      }
  };

  const toggleSelection = (id: string) => {
      setSelectedIds(prev => 
          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
  }

  const getSelectedProducts = () => {
      return products.filter(p => selectedIds.includes(p.id));
  }

  return (
    <div className="pb-24 animate-in fade-in-up duration-500 relative">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 mb-2">
                    {isService ? <Lightbulb className="text-amber-500" size={32}/> : <ShoppingBag className="text-indigo-500" size={32}/>}
                    Product Research
                </h2>
                <p className="text-slate-400">
                    Integrated market analysis and global supply chain sourcing.
                </p>
            </div>
            
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                {[
                    { id: ResearchTab.DISCOVERY, label: 'Find Winners', icon: Sparkles },
                    // Hidden as requested
                    // { id: ResearchTab.SOURCING, label: 'Find Suppliers', icon: Truck },
                    // { id: ResearchTab.ARBITRAGE, label: 'Arbitrage', icon: TrendingUp },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <tab.icon size={16}/> {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* --- DISCOVERY TAB --- */}
        {activeTab === ResearchTab.DISCOVERY && (
            <>
                <FiltersBar onSearch={handleDiscoverySearch} />

                {!loading && products.length > 0 && currentNiche === 'Global Viral Trends' && (
                    <div className="mb-6 p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 relative overflow-hidden group">
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <Zap className="text-indigo-400" size={24} fill="currentColor"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Trending Opportunity Radar</h3>
                                <p className="text-slate-400 text-sm max-w-3xl">
                                    Top 10 {isService ? 'services' : 'products'} showing signs of breakout velocity.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="h-96 flex flex-col items-center justify-center text-slate-500 rounded-3xl border border-slate-800 bg-slate-900/50">
                        <Loader2 size={48} className="animate-spin text-indigo-500 mb-4"/>
                        <p className="font-bold text-xl text-white mb-2">Analyzing Market Trends...</p>
                        <p className="text-sm text-slate-400">Processing social signals and sales volume.</p>
                    </div>
                ) : (
                    <ProductTable 
                        products={products} 
                        onProductClick={setSelectedProduct} 
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelection}
                    />
                )}

                <ProductDrawer product={selectedProduct} onClose={() => setSelectedProduct(null)} />

                {isComparisonComparisonOpen && (
                    <ComparisonModal 
                        products={getSelectedProducts()} 
                        onClose={() => setIsComparisonOpen(false)} 
                    />
                )}

                {selectedIds.length > 0 && !isComparisonComparisonOpen && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-slate-700 shadow-2xl rounded-full px-6 py-3 flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                                {selectedIds.length}
                            </div>
                            <span className="text-white font-medium text-sm">Selected</span>
                        </div>
                        <div className="h-6 w-px bg-slate-700"></div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setIsComparisonOpen(true)}
                                className="bg-white hover:bg-slate-200 text-slate-950 px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2"
                            >
                                <CheckCircle2 size={16}/> Compare
                            </button>
                            <button 
                                onClick={() => setSelectedIds([])}
                                className="text-slate-400 hover:text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}
            </>
        )}

        {/* --- SOURCING & ARBITRAGE TABS (HIDDEN BUT LOGIC RETAINED) --- */}
        {(activeTab === ResearchTab.SOURCING || activeTab === ResearchTab.ARBITRAGE) && (
            <>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 shadow-sm mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
                        <input 
                            type="text"
                            value={supplierQuery}
                            onChange={(e) => setSupplierQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSourcingSearch(supplierQuery)}
                            placeholder={activeTab === ResearchTab.SOURCING ? "Search product to source (e.g. 'Wireless Earbuds')..." : "Enter niche to scan gaps (e.g. 'Kitchen Gadgets')..."}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-12 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                    <button 
                        onClick={() => handleSourcingSearch(supplierQuery)}
                        disabled={loading || !supplierQuery}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin"/> : <Search size={18}/>}
                        {activeTab === ResearchTab.SOURCING ? 'Find Suppliers' : 'Scan Prices'}
                    </button>
                </div>

                {loading ? (
                     <div className="h-96 flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-3xl border border-slate-800">
                        <Loader2 size={48} className="animate-spin mb-4 text-indigo-500"/>
                        <p className="font-medium text-lg">Scanning Global Supply Chain...</p>
                     </div>
                ) : activeTab === ResearchTab.SOURCING ? (
                    <>
                        <SupplierTable suppliers={suppliers} onSelect={setSelectedSupplier} />
                        <SupplierDrawer supplier={selectedSupplier} onClose={() => setSelectedSupplier(null)} />
                    </>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {arbitrageOps.map((op) => (
                            <div key={op.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-white line-clamp-1 pr-4">{op.productName}</h3>
                                    <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2 py-1 rounded border border-emerald-500/20">
                                        {op.confidenceScore}% Match
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Source</div>
                                        <div className="text-lg font-mono text-slate-300">${op.sourcePrice}</div>
                                    </div>
                                    <ArrowRight className="text-slate-600" size={16}/>
                                    <div className="text-center">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">Target</div>
                                        <div className="text-lg font-mono text-emerald-400">${op.targetPrice}</div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Globe size={14}/> {op.platform}
                                    </div>
                                    <span className="text-white font-bold">+${op.margin} Margin</span>
                                </div>
                            </div>
                        ))}
                        {arbitrageOps.length === 0 && !loading && (
                            <div className="col-span-full text-center py-20 text-slate-500">
                                <p>Enter a niche above to scan for price discrepancies.</p>
                            </div>
                        )}
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default ProductFinder;
