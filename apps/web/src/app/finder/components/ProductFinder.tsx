'use client';

import React, { useState } from 'react';
import FiltersBar from './FiltersBar';
import ProductTable from './ProductTable';
import ProductDrawer from './ProductDrawer';
import ComparisonModal from './ComparisonModal';
import { WinningProduct } from '@/types';
import { analyzeNiche } from '@/services/apiClient';
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
            const data = await analyzeNiche(niche);

            // Map WorkerProduct to WinningProduct
            const mappedProducts: WinningProduct[] = data.products.map(p => ({
                id: p.id,
                name: p.name,
                description: `Found in ${p.niche_tag}`,
                category: p.niche_tag,
                productImages: [p.image],
                price: p.price,
                cost: p.total_cost,
                profit: p.projected_profit,
                roi: 0, // Placeholder
                saturation: 50, // Placeholder
                competition: 50, // Placeholder
                viralScore: 85, // Placeholder
                shopifyStoreCount: 10, // Placeholder
                salesData: [], // Placeholder
                winningReason: "High margin potential",
                marketPotential: "Growing",
                benefits: ["High Profit", "Fast Shipping", "Reliable Supplier"],
                angles: ["Viral", "Problem Solver"],
                aliExpressSignals: [],
                amazonSignals: [],
                tiktokSignals: [],
                suppliers: [{
                    name: "AliExpress Supplier",
                    link: "#",
                    price: p.price,
                    shipping: `${p.shipping} days`,
                    moq: "1",
                    rating: p.supplier_rating
                }],
                // Worker specific fields
                shipping: p.shipping,
                supplier_rating: p.supplier_rating,
                total_cost: p.total_cost,
                target_selling_price: p.target_selling_price,
                projected_profit: p.projected_profit,
                margin_percent: p.margin_percent,
                niche_tag: p.niche_tag,
                source: p.source
            }));

            setProducts(mappedProducts);
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
                    <ShoppingBag className="text-indigo-500" size={32} /> Product Finder Pro
                </h2>
                <p className="text-slate-400">Deep-dive market intelligence database. Find winners before they go viral.</p>
            </div>

            <FiltersBar onSearch={handleSearch} />

            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
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
                            <CheckCircle2 size={16} /> Compare
                        </button>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="text-slate-400 hover:text-white px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <X size={16} /> Clear
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductFinderV2;