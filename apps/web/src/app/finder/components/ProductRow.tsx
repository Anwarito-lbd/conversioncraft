
import React from 'react';
import { WinningProduct } from '@/types';
import SalesChart from './SalesChart';

interface ProductRowProps {
    product: WinningProduct;
    onClick: () => void;
    selected: boolean;
    onToggleSelect: () => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, onClick, selected, onToggleSelect }) => {
    // Helper to handle broken images
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = `https://placehold.co/100x100/1e293b/FFFFFF?text=${encodeURIComponent(product.name.substring(0, 10))}`;
        e.currentTarget.onerror = null; // Prevent infinite loop
    };

    return (
        <tr
            onClick={onClick}
            className={`border-b border-slate-800 transition-colors cursor-pointer group ${selected ? 'bg-indigo-900/10 hover:bg-indigo-900/20' : 'hover:bg-slate-800/50'}`}
        >
            <td className="py-4 px-4 w-10" onClick={(e) => e.stopPropagation()}>
                <div
                    onClick={onToggleSelect}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 hover:border-slate-400'}`}
                >
                    {selected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
            </td>
            <td className="py-4 px-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                        <img
                            src={product.productImages[0]}
                            onError={handleImageError}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className={`font-bold transition-colors ${selected ? 'text-indigo-400' : 'text-white group-hover:text-indigo-400'}`}>{product.name}</span>
                </div>
            </td>
            <td className="py-4 px-6 text-slate-300 font-mono">${product.price}</td>
            <td className="py-4 px-6 text-emerald-400 font-mono font-bold">+${product.profit}</td>
            <td className="py-4 px-6 text-slate-300">{product.roi ?? 0}x</td>
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${(product.saturation ?? 0) > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${product.saturation ?? 0}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500">{product.saturation ?? 0}%</span>
                </div>
            </td>
            <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                    <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${product.competition ?? 0}%` }}></div>
                    </div>
                    <span className="text-xs text-slate-500">{product.competition ?? 0}%</span>
                </div>
            </td>
            <td className="py-4 px-6">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${(product.viralScore ?? 0) > 80 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    {product.viralScore ?? 0}
                </span>
            </td>
            <td className="py-4 px-6">
                <SalesChart data={product.salesData ?? []} />
            </td>
        </tr>
    );
};

export default ProductRow;
