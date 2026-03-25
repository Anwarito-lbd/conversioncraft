import React from 'react';
import { WinningProduct } from '@/types';
import ProductRow from './ProductRow';
import { PackageOpen } from 'lucide-react';

interface ProductTableProps {
    products: WinningProduct[];
    onProductClick: (p: WinningProduct) => void;
    selectedIds: string[];
    onToggleSelect: (id: string) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, onProductClick, selectedIds, onToggleSelect }) => {
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-950/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                        <th className="py-4 px-4 w-10">
                           {/* Optional: Select All could go here */}
                        </th>
                        <th className="py-4 px-6">Product</th>
                        <th className="py-4 px-6">Price</th>
                        <th className="py-4 px-6">Profit</th>
                        <th className="py-4 px-6">ROI</th>
                        <th className="py-4 px-6">Saturation</th>
                        <th className="py-4 px-6">Competition</th>
                        <th className="py-4 px-6">Viral Score</th>
                        <th className="py-4 px-6">7-Day Trend</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {products.map((product) => (
                        <ProductRow 
                            key={product.id} 
                            product={product} 
                            onClick={() => onProductClick(product)} 
                            selected={selectedIds.includes(product.id)}
                            onToggleSelect={() => onToggleSelect(product.id)}
                        />
                    ))}
                </tbody>
            </table>
        </div>
        {products.length === 0 && (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <PackageOpen size={48} className="mb-4 opacity-20"/>
                <p>No products found. Try adjusting filters or search term.</p>
            </div>
        )}
    </div>
  );
};

export default ProductTable;