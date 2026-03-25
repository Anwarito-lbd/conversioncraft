

import React, { useState, useRef } from 'react';
import { generateMarketingImage, editProductImage, generateVideoAd, animateImageToVideo, generateAdScript, generateComfyUIWorkflow, generateAdMutations } from '../services/geminiService';
import { Image as ImageIcon, Video, Wand2, Upload, Loader2, FileText, Sparkles, Eye, Download, Mic, Dna, Globe, Target, Smartphone, CheckCircle2, Plus, Share2, Zap } from 'lucide-react';
import { AdScript, AdMutation, MarketingStrategy, VideoArchetype, ConnectedAccount } from '../types';

enum StudioMode {
  AD_WIZARD = 'AD_WIZARD',
  AD_MUTATION = 'AD_MUTATION',
  VIDEO_VEO = 'VIDEO_VEO',
  IMAGE_GEN = 'IMAGE_GEN',
}

enum ViewTab {
  CONTROLS = 'CONTROLS',
  PREVIEW = 'PREVIEW'
}

const CreativeStudio: React.FC = () => {
  const [strategy, setStrategy] = useState<MarketingStrategy>(MarketingStrategy.ORGANIC_VIRAL);
  const [mode, setMode] = useState<StudioMode>(StudioMode.AD_WIZARD);
  const [mobileTab, setMobileTab] = useState<ViewTab>(ViewTab.CONTROLS);
  
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/jpeg');
  const [adScript, setAdScript] = useState<AdScript | null>(null);
  const [mutations, setMutations] = useState<AdMutation[]>([]);
  const [veoKeyRequired, setVeoKeyRequired] = useState(false);
  
  // New States for Creative V2
  const [selectedArchetype, setSelectedArchetype] = useState<VideoArchetype | null>(null);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([
      { platform: 'TikTok', username: '@brand_official', isConnected: false, followers: '0' },
      { platform: 'Instagram', username: '@brand.co', isConnected: false, followers: '0' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleConnect = (platform: string) => {
      setAccounts(prev => prev.map(acc => 
          acc.platform === platform ? { ...acc, isConnected: !acc.isConnected, username: acc.isConnected ? '@brand' : '@viral_brand', followers: '12.5k' } : acc
      ));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedMimeType(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setUploadedImage(base64Data);
        setResultUrl(base64String); // Show preview
        setMobileTab(ViewTab.PREVIEW);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt && mode !== StudioMode.AD_MUTATION) return;
    setLoading(true);
    setResultUrl(null);
    setMobileTab(ViewTab.PREVIEW);

    try {
      if (mode === StudioMode.IMAGE_GEN) {
        let url;
        if (uploadedImage) {
           // Use the edit/mix capability if image is provided
           url = await editProductImage(uploadedImage, uploadedMimeType, prompt);
        } else {
           url = await generateMarketingImage(prompt);
        }
        setResultUrl(url);
      } else if (mode === StudioMode.VIDEO_VEO) {
        if (window.aistudio && await window.aistudio.hasSelectedApiKey() === false) {
            setVeoKeyRequired(true);
            setLoading(false);
            return;
        }
        let url;
        if (uploadedImage) {
           url = await animateImageToVideo(uploadedImage, uploadedMimeType, prompt);
        } else {
           // Pass the selected archetype to the service
           url = await generateVideoAd(prompt, '9:16', selectedArchetype || undefined);
        }
        setResultUrl(url);
      } else if (mode === StudioMode.AD_WIZARD) {
        const jsonStr = await generateAdScript(prompt, 'TikTok', selectedArchetype || undefined);
        const script = JSON.parse(jsonStr);
        setAdScript(script);
      } else if (mode === StudioMode.AD_MUTATION) {
        if (!adScript) {
            setLoading(false);
            return alert("Generate a base script first!");
        }
        const muts = await generateAdMutations(adScript);
        setMutations(muts);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Generation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
      if (!accounts.some(a => a.isConnected)) return alert("Connect an account first!");
      alert("Video posted successfully to TikTok & Instagram Reels!");
  };

  const ArchetypeCard = ({ type, label, icon: Icon, desc }: any) => (
      <button 
        onClick={() => setSelectedArchetype(type)}
        className={`p-4 rounded-xl border text-left transition-all ${selectedArchetype === type ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-slate-900 border-white/10 hover:border-indigo-500/50'}`}
      >
          <Icon size={24} className="mb-3 text-white"/>
          <div className="font-bold text-white text-sm mb-1">{label}</div>
          <div className="text-[10px] text-slate-400 leading-tight">{desc}</div>
      </button>
  );

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col gap-6 pb-20">
      
      {/* Header with Strategy Switcher */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 shrink-0">
        <div>
            <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-2">
                <Wand2 className="text-fuchsia-500" fill="currentColor"/> CREATIVE STUDIO
            </h2>
            <p className="text-slate-400 mt-1 text-sm font-mono">Generative Asset Engine • Veo 3.1 Integrated</p>
        </div>
        
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex">
            <button 
                onClick={() => setStrategy(MarketingStrategy.ORGANIC_VIRAL)}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${strategy === MarketingStrategy.ORGANIC_VIRAL ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Globe size={16}/> Organic Lab (Free)
            </button>
            <button 
                onClick={() => setStrategy(MarketingStrategy.PAID_SCALING)}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${strategy === MarketingStrategy.PAID_SCALING ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                <Target size={16}/> Paid Ad Manager
            </button>
        </div>
      </header>

      {/* Mode Tabs */}
      <div className="flex gap-4 overflow-x-auto pb-2 shrink-0 custom-scrollbar">
        {[
            { id: StudioMode.AD_WIZARD, label: 'Script Writer', icon: FileText },
            { id: StudioMode.VIDEO_VEO, label: 'Veo Video Gen', icon: Video },
            { id: StudioMode.IMAGE_GEN, label: 'Asset Generator', icon: ImageIcon },
            ...(strategy === MarketingStrategy.PAID_SCALING ? [{ id: StudioMode.AD_MUTATION, label: 'Ad Mutation', icon: Dna }] : []),
        ].map((m) => (
            <button 
                key={m.id}
                onClick={() => { setMode(m.id); setResultUrl(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${mode === m.id ? 'bg-white text-slate-950 border-white' : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600'}`}
            >
                <m.icon size={16}/> {m.label}
            </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
         
         {/* LEFT: Config Panel */}
         <div className="glass-panel rounded-3xl p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
             
             {/* Archetype Selector (Only for Video/Script) */}
             {(mode === StudioMode.AD_WIZARD || mode === StudioMode.VIDEO_VEO) && (
                 <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Select UGC Archetype</label>
                     <div className="grid grid-cols-2 gap-3">
                         <ArchetypeCard type="AI_INFLUENCER" label="AI Influencer" icon={Smartphone} desc="Gen-Z persona speaking to camera." />
                         <ArchetypeCard type="ASMR_UNBOXING" label="ASMR Unboxing" icon={CheckCircle2} desc="Hands-only satisfying demo." />
                         <ArchetypeCard type="GREEN_SCREEN" label="Green Screen" icon={Video} desc="Creator reacting to background." />
                         <ArchetypeCard type="CINEMATIC_DEMO" label="Cinematic" icon={Sparkles} desc="High-end luxury b-roll." />
                     </div>
                 </div>
             )}

             {/* Image Upload Input */}
             {(mode === StudioMode.IMAGE_GEN || mode === StudioMode.VIDEO_VEO) && (
                 <div>
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Reference Asset (Optional)</label>
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950"
                     >
                         {uploadedImage ? (
                             <div className="relative w-full h-32">
                                 <img src={`data:${uploadedMimeType};base64,${uploadedImage}`} className="w-full h-full object-contain" />
                                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                     <span className="text-white text-xs font-bold">Change Image</span>
                                 </div>
                             </div>
                         ) : (
                             <>
                                <Upload className="text-slate-500 mb-2"/>
                                <span className="text-xs text-slate-400 font-bold">Click to Upload Product Image</span>
                             </>
                         )}
                         <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                     </div>
                 </div>
             )}

             {/* Input Area */}
             <div className="space-y-3">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                    {mode === StudioMode.AD_WIZARD ? 'Product Name & Key Benefit' : 'Visual Prompt'}
                </label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={mode === StudioMode.AD_WIZARD ? "e.g. Levitation Lamp - Makes your room look magical..." : "Describe the scene..."}
                    className="glass-input w-full rounded-xl p-4 text-white min-h-[120px] focus:outline-none resize-none placeholder:text-slate-600 text-sm"
                />
             </div>

             {/* Generate Button */}
             <button 
                onClick={handleGenerate}
                disabled={loading}
                className={`relative w-full py-4 rounded-xl overflow-hidden group disabled:opacity-50 font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${strategy === MarketingStrategy.ORGANIC_VIRAL ? 'bg-fuchsia-600 hover:bg-fuchsia-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
             >
                 {loading ? <Loader2 className="animate-spin"/> : <Zap fill="currentColor"/>}
                 {loading ? 'Generating...' : `Generate ${mode === StudioMode.AD_WIZARD ? 'Script' : 'Asset'}`}
             </button>

             {/* Connected Accounts (Social Posting) */}
             <div className="border-t border-white/5 pt-6 mt-auto">
                 <div className="flex items-center justify-between mb-4">
                     <span className="text-xs font-bold text-slate-500 uppercase">Linked Accounts</span>
                     <button className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 hover:text-white"><Plus size={10}/> Add</button>
                 </div>
                 <div className="space-y-2">
                     {accounts.map((acc) => (
                         <div key={acc.platform} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                             <div className="flex items-center gap-3">
                                 <div className={`w-2 h-2 rounded-full ${acc.isConnected ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                                 <span className="text-sm font-bold text-white">{acc.platform}</span>
                             </div>
                             {acc.isConnected ? (
                                 <span className="text-xs text-slate-500">{acc.followers}</span>
                             ) : (
                                 <button onClick={() => handleConnect(acc.platform)} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">Connect</button>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
         </div>

         {/* RIGHT: Preview & Result */}
         <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 bg-black/40 relative overflow-hidden flex flex-col">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.03),transparent_70%)] pointer-events-none"></div>
             
             <div className="flex-1 relative z-10 p-6 flex items-center justify-center overflow-y-auto custom-scrollbar">
                 {!resultUrl && !loading && !adScript && mutations.length === 0 && (
                     <div className="text-center opacity-30">
                         <Eye size={48} className="mx-auto mb-4"/>
                         <p className="font-mono text-sm">READY FOR CREATION</p>
                     </div>
                 )}

                 {loading && (
                    <div className="text-center">
                        <Loader2 size={48} className="animate-spin text-indigo-500 mx-auto mb-4"/>
                        <p className="font-bold text-white text-xl animate-pulse">AI Dreaming...</p>
                        <p className="text-sm text-slate-500 mt-2">Rendering pixels & synaptic weights</p>
                    </div>
                 )}

                 {/* Script Result */}
                 {adScript && mode === StudioMode.AD_WIZARD && !loading && (
                     <div className="w-full max-w-xl space-y-4 animate-in zoom-in duration-300">
                         <div className="bg-slate-950 p-6 rounded-xl border-l-4 border-l-fuchsia-500 border-white/10">
                             <div className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-wider mb-2">Hook</div>
                             <h3 className="text-xl font-bold text-white">"{adScript.hook}"</h3>
                         </div>
                         <div className="bg-slate-950 p-6 rounded-xl border-l-4 border-l-indigo-500 border-white/10">
                             <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">Visual Direction</div>
                             <p className="text-slate-300 text-sm">{adScript.visualCue}</p>
                         </div>
                         <div className="flex justify-end gap-3">
                             <button 
                                onClick={() => {
                                    setMode(StudioMode.VIDEO_VEO);
                                    setPrompt(adScript.visualCue); // Pass visual cue to Veo
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                             >
                                 <Video size={18}/> Send to Veo
                             </button>
                         </div>
                     </div>
                 )}

                 {/* Media Result */}
                 {resultUrl && !loading && (
                    <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in duration-500">
                        <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 max-h-[400px]">
                            {mode === StudioMode.VIDEO_VEO ? (
                                <video controls autoPlay loop className="max-h-[400px] rounded-xl" src={resultUrl} />
                            ) : (
                                <img src={resultUrl} className="max-h-[400px] rounded-xl object-contain" />
                            )}
                        </div>
                        
                        <div className="flex gap-4 mt-6">
                            <button className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2">
                                <Download size={18}/> Download
                            </button>
                            <button 
                                onClick={handlePost}
                                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl font-bold hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-pink-500/20"
                            >
                                <Share2 size={18}/> One-Click Post
                            </button>
                        </div>
                    </div>
                 )}
             </div>
         </div>
      </div>
    </div>
  );
};

export default CreativeStudio;