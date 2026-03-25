

import React, { useState } from 'react';
import { generateProductPage, generate3DMockup, generateMarketingImage, generate360Sprite } from '../services/geminiService';
import { LandingPageData, BusinessModel } from '../types';
import { LayoutTemplate, Loader2, CheckCircle2, ShoppingCart, Star, Eye, Edit3, Share2, Globe, Box, Image as ImageIcon, MessageSquare, Plus, Link as LinkIcon, Zap, Lock, Save, Smartphone, Monitor, Truck, ShieldCheck, Clock, ArrowRight, Rotate3D, Menu } from 'lucide-react';
import { saveIdea } from '../services/ideaStore';

interface PageBuilderProps {
    businessModel: BusinessModel | null;
}

enum BuilderTab {
  EDITOR = 'EDITOR',
  ASSETS = 'ASSETS',
  REVIEWS = 'REVIEWS',
  PREVIEW = 'PREVIEW'
}

const PageBuilder: React.FC<PageBuilderProps> = ({ businessModel }) => {
  const [productName, setProductName] = useState('');
  const [supplierUrl, setSupplierUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [assetLoading, setAssetLoading] = useState(false);
  const [pageData, setPageData] = useState<LandingPageData | null>(null);
  const [activeTab, setActiveTab] = useState<BuilderTab>(BuilderTab.EDITOR);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 360 View State
  const [is360Generating, setIs360Generating] = useState(false);

  const isService = businessModel === BusinessModel.DROPSERVICING;

  const handleGenerate = async () => {
    if (!supplierUrl && !productName) {
        alert("Please enter a URL or a Name to generate.");
        return;
    }
    setLoading(true);
    setActiveTab(BuilderTab.PREVIEW); 
    try {
      const data = await generateProductPage(supplierUrl, productName, businessModel || BusinessModel.DROPSHIPPING);
      setPageData(data);
      if (!productName && data.productName) {
          setProductName(data.productName);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate page. Try again.");
      setActiveTab(BuilderTab.EDITOR);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
      if (!pageData) return;
      saveIdea({
          title: `Page Draft: ${pageData.productName || 'Untitled'}`,
          snippet: `Headline: ${pageData.headline}. Theme: ${isService ? 'Agency Funnel' : 'Viral Store'}.`,
          module: 'PageBuilder',
          data: pageData
      });
      window.dispatchEvent(new Event('ideas-updated'));
      alert("Draft saved to Ideas panel.");
  };

  const generateMockup = async () => {
      if (!pageData || (!productName && !pageData.productName)) return;
      const finalName = productName || pageData.productName || "Product";
      setAssetLoading(true);
      try {
          const visualDesc = (pageData as any).visualDescription || "";
          const url = await generate3DMockup(finalName, visualDesc);
          setPageData(prev => prev ? ({ ...prev, mockupImages: [...prev.mockupImages, url] }) : null);
      } catch (e) {
          console.error(e);
          alert("Mockup generation failed.");
      } finally {
          setAssetLoading(false);
      }
  };

  const generatePhoto = async () => {
      if (!pageData || (!productName && !pageData.productName)) return;
      const finalName = productName || pageData.productName || "Product";
      setAssetLoading(true);
      try {
          const visualDesc = (pageData as any).visualDescription || "";
          const url = await generateMarketingImage(`Professional ${isService ? 'office/dashboard' : 'product'} photography of ${finalName}, ${visualDesc}, commercial lighting, high detail, photorealistic.`);
          setPageData(prev => prev ? ({ ...prev, professionalImages: [...prev.professionalImages, url] }) : null);
      } catch (e) {
          console.error(e);
          alert("Photo generation failed.");
      } finally {
          setAssetLoading(false);
      }
  };

  const handleGenerate360 = async () => {
      if (!pageData || !pageData.productName) return;
      setIs360Generating(true);
      try {
         const spriteUrl = await generate360Sprite(pageData.productName, pageData.visualDescription);
         setPageData(prev => prev ? ({ 
             ...prev, 
             is360Available: true,
             rotationImages: [spriteUrl] // Store the sprite/grid
         }) : null);
      } catch (e) {
          console.error(e);
          alert("360 generation failed.");
      } finally {
          setIs360Generating(false);
      }
  }

  const updatePageData = (field: keyof LandingPageData, value: any) => {
      if (!pageData) return;
      setPageData({ ...pageData, [field]: value });
  };

  // --- COMPONENTS ---

  const Viewer360 = ({ imageUrl }: { imageUrl: string }) => (
      <div className="relative group cursor-ew-resize bg-white rounded-xl overflow-hidden border border-slate-200 shadow-lg">
          <img src={imageUrl} className="w-full h-full object-cover" alt="360 Sprite View" />
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Rotate3D size={10}/> 360° View
          </div>
      </div>
  );

  const ControlsPanel = () => (
     <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar p-6 bg-slate-950/50">
        {/* TAB: EDITOR */}
        {activeTab === BuilderTab.EDITOR && (
            <div className="space-y-6">
                {/* Edit Generated Content */}
                {pageData ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Live Editor</h3>
                        <div>
                            <label className="text-xs font-bold text-slate-500">Headline</label>
                            <textarea 
                                value={pageData.headline}
                                onChange={(e) => updatePageData('headline', e.target.value)}
                                className="glass-input w-full p-3 rounded-lg text-white text-sm focus:outline-none"
                                rows={2}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">Price</label>
                            <div className="flex gap-2">
                                <input 
                                    value={pageData.currency || '$'}
                                    onChange={(e) => updatePageData('currency', e.target.value)}
                                    className="glass-input w-16 p-3 rounded-lg text-white text-sm text-center"
                                />
                                <input 
                                    value={pageData.price || '49.99'}
                                    onChange={(e) => updatePageData('price', e.target.value)}
                                    className="glass-input flex-1 p-3 rounded-lg text-white text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">CTA Text</label>
                            <input 
                                value={pageData.callToAction}
                                onChange={(e) => updatePageData('callToAction', e.target.value)}
                                className="glass-input w-full p-3 rounded-lg text-white text-sm"
                            />
                        </div>
                        <button 
                            onClick={() => setPageData(null)}
                            className="w-full border border-slate-700 text-slate-400 py-2 rounded-lg text-xs hover:text-white hover:bg-slate-800"
                        >
                            Start Over
                        </button>
                    </div>
                ) : (
                    // Initial Generation Form
                    <div className="space-y-6">
                         {/* Theme Status */}
                        <div className="bg-slate-900/50 border border-slate-700 p-4 rounded-xl flex items-center gap-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer pointer-events-none"/>
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                                <Zap size={20} fill="currentColor" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">Viral Framework</span>
                                    <Lock size={12} className="text-slate-500"/>
                                </div>
                                <div className="text-xs text-slate-400">{isService ? 'Agency Funnel Mode' : 'High-Converting Store'}</div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Target URL</label>
                            <div className="relative">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input 
                                    type="text" 
                                    value={supplierUrl}
                                    onChange={(e) => setSupplierUrl(e.target.value)}
                                    placeholder="https://aliexpress.com/item/..."
                                    className="glass-input w-full rounded-xl px-4 py-3 pl-11 text-white placeholder:text-slate-600 focus:outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Asset Name</label>
                            <input 
                                type="text" 
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="Auto-detect from URL if empty"
                                className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none text-sm"
                            />
                        </div>
                        
                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"/>
                            {loading ? <Loader2 className="animate-spin" /> : <LayoutTemplate size={20} />}
                            Generate {isService ? 'Funnel' : 'Store'}
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* TAB: ASSETS */}
        {activeTab === BuilderTab.ASSETS && (
            <div className="space-y-6">
                    <h3 className="font-bold text-white flex items-center gap-2"><Box size={18} className="text-amber-400"/> Asset Studio</h3>
                    
                    {!pageData ? (
                        <p className="text-slate-500 text-sm">Generate a page first to create assets.</p>
                    ) : (
                        <>
                        <div className="space-y-3">
                            {!isService && (
                                <>
                                <button 
                                    onClick={generateMockup}
                                    disabled={assetLoading}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                                >
                                    {assetLoading ? <Loader2 size={14} className="animate-spin"/> : <Box size={14}/>}
                                    Generate 3D Mockup
                                </button>
                                <button 
                                    onClick={handleGenerate360}
                                    disabled={is360Generating}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                                >
                                    {is360Generating ? <Loader2 size={14} className="animate-spin"/> : <Rotate3D size={14}/>}
                                    Generate 360° Sprite
                                </button>
                                </>
                            )}
                            <button 
                                onClick={generatePhoto}
                                disabled={assetLoading}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                            >
                                {assetLoading ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>}
                                Generate Lifestyle Photo
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {pageData.mockupImages.map((img, i) => (
                                <div key={i} className="aspect-square rounded-lg bg-white overflow-hidden border border-slate-800 relative">
                                    <img src={img} className="w-full h-full object-contain p-4" alt="Mockup" />
                                </div>
                            ))}
                            {pageData.professionalImages.map((img, i) => (
                                <div key={i} className="aspect-square rounded-lg bg-slate-950 overflow-hidden border border-slate-800 relative">
                                    <img src={img} className="w-full h-full object-cover" alt="Pro Photo" />
                                </div>
                            ))}
                            {pageData.is360Available && pageData.rotationImages?.[0] && (
                                <div className="col-span-2">
                                    <Viewer360 imageUrl={pageData.rotationImages[0]} />
                                </div>
                            )}
                        </div>
                        </>
                    )}
            </div>
        )}
        
        {/* TAB: REVIEWS */}
        {activeTab === BuilderTab.REVIEWS && (
            <div className="space-y-6">
                <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare size={18} className="text-cyan-400"/> Review Manager</h3>
                    
                    {!pageData ? (
                        <p className="text-slate-500 text-sm">Generate a page first to manage reviews.</p>
                    ) : (
                        <div className="space-y-4">
                            <button className="w-full border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                <Plus size={16}/> Add Custom Review
                            </button>
                            
                            {pageData.reviews.map((review, idx) => (
                                <div key={idx} className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                {review.author.charAt(0)}
                                            </div>
                                            <span className="text-sm font-bold text-white">{review.author}</span>
                                        </div>
                                        <div className="flex text-amber-400">
                                            {[...Array(review.rating)].map((_, i) => <Star key={i} size={10} fill="currentColor"/>)}
                                        </div>
                                    </div>
                                    <textarea 
                                        value={review.content}
                                        onChange={(e) => {
                                            const newReviews = [...pageData.reviews];
                                            newReviews[idx].content = e.target.value;
                                            updatePageData('reviews', newReviews);
                                        }}
                                        className="bg-transparent text-xs text-slate-400 w-full focus:outline-none resize-none"
                                        rows={3}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        )}
     </div>
  );

  return (
    <div className="h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6 animate-in fade-in-up duration-500 relative">
      
      {/* Mobile Toggle for Editor */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden absolute bottom-4 right-4 z-50 w-12 h-12 bg-indigo-600 rounded-full text-white shadow-xl flex items-center justify-center"
      >
          {mobileMenuOpen ? <ArrowRight size={24}/> : <Menu size={24}/>}
      </button>

      {/* Sidebar Column (Controls) - Responsive Drawer */}
      <div className={`
        fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-sm transition-transform duration-300 lg:static lg:bg-transparent lg:inset-auto lg:w-1/3 lg:flex lg:flex-col lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full border-r border-white/5 rounded-r-3xl lg:rounded-2xl lg:border lg:bg-slate-900 lg:overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">WAR ROOM HUD</h2>
                    <p className="text-xs font-mono text-indigo-500">SECURE CONNECTION ESTABLISHED</p>
                </div>
                {pageData && (
                    <button 
                        onClick={handleSaveDraft} 
                        className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                        title="Save Draft"
                    >
                        <Save size={20}/>
                    </button>
                )}
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-slate-800 bg-slate-950">
                {[
                    { id: BuilderTab.EDITOR, icon: Edit3, label: 'Editor' },
                    { id: BuilderTab.ASSETS, icon: Box, label: 'Assets' },
                    { id: BuilderTab.REVIEWS, icon: MessageSquare, label: 'Reviews' },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                        ${activeTab === tab.id ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <tab.icon size={14}/> {tab.label}
                    </button>
                ))}
            </div>

            <ControlsPanel />
        </div>
      </div>

      {/* Preview Column */}
      <div className={`
        flex-1 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative flex flex-col
      `}>
        {/* Browser Chrome */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
            </div>
            
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                <button 
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
                >
                    <Monitor size={14}/>
                </button>
                <button 
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}
                >
                    <Smartphone size={14}/>
                </button>
            </div>

            <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded text-xs font-medium border bg-slate-800 border-slate-700 text-slate-300">
                <Zap size={12} className="text-amber-400" fill="currentColor"/> {isService ? 'Agency Mode' : 'Live Preview'}
            </div>
        </div>

        <div className="flex-1 relative overflow-hidden bg-slate-100 flex justify-center">
            {!pageData && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6 text-center">
                    <LayoutTemplate size={48} className="mb-4 opacity-20 text-indigo-500"/>
                    <p className="text-lg font-medium text-slate-500">Ready to build.</p>
                    <p className="text-sm">Enter details to generate a high-converting store.</p>
                </div>
            )}
            
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                    <Loader2 size={48} className="animate-spin text-indigo-600 mb-4"/>
                    <p className="text-slate-900 font-semibold">Building {isService ? 'funnel' : 'store'}...</p>
                    <p className="text-slate-500 text-sm">Analyzing data, writing copy, and designing layout.</p>
                </div>
            )}

            {pageData && (
                <div className={`
                    h-full overflow-y-auto bg-white text-slate-900 font-sans scroll-smooth transition-all duration-300 shadow-2xl
                    ${previewDevice === 'mobile' ? 'w-[375px] border-x border-slate-300 my-4 rounded-xl' : 'w-full'}
                `}>
                    {/* --- PAGEPILOT STYLE TEMPLATE --- */}
                    
                    {/* Announcement Bar */}
                    {!isService && (
                        <div className="bg-black text-white text-[10px] md:text-xs text-center py-2 font-bold tracking-widest uppercase">
                            Free Worldwide Shipping • 50% OFF Today Only
                        </div>
                    )}

                    {/* Navbar */}
                    <div className="border-b border-slate-100 px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-20">
                        <span className="font-black text-xl tracking-tighter uppercase italic">
                            {pageData.productName ? pageData.productName.split(' ')[0] : 'BRAND'}
                        </span>
                        <div className="flex items-center gap-4">
                            {!isService && <ShoppingCart className="text-slate-900" size={24}/>}
                            {isService && <button className="bg-black text-white px-4 py-2 rounded-full text-xs font-bold">Book Call</button>}
                        </div>
                    </div>

                    {/* Hero Section - Split layout for Desktop, Stacked for Mobile */}
                    <div className={`${previewDevice === 'desktop' ? 'grid grid-cols-2 gap-0 min-h-[500px]' : 'flex flex-col'}`}>
                        
                        {/* Hero Visual */}
                        <div className={`bg-slate-50 relative flex items-center justify-center ${previewDevice === 'desktop' ? 'order-2 p-12' : 'order-1 p-8 aspect-square'}`}>
                             {pageData.is360Available && pageData.rotationImages?.[0] ? (
                                 <Viewer360 imageUrl={pageData.rotationImages[0]} />
                             ) : pageData.mockupImages[0] ? (
                                <img src={pageData.mockupImages[0]} alt="Product" className="w-full h-full object-contain drop-shadow-xl" />
                             ) : (
                                <div className="text-center opacity-40">
                                    <Box size={64} className="mx-auto mb-2"/>
                                    <p className="font-bold text-sm">3D Render Pending</p>
                                </div>
                             )}
                             {/* Floating Badge */}
                             <div className="absolute top-6 right-6 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-lg text-emerald-600 border border-emerald-100">
                                 New Arrival
                             </div>
                        </div>

                        {/* Hero Content */}
                        <div className={`flex flex-col justify-center p-8 md:p-12 ${previewDevice === 'desktop' ? 'order-1' : 'order-2'}`}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
                                </div>
                                <span className="text-xs font-bold text-slate-500">4.9/5 (12k+ Reviews)</span>
                            </div>
                            
                            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 leading-[1.1] tracking-tight">
                                {pageData.headline}
                            </h1>
                            
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                {pageData.subheadline}
                            </p>
                            
                            <div className="space-y-3">
                                <button className="w-full bg-black hover:bg-slate-800 text-white py-4 rounded-full text-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                                    {pageData.callToAction} <ArrowRight size={20}/>
                                </button>
                                <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                                    <ShieldCheck size={12}/> 30-Day Money Back Guarantee
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Features / Benefits Grid */}
                    <div className="py-16 px-6 md:px-12 bg-white">
                        <div className="max-w-4xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-slate-900">Why everyone is switching to {pageData.productName}</h3>
                                    <ul className="space-y-4">
                                        {pageData.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <div className="mt-1 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="text-emerald-600" size={12}/>
                                                </div>
                                                <span className="text-slate-700 font-medium">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center text-center justify-center">
                                        <Truck size={32} className="text-slate-900 mb-3"/>
                                        <span className="font-bold text-sm">Fast Shipping</span>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center text-center justify-center">
                                        <ShieldCheck size={32} className="text-slate-900 mb-3"/>
                                        <span className="font-bold text-sm">Lifetime Warranty</span>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center text-center justify-center">
                                        <Clock size={32} className="text-slate-900 mb-3"/>
                                        <span className="font-bold text-sm">24/7 Support</span>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center text-center justify-center">
                                        <Star size={32} className="text-slate-900 mb-3"/>
                                        <span className="font-bold text-sm">Top Rated</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Breakdown (If Photos Exist) */}
                    {pageData.professionalImages.length > 0 && (
                        <div className="py-12 px-4">
                            <div className="grid grid-cols-2 gap-2">
                                {pageData.professionalImages.slice(0, 2).map((img, i) => (
                                    <img key={i} src={img} className="rounded-xl w-full object-cover aspect-square shadow-sm" alt="Detail"/>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reviews Section */}
                    <div className="py-16 px-6 bg-slate-50 border-t border-slate-100">
                        <div className="max-w-4xl mx-auto">
                            <h3 className="text-2xl font-bold text-center mb-10">What customers are saying</h3>
                            <div className="space-y-4">
                                {pageData.reviews.map((review, i) => (
                                    <div key={i} className="p-6 rounded-xl bg-white shadow-sm border border-slate-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="font-bold text-slate-900 flex items-center gap-2">
                                                {review.author}
                                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">Verified</span>
                                            </div>
                                            <div className="flex text-amber-400">
                                                {[...Array(review.rating)].map((_, r) => <Star key={r} size={12} fill="currentColor"/>)}
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed">"{review.content}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                     {/* Sticky CTA Mobile */}
                    <div className="p-4 border-t border-slate-200 bg-white md:hidden sticky bottom-0 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)] z-30">
                         <button className="w-full text-white px-6 py-3.5 rounded-xl font-bold text-lg shadow-lg bg-black flex justify-between items-center">
                            <span>Add to Cart</span>
                            <span>{pageData.currency || '$'}{pageData.price || '49.99'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PageBuilder;