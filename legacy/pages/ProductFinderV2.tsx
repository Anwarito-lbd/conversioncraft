import React, { useState } from 'react';
import FiltersBar from '../components/productFinderV2/FiltersBar';
import ProductTable from '../components/productFinderV2/ProductTable';
import ProductDrawer from '../components/productFinderV2/ProductDrawer';
import ComparisonModal from '../components/productFinderV2/ComparisonModal';
import { WinningProduct } from '../types';
import { findWinningProducts } from '../services/geminiService';
import { ShoppingBag, Loader2, CheckCircle2, X } from 'lucide-react';

const ProductFinderV2: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<WinningProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<WinningProduct | null>(null);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const handleSearch = async (niche: string) => {
      if (!niche) return;
      setLoading(true);
      setProducts([]);
      setSelectedIds([]); // Reset selection on new search
      try {
          const jsonStr = await findWinningProducts(niche);
          const parsed = JSON.parse(jsonStr);
          setProducts(parsed);
      } catch (e) {
          console.error(e);
          alert("Failed to fetch products");
      } finally {
          setLoading(false);
      }
  }

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
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 mb-2">
                <ShoppingBag className="text-indigo-500" size={32}/> Product Finder Pro
            </h2>
            <p className="text-slate-400">Deep-dive market intelligence database. Find winners before they go viral.</p>
        </div>

        <FiltersBar onSearch={handleSearch} />

        {loading ? (
            <div className="h-96 flex flex-col items-center justify-center text-slate-500">
                <Loader2 size={48} className="animate-spin text-indigo-500 mb-4"/>
                <p className="font-medium text-lg">Scanning global markets...</p>
                <p className="text-sm">Analyzing saturation, sales volume, and social signals.</p>
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

        {isComparisonOpen && (
            <ComparisonModal 
                products={getSelectedProducts()} 
                onClose={() => setIsComparisonOpen(false)} 
            />
        )}

        {/* Floating Comparison Action Bar */}
        {selectedIds.length > 0 && !isComparisonOpen && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-slate-700 shadow-2xl shadow-black/50 rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {selectedIds.length}
                    </div>
                    <span className="text-white font-medium text-sm">Products Selected</span>
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
                        className="text-slate-400 hover:text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <X size={16}/> Clear
                    </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default ProductFinderV2;