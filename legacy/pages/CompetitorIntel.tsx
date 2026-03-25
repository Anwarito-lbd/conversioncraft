
import React, { useState, useEffect, useRef } from 'react';
import { analyzeCompetitor } from '../services/geminiService';
import { Search, Loader2, Video, Palette, Globe, Zap, Target, Crosshair, ShieldAlert, ArrowUpRight, Eye, MousePointer2, BarChart2, Network, DollarSign, CheckSquare, Square, Megaphone, Tag, MessageCircle, Info, Activity, HelpCircle, Facebook, Instagram, Twitter, Youtube, Swords, TrendingUp, Save, Skull, Share2, Fingerprint, Trophy } from 'lucide-react';
import { CompetitorAnalysis } from '../types';
import ScoreCircle from '../components/ScoreCircle';
import { saveIdea } from '../services/ideaStore';

const FeedItem: React.FC<{ activity: any }> = ({ activity }) => {
  const getIcon = () => {
      switch(activity.type) {
          case 'AD_LAUNCH': return <Megaphone size={14} className="text-fuchsia-400"/>;
          case 'PRICE_CHANGE': return <Tag size={14} className="text-emerald-400"/>;
          case 'VIRAL_SPIKE': return <Activity size={14} className="text-amber-400"/>;
          case 'SOCIAL_POST': return <MessageCircle size={14} className="text-blue-400"/>;
          default: return <Info size={14} className="text-slate-400"/>;
      }
  };

  return (
      <div className="relative pl-6 border-l border-slate-800 pb-6 last:pb-0 animate-in fade-in slide-in-from-left-2 group">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-indigo-500 group-hover:scale-110 transition-all">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-indigo-400"></div>
          </div>
          <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                  {getIcon()} <span>{activity.type.replace('_', ' ')}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{activity.date}</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{activity.description}</p>
          {activity.impactLevel === 'HIGH' && (
              <span className="mt-2 inline-block text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 shadow-sm shadow-rose-900/20">
                  High Impact
              </span>
          )}
      </div>
  )
}

const CompetitorIntel: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<{ data: CompetitorAnalysis; sources: string[] } | null>(null);
  
  // Gamification / Progress State
  const [completedTactics, setCompletedTactics] = useState<number[]>([]);
  
  // Refs for scrolling
  const seoRef = useRef<HTMLDivElement>(null);
  const adsRef = useRef<HTMLDivElement>(null);
  const trafficRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);

  const LOADING_STEPS = [
    "Initializing forensic scan...",
    "Intercepting traffic sources...",
    "Identifying direct competitors...",
    "Decoding ad strategy...",
    "Analyzing brand DNA...",
    "Finalizing tactical report..."
  ];

  useEffect(() => {
      let interval: any;
      if (loading) {
          interval = setInterval(() => {
              setLoadingStep(prev => (prev + 1) % LOADING_STEPS.length);
          }, 2500);
      } else {
          setLoadingStep(0);
      }
      return () => clearInterval(interval);
  }, [loading]);

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setResult(null);
    setCompletedTactics([]); 
    try {
      const data = await analyzeCompetitor(url);
      setResult(data);
    } catch (e) {
      console.error(e);
      alert("Analysis failed. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInsight = () => {
    if (!result) return;
    const summary = `Viral Score: ${result.data.viralScore}. Strategy: ${result.data.viralReasoning}. Top Attack Plan: ${result.data.attackPlan[0]?.action}`;
    saveIdea({
        title: `Intel: ${url.replace('https://', '')}`,
        snippet: summary,
        module: 'WarRoom',
        link: url,
        data: result.data
    });
    window.dispatchEvent(new Event('ideas-updated'));
    alert("Competitor intel saved to Ideas panel.");
  };

  const toggleTactic = (idx: number) => {
      setCompletedTactics(prev => 
          prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
      );
  };

  const SocialIcon = ({ platform }: { platform: string }) => {
      const p = platform.toLowerCase();
      if (p.includes('facebook')) return <Facebook size={16} />;
      if (p.includes('instagram')) return <Instagram size={16} />;
      if (p.includes('twitter') || p.includes('x')) return <Twitter size={16} />;
      if (p.includes('youtube')) return <Youtube size={16} />;
      if (p.includes('tiktok')) return <Video size={16} />; 
      return <Globe size={16} />;
  };

  const progressPercent = result?.data.attackPlan 
    ? Math.round((completedTactics.length / result.data.attackPlan.length) * 100) 
    : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in-up duration-500 pb-24 md:pb-20 relative">
      
      {/* WAR ROOM HEADER */}
      <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10 relative z-10 pt-6 md:pt-10">
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 flex items-center justify-center gap-4">
            <Target className="text-rose-500" size={36} />
            WAR ROOM
        </h2>
        <p className="text-slate-400 text-base md:text-lg px-4 font-medium tracking-wide uppercase text-xs bg-slate-900/50 inline-block py-2 px-4 rounded-full border border-white/5">
          Intelligence Engine v2.0
        </p>
      </div>

      {/* Search Interface */}
      <div className="max-w-2xl mx-auto relative z-20 mb-8 md:mb-12 px-2">
        <div className="glass-panel p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-[0_0_50px_rgba(225,29,72,0.1)] border-rose-500/20">
             <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter Enemy URL or Brand Name..."
                className="flex-1 bg-transparent border-none text-white px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg focus:ring-0 placeholder:text-slate-600 font-mono rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                disabled={loading}
             />
             <button
                onClick={handleAnalyze}
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl px-6 sm:px-8 py-3 sm:py-0 font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-80 shadow-lg shadow-rose-900/20 active:scale-95 min-w-[140px]"
             >
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" size={18}/>
                        <span className="text-xs uppercase tracking-wide">Scanning</span>
                    </>
                ) : (
                    <>
                        <Crosshair size={20} />
                        <span>Scan</span>
                    </>
                )}
             </button>
        </div>
        {loading && (
            <div className="text-center mt-4 animate-in fade-in duration-300">
                <p className="text-rose-400 font-mono text-xs md:text-sm uppercase tracking-widest flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    {LOADING_STEPS[loadingStep]}
                </p>
            </div>
        )}
      </div>

      {result && (
          <div className="space-y-6 md:space-y-8 px-1 md:px-0">
              
              {/* Action Bar */}
              <div className="flex justify-end">
                  <button 
                    onClick={handleSaveInsight}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
                  >
                      <Save size={16}/> Save Insight
                  </button>
              </div>

              {/* 1. EXECUTIVE INTEL GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* Viral Score */}
                  <div className="glass-panel p-5 md:p-6 rounded-3xl border-t-4 border-t-rose-500 relative overflow-hidden flex items-center justify-between bg-gradient-to-b from-rose-950/10 to-slate-950">
                      <div>
                          <h3 className="text-lg font-bold text-white mb-1">Viral Score</h3>
                          <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">{result.data.viralReasoning ? "High Activity" : "Moderate"}</p>
                          <p className="text-slate-400 text-xs max-w-[200px] leading-tight hidden sm:block">{result.data.viralReasoning}</p>
                      </div>
                      <div className="shrink-0">
                        <ScoreCircle score={result.data.viralScore} size={80} strokeWidth={8} />
                      </div>
                  </div>

                  {/* Traffic Intel */}
                  <div className="glass-panel p-5 md:p-6 rounded-3xl border-t-4 border-t-blue-500 flex flex-col justify-between gap-4 bg-gradient-to-b from-blue-950/10 to-slate-950">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Activity size={18} className="text-blue-400"/> Traffic Radar
                      </h3>
                      <div className="flex justify-between items-end">
                          <div>
                              <div className="text-slate-500 text-xs font-bold uppercase mb-1">Monthly Visits</div>
                              <div className="text-xl md:text-2xl font-mono font-bold text-white">{result.data.trafficIntel?.monthlyVisits || 'N/A'}</div>
                          </div>
                          <div className="text-right">
                              <div className="text-slate-500 text-xs font-bold uppercase mb-1">Est. Ad Spend</div>
                              <div className="text-xl md:text-2xl font-mono font-bold text-white">{result.data.trafficIntel?.estAdSpend || 'N/A'}</div>
                          </div>
                      </div>
                  </div>

                  {/* Threat Radar Summary */}
                  <div className="glass-panel p-5 md:p-6 rounded-3xl border-t-4 border-t-amber-500 flex flex-col justify-between gap-4 bg-gradient-to-b from-amber-950/10 to-slate-950">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <ShieldAlert size={18} className="text-amber-400"/> Direct Threats
                      </h3>
                      <div className="flex-1 flex flex-col justify-center">
                          {result.data.directCompetitors && result.data.directCompetitors.length > 0 ? (
                              <div className="space-y-2">
                                  {result.data.directCompetitors.slice(0, 2).map((c, i) => (
                                      <div key={i} className="flex items-center justify-between text-sm bg-slate-900/50 px-3 py-2 rounded-lg border border-white/5">
                                          <span className="text-white font-medium truncate max-w-[120px]">{c.name}</span>
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.threatLevel === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-slate-700 text-slate-300'}`}>{c.threatLevel}</span>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <p className="text-slate-500 text-xs text-center">No direct threats detected.</p>
                          )}
                      </div>
                  </div>
              </div>

              {/* 2. TACTICAL ATTACK PLAN WITH PROGRESS */}
              <div className="glass-panel p-5 md:p-8 rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                      <div>
                          <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                              <Zap className="text-amber-400" fill="currentColor"/> Tactical Attack Plan
                          </h3>
                          <p className="text-slate-400 mt-1 text-sm">Actionable steps to capture competitor market share.</p>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full md:w-48 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                          <div className="flex justify-between text-xs mb-2 font-bold">
                              <span className="text-slate-500 uppercase tracking-wider">Progress</span>
                              <span className={progressPercent === 100 ? 'text-emerald-400' : 'text-amber-400'}>{progressPercent}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${progressPercent}%`}}></div>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
                      {result.data.attackPlan?.map((action, idx) => {
                          const isComplete = completedTactics.includes(idx);
                          return (
                              <div 
                                key={idx} 
                                className={`p-4 md:p-5 rounded-xl border transition-all cursor-pointer group flex items-start gap-3 md:gap-4 ${isComplete ? 'bg-emerald-900/10 border-emerald-500/30 opacity-60' : 'bg-slate-950 border-white/5 hover:border-amber-500/50 hover:bg-slate-900'}`}
                                onClick={() => toggleTactic(idx)}
                              >
                                  <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${isComplete ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 group-hover:border-amber-400'}`}>
                                      {isComplete && <CheckSquare size={12} className="text-white" />}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex justify-between items-center mb-1">
                                          <span className={`text-xs font-bold uppercase tracking-wider ${isComplete ? 'text-emerald-400' : 'text-amber-500'}`}>{action.tactic}</span>
                                          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${action.impact === 'Critical' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                              {action.impact}
                                          </span>
                                      </div>
                                      <p className={`text-sm font-medium leading-relaxed ${isComplete ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{action.action}</p>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>

              {/* 3. SEO & CREATIVE ROW */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                  {/* SEO Battlefield */}
                  <div ref={seoRef} className="glass-panel p-5 md:p-8 rounded-3xl border border-white/5 bg-slate-950/30">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                          <Swords className="text-emerald-400" size={20}/> SEO Battlefield
                      </h3>
                      <div className="space-y-6">
                          <div>
                              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <Globe size={14}/> Organic Keywords
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                  {result.data.seoStrategy?.topKeywords?.map((kw, i) => (
                                      <span key={i} className="bg-emerald-900/20 text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">
                                          {kw}
                                      </span>
                                  )) || <span className="text-slate-500 text-sm">No organic data.</span>}
                              </div>
                          </div>
                          <div>
                              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <DollarSign size={14}/> Paid Search Terms
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                  {result.data.seoStrategy?.paidSearchTerms?.map((kw, i) => (
                                      <span key={i} className="bg-blue-900/20 text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">
                                          {kw}
                                      </span>
                                  )) || <span className="text-slate-500 text-sm">No paid data.</span>}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Creative Intelligence */}
                  <div ref={adsRef} className="xl:col-span-2 glass-panel p-5 md:p-8 rounded-3xl border border-white/5">
                       <div className="flex justify-between items-center mb-6">
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                               <Video className="text-indigo-400" size={20}/> Creative Intel
                           </h3>
                           <div className="flex items-center gap-2">
                               <span className="text-xs text-slate-500 font-bold uppercase hidden sm:block">Visual DNA:</span>
                               <div className="flex h-4 rounded overflow-hidden border border-white/10">
                                  {result.data.brandIdentity?.brandColors?.map((c, i) => (
                                      <div key={i} className="w-4 h-full" style={{ background: c }} title={c}></div>
                                  ))}
                               </div>
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           {result.data.videoAds?.slice(0,2).map((ad, i) => (
                               <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-white/10 group hover:border-indigo-500/50 transition-all flex flex-col shadow-lg">
                                   <div className="aspect-video bg-slate-900 rounded-xl mb-4 overflow-hidden relative">
                                        {ad.thumbnail ? (
                                            <img 
                                                src={ad.thumbnail} 
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                alt="Ad Creative"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                }}
                                            />
                                        ) : null}
                                        <div className={`absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 flex items-center justify-center p-4 text-center ${ad.thumbnail ? 'hidden' : ''}`}>
                                            <p className="text-xs text-indigo-200 font-medium italic">"{ad.hook}"</p>
                                        </div>
                                        <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10">
                                            Ad #{i+1}
                                        </div>
                                   </div>
                                   <div className="flex-1 space-y-3">
                                       <div>
                                          <div className="text-[10px] font-bold text-indigo-400 uppercase mb-1 flex items-center gap-1">
                                              <Target size={10} /> Their Hook
                                          </div>
                                          <p className="text-xs text-white font-medium leading-relaxed">"{ad.hook}"</p>
                                       </div>
                                       {ad.counterHook && (
                                          <div className="bg-fuchsia-900/20 border border-fuchsia-500/30 p-3 rounded-lg">
                                              <div className="text-[10px] font-bold text-fuchsia-400 uppercase mb-1 flex items-center gap-1">
                                                  <Zap size={10} fill="currentColor"/> Counter-Strategy
                                              </div>
                                              <p className="text-xs text-fuchsia-100 font-bold italic leading-relaxed">"{ad.counterHook}"</p>
                                          </div>
                                       )}
                                   </div>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>

              {/* 4. SOCIAL & FEED */}
              <div ref={socialRef} className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
                  <div className="glass-panel p-5 md:p-6 rounded-3xl border border-white/5">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Network size={18} className="text-indigo-400"/> Social Footprint
                      </h4>
                      <div className="space-y-3">
                          {result.data.socialLinks && result.data.socialLinks.length > 0 ? (
                              result.data.socialLinks.map((social, idx) => (
                                  <a 
                                    key={idx} 
                                    href={social.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-white/5 hover:bg-slate-900 hover:border-white/10 transition-all group"
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                                              <SocialIcon platform={social.platform} />
                                          </div>
                                          <span className="text-sm font-bold text-slate-300 group-hover:text-white capitalize">{social.platform}</span>
                                      </div>
                                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">{social.followers}</span>
                                  </a>
                              ))
                          ) : (
                              <div className="text-xs text-slate-500 italic">No official profiles detected.</div>
                          )}
                      </div>
                  </div>

                  <div className="xl:col-span-2 glass-panel p-5 md:p-6 rounded-3xl border border-white/5 h-[320px] flex flex-col">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Activity size={18} className="text-blue-400"/> Live Competitor Feed
                      </h4>
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                          {result.data.recentActivity && result.data.recentActivity.length > 0 ? (
                              <div className="space-y-2">
                                {result.data.recentActivity.map((act, i) => <FeedItem key={i} activity={act} />)}
                              </div>
                          ) : (
                              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                                  <Info size={24} className="mb-2 opacity-20"/>
                                  <p>No recent public activity detected.</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

          </div>
      )}
    </div>
  );
};

export default CompetitorIntel;
