
import React from 'react';
import { X, Zap, ShoppingBag, Save, ExternalLink } from 'lucide-react';
import { WinningProduct } from '@/types';
import ImageGallery from './ImageGallery';
import ScoreCircle from './ScoreCircle';
import WhyItWinsCard from './WhyItWinsCard';
import MarketPotentialCard from './MarketPotentialCard';
import SignalsCard from './SignalsCard';
import SupplierCard from './SupplierCard';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { saveIdea } from '@/services/ideaStore';

interface ProductDrawerProps {
    product: WinningProduct | null;
    onClose: () => void;
}

const ProductDrawer: React.FC<ProductDrawerProps> = ({ product, onClose }) => {
    if (!product) return null;

    const handleSave = () => {
        saveIdea({
            title: `Product: ${product.name}`,
            snippet: `Profit: $${product.profit}, Viral Score: ${product.viralScore ?? 0}, Winning Reason: ${product.winningReason ?? 'N/A'}`,
            module: 'ProductFinder',
            data: product
        });
        window.dispatchEvent(new Event('ideas-updated'));
        alert("Product saved to Ideas panel.");
    };

    return (
        <>
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 w-full lg:w-[800px] bg-slate-950 border-l border-slate-800 z-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 custom-scrollbar">

                {/* Header */}
                <div className="sticky top-0 bg-slate-950/90 backdrop-blur border-b border-slate-800 p-6 flex justify-between items-start z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{product.name}</h2>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-800">${product.price} Retail</span>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">${product.profit} Profit</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors" title="Save Idea">
                            <Save size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">

                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center gap-4">
                            <ScoreCircle score={product.viralScore ?? 0} />
                            <div>
                                <div className="text-lg font-bold text-white">Viral Score</div>
                                <div className="text-xs text-slate-500">Based on social signals</div>
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Saturation</div>
                            <div className="text-2xl font-bold text-white mb-2">{product.saturation ?? 0}%</div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full" style={{ width: `${product.saturation ?? 0}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-col justify-center">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Competitors</div>
                            <div className="flex items-center gap-2">
                                <ShoppingBag className="text-indigo-400" size={20} />
                                <span className="text-2xl font-bold text-white">{product.shopifyStoreCount ?? 0}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">Active Stores</div>
                        </div>
                    </div>

                    <ImageGallery images={product.productImages} name={product.name} />

                    {/* Sales Chart */}
                    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-4">7-Day Sales Trend</h3>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={product.salesData ?? []}>
                                    <defs>
                                        <linearGradient id="colorSalesDrawer" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                                    <XAxis dataKey="day" stroke="#475569" tickLine={false} axisLine={false} fontSize={10} />
                                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fill="url(#colorSalesDrawer)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <WhyItWinsCard reason={product.winningReason ?? 'N/A'} benefits={product.benefits ?? []} angles={product.angles ?? []} />
                        <MarketPotentialCard potentialText={product.marketPotential ?? 'N/A'} saturation={product.saturation ?? 0} competition={product.competition ?? 0} />
                    </div>

                    <SignalsCard tiktok={product.tiktokSignals ?? []} amazon={product.amazonSignals ?? []} aliexpress={product.aliExpressSignals ?? []} />

                    <SupplierCard suppliers={product.suppliers ?? []} />

                    {/* Actions Footer */}
                    <div className="flex gap-4 sticky bottom-6 bg-slate-950/80 backdrop-blur-md p-4 border-t border-slate-800 rounded-2xl z-20">
                        <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                            <Zap size={18} fill="currentColor" /> Add to Auto-Pilot
                        </button>
                        {product.suppliers && product.suppliers.length > 0 && (
                            <a
                                href={product.suppliers[0].link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                View Supplier <ExternalLink size={16} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProductDrawer;
