
import React from 'react';
import { SupplierV2 } from '../../types';
import SupplierRow from './SupplierRow';
import { PackageOpen } from 'lucide-react';

interface SupplierTableProps {
  suppliers: SupplierV2[];
  onSelect: (s: SupplierV2) => void;
}

const SupplierTable: React.FC<SupplierTableProps> = ({ suppliers, onSelect }) => {
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
           <thead>
                <tr className="bg-slate-950/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6">Supplier</th>
                    <th className="py-4 px-6">Unit Price</th>
                    <th className="py-4 px-6">Shipping</th>
                    <th className="py-4 px-6">Rating</th>
                    <th className="py-4 px-6">Verified</th>
                    <th className="py-4 px-6">Match %</th>
                    <th className="py-4 px-6">Risk Score</th>
                    <th className="py-4 px-6">Actions</th>
                </tr>
           </thead>
           <tbody className="divide-y divide-slate-800">
               {suppliers.map((s) => (
                   <SupplierRow key={s.id} supplier={s} onClick={() => onSelect(s)} />
               ))}
           </tbody>
        </table>
      </div>
      {suppliers.length === 0 && (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center">
              <PackageOpen size={48} className="opacity-20 mb-4"/>
              <p className="font-medium">No suppliers found yet.</p>
              <p className="text-sm">Enter a product name to start sourcing.</p>
          </div>
      )}
    </div>
  );
};

export default SupplierTable;
