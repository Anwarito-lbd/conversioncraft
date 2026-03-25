
import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface FiltersBarProps {
    onSearch: (term: string) => void;
}

const FiltersBar: React.FC<FiltersBarProps> = ({ onSearch }) => {
  const [term, setTerm] = React.useState('');

  const handleSubmit = () => {
      onSearch(term);
  }

  return (
    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 shadow-lg mb-6">
        <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20}/>
            <input 
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Search niche, keyword, or category..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-12 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
            />
        </div>
        <div className="flex gap-3">
            <button className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-medium flex items-center gap-2 hover:text-white hover:border-slate-700 transition-colors">
                <Filter size={18}/> Filters
            </button>
            <button className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-medium flex items-center gap-2 hover:text-white hover:border-slate-700 transition-colors">
                <ArrowUpDown size={18}/> Sort
            </button>
            <button 
                onClick={handleSubmit}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-colors"
            >
                Search
            </button>
        </div>
    </div>
  );
};

export default FiltersBar;
