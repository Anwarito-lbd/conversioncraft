
import React, { useState } from 'react';
import { generateProductPage, generate3DMockup, generateMarketingImage } from '../services/geminiService';
import { LandingPageData, BusinessModel } from '../types';
import { LayoutTemplate, Loader2, CheckCircle2, ShoppingCart, Star, Eye, Edit3, Share2, Globe, Box, Image as ImageIcon, MessageSquare, Plus, Link as LinkIcon, Zap, Lock, Save, Smartphone, Monitor, Truck, ShieldCheck, Clock, ArrowRight } from 'lucide-react';
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

  const isService = businessModel === BusinessModel.DROPSERVICING;

  const handleGenerate = async () => {
    if (!supplierUrl && !productName) {
        alert("Please enter a URL or a Name to generate.");
        return;
    }
    setLoading(true);
    setActiveTab(BuilderTab.PREVIEW); // Switch to preview on generate
    try {
      // Always uses default viral context (Nue Cup / PagePilot) defined in service
      const data = await generateProductPage(supplierUrl, productName, businessModel || BusinessModel.DROPSHIPPING);
      setPageData(data);
      // Update local product name if it was inferred
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
          // Use the visual description found during page generation for better accuracy
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

  return (
    <div className="h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-6 animate-in fade-in-up duration-500">
      
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex overflow-x-auto rounded-lg bg-slate-800 p-1 shrink-0 gap-1">
          {[
              { id: BuilderTab.EDITOR, icon: Edit3, label: 'Edit' },
              { id: BuilderTab.ASSETS, icon: Box, label: 'Assets' },
              { id: BuilderTab.REVIEWS, icon: MessageSquare, label: 'Reviews' },
              { id: BuilderTab.PREVIEW, icon: Eye, label: 'View' },
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-700 text-white shadow' : 'text-slate-400'}`}
              >
                  <tab.icon size={14}/> {tab.label}
              </button>
          ))}
      </div>

      {/* Sidebar Column (Controls) */}
      <div className={`
        lg:w-1/3 flex flex-col overflow-hidden
        ${activeTab === BuilderTab.PREVIEW ? 'hidden lg:flex' : 'flex'}
      `}>
        <div className="mb-6 shrink-0 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Store Builder</h2>
            <p className="text-slate-400 mt-1">
                Create high-converting {isService ? 'service funnels' : 'product pages'} from a single link.
            </p>
          </div>
          {pageData && (
              <button 
                onClick={handleSaveDraft} 
                className="p-2 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Save Draft"
              >
                  <Save size={20}/>
              </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
            
            {/* EDITOR TAB */}
            {activeTab === BuilderTab.EDITOR && (
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                    {/* Active Theme Indicator */}
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
                            <Zap size={20} fill="currentColor" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-amber-400">PagePilot Viral Mode</span>
                                <Lock size={12} className="text-slate-500"/>
                            </div>
                            <div className="text-xs text-slate-400">{isService ? 'Agency Funnel Mode' : 'High-Converting Framework'}</div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">{isService ? 'Reference Service URL' : 'Supplier / Product URL'}</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                value={supplierUrl}
                                onChange={(e) => setSupplierUrl(e.target.value)}
                                placeholder={isService ? "https://competitor-agency.com" : "https://aliexpress.com/item/..."}
                                className="glass-input w-full rounded-xl px-4 py-3 pl-11 text-white placeholder:text-slate-600 focus:outline-none"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            *Optional. The system will extract details from this link.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">{isService ? 'Service Name' : 'Product Name'}</label>
                        <input 
                            type="text" 
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Auto-detect from URL if empty"
                            className="glass-input w-full rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none"
                        />
                    </div>
                    
                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <LayoutTemplate size={20} />}
                        Generate {isService ? 'Funnel' : 'Store'}
                    </button>

                    {pageData && (
                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Globe size={14} className="text-emerald-400"/> SEO Metadata</h4>
                            <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5">
                                <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">SEO Title</span>
                                <p className="text-sm text-indigo-300 font-medium mt-1">{pageData.seoTitle}</p>
                            </div>
                            <button className="w-full border border-slate-700 hover:bg-slate-800 text-slate-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                <Share2 size={16}/> Export HTML
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ASSETS TAB */}
            {activeTab === BuilderTab.ASSETS && (
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                     <h3 className="font-bold text-white flex items-center gap-2"><Box size={18} className="text-amber-400"/> Asset Studio</h3>
                     
                     {!pageData ? (
                         <p className="text-slate-500 text-sm">Generate a page first to create assets.</p>
                     ) : (
                         <>
                            <div className="space-y-3">
                                {!isService && (
                                    <button 
                                        onClick={generateMockup}
                                        disabled={assetLoading}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {assetLoading ? <Loader2 size={16} className="animate-spin"/> : <Box size={16}/>}
                                        Generate 3D Mockup (White BG)
                                    </button>
                                )}
                                <button 
                                    onClick={generatePhoto}
                                    disabled={assetLoading}
                                    className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    {assetLoading ? <Loader2 size={16} className="animate-spin"/> : <ImageIcon size={16}/>}
                                    Generate {isService ? 'Service Visual' : 'Pro Photo'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {pageData.mockupImages.map((img, i) => (
                                    <div key={i} className="aspect-square rounded-lg bg-white overflow-hidden border border-slate-800 relative">
                                        <img src={img} className="w-full h-full object-contain p-4" alt="Mockup" />
                                        <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">3D</div>
                                    </div>
                                ))}
                                {pageData.professionalImages.map((img, i) => (
                                    <div key={i} className="aspect-square rounded-lg bg-slate-950 overflow-hidden border border-slate-800 relative">
                                        <img src={img} className="w-full h-full object-cover" alt="Pro Photo" />
                                        <div className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">PRO</div>
                                    </div>
                                ))}
                            </div>
                         </>
                     )}
                </div>
            )}
            
            {/* REVIEWS TAB */}
            {activeTab === BuilderTab.REVIEWS && (
                <div className="glass-panel p-6 rounded-2xl space-y-6">
                    <h3 className="font-bold text-white flex items-center gap-2"><MessageSquare size={18} className="text-cyan-400"/> Review Manager</h3>
                     
                     {!pageData ? (
                         <p className="text-slate-500 text-sm">Generate a page first to manage reviews.</p>
                     ) : (
                         <div className="space-y-4">
                             <button className="w-full border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                 <Plus size={16}/> Add Custom Review
                             </button>
                             
                             {pageData.reviews.map((review, idx) => (
                                 <div key={idx} className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
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
                                     <p className="text-xs text-slate-400 line-clamp-3">"{review.content}"</p>
                                 </div>
                             ))}
                         </div>
                     )}
                </div>
            )}

        </div>
      </div>

      {/* Preview Column */}
      <div className={`
        flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative flex flex-col
        ${activeTab === BuilderTab.PREVIEW ? 'block h-full' : 'hidden lg:flex'}
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
                             {pageData.mockupImages[0] ? (
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
                            <span>$49.99</span>
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
