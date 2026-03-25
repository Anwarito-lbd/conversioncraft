
import React, { useState } from 'react';
import { analyzeCompetitor } from '../services/geminiService';
import { CompetitorAnalysis } from '../../types';
import { Search, Loader2, ShieldCheck, Skull, Crosshair, Zap } from 'lucide-react';

export const WarRoom: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CompetitorAnalysis | null>(null);

  const handleScan = async () => {
    if (!url) return;
    setLoading(true);
    try {
        const { data } = await analyzeCompetitor(url);
        setReport(data);
    } catch (e) {
        console.error(e);
        alert("Scan failed. Please check the URL.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Crosshair size={32} className="text-rose-500" /> The War Room
          </h2>
          <p className="text-slate-400 mt-2 font-mono text-sm">Forensic Competitor Intelligence & Threat Analysis.</p>
        </div>
      </div>

      {/* Scanner Input */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-slate-500" size={20} />
            </div>
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter Enemy URL (e.g. competitor-store.com)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
            />
          </div>
          <button 
            onClick={handleScan}
            disabled={loading}
            className="bg-rose-600 hover:bg-rose-500 text-white px-8 rounded-xl font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.3)]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Skull size={20} />}
            {loading ? 'Scanning...' : 'Scan Target'}
          </button>
        </div>
      </div>

      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Viral Score Gauge */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors" />
            <h3 className="text-slate-400 font-mono text-xs uppercase tracking-widest mb-4">Viral Threat Level</h3>
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                <circle 
                  cx="80" cy="80" r="70" 
                  stroke={report.viralScore > 80 ? '#f43f5e' : '#f59e0b'} 
                  strokeWidth="10" 
                  fill="transparent" 
                  strokeDasharray="440" 
                  strokeDashoffset={440 - (440 * report.viralScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <span className="absolute text-4xl font-black text-white">{report.viralScore}</span>
            </div>
            <div className="mt-4 px-3 py-1 rounded bg-slate-800 text-xs text-slate-300 font-mono border border-slate-700">
              Traffic: <span className="text-emerald-400">{report.trafficIntel?.monthlyVisits || 'N/A'}</span>
            </div>
          </div>

          {/* Weakness Analysis */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
            <h3 className="text-white font-bold flex items-center gap-2 mb-6">
              <ShieldCheck className="text-emerald-400" size={20} /> Vulnerabilities Detected
            </h3>
            <ul className="space-y-4">
              {(report.swot?.weaknesses || []).map((w, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  {w}
                </li>
              ))}
              {(!report.swot?.weaknesses || report.swot.weaknesses.length === 0) && (
                  <li className="text-slate-500 text-sm italic">No specific weaknesses detected.</li>
              )}
            </ul>
          </div>

          {/* Tactical Attack Plan */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-transparent" />
            <h3 className="text-white font-bold flex items-center gap-2 mb-6">
              <Zap className="text-amber-400" size={20} /> Counter-Attack Plan
            </h3>
            <div className="space-y-4">
              {(report.adHooks || []).map((hook, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <div className="text-[10px] font-mono text-indigo-400 uppercase mb-1">Recommended Hook {i + 1}</div>
                  <p className="text-white font-medium text-sm">"{hook}"</p>
                </div>
              ))}
               {(!report.adHooks || report.adHooks.length === 0) && (
                  <p className="text-slate-500 text-sm italic">No specific counter-hooks generated.</p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
