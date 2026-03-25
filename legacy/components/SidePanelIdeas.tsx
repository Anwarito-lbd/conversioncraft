
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Pin, Search, Lightbulb, ExternalLink, Copy, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { getIdeas, saveIdea, deleteIdea, togglePin } from '../services/ideaStore';
import { generateSparkIdea } from '../services/geminiService';
import { IdeaItem } from '../types';

interface SidePanelIdeasProps {
  isOpen: boolean;
  onClose: () => void;
}

const SidePanelIdeas: React.FC<SidePanelIdeasProps> = ({ isOpen, onClose }) => {
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [search, setSearch] = useState('');
  const [newIdeaText, setNewIdeaText] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [isSparking, setIsSparking] = useState(false);

  // Refresh ideas when panel opens
  useEffect(() => {
    if (isOpen) {
      loadIdeas();
    }
  }, [isOpen]);

  // Listen for custom event to refresh from other modules
  useEffect(() => {
    const handleRefresh = () => loadIdeas();
    window.addEventListener('ideas-updated', handleRefresh);
    return () => window.removeEventListener('ideas-updated', handleRefresh);
  }, []);

  const loadIdeas = () => {
    setIdeas(getIdeas());
  };

  const handleSaveNew = () => {
    if (!newIdeaText.trim()) return;
    saveIdea({
      title: 'Quick Note',
      snippet: newIdeaText,
      module: 'General',
    });
    setNewIdeaText('');
    setActiveTab('list');
    loadIdeas();
  };

  const handleSparkIdea = async () => {
      setIsSparking(true);
      try {
          const idea = await generateSparkIdea();
          setNewIdeaText(idea);
          setActiveTab('new'); // Switch to input to let user edit/save
      } catch (e) {
          console.error(e);
      } finally {
          setIsSparking(false);
      }
  };

  const handleDelete = (id: string) => {
    deleteIdea(id);
    loadIdeas();
  };

  const handlePin = (id: string) => {
    togglePin(id);
    loadIdeas();
  };

  const filteredIdeas = ideas.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.snippet.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)); // Pinned first

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-[60]" 
          onClick={onClose}
        />
      )}

      {/* Sliding Panel */}
      <div className={`
        fixed inset-y-0 right-0 w-full md:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl transform transition-transform duration-300 ease-out z-[70] flex flex-col
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Lightbulb className="text-amber-400" size={18} />
            </div>
            <h3 className="font-bold text-white">Ideas & Saved Chats</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'list' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Saved Items
            </button>
            <button 
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'new' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <span className="flex items-center justify-center gap-2"><Plus size={14}/> New Idea</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search saved insights..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'new' ? (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                  <button 
                    onClick={handleSparkIdea}
                    disabled={isSparking}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
                  >
                      {isSparking ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} fill="currentColor"/>}
                      Spark New Idea (AI)
                  </button>
              </div>
              <textarea 
                value={newIdeaText}
                onChange={(e) => setNewIdeaText(e.target.value)}
                placeholder="Jot down a marketing angle, prompt idea, or strategy note..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-white resize-none focus:outline-none focus:border-indigo-500 transition-colors mb-4 text-sm leading-relaxed"
              />
              <button 
                onClick={handleSaveNew}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <SaveIcon size={18}/> Save Note
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIdeas.map((item) => (
                <div key={item.id} className={`bg-slate-950 border rounded-xl p-4 transition-all group ${item.isPinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800 hover:border-slate-700'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                        item.module === 'WarRoom' ? 'text-rose-400 border-rose-500/20 bg-rose-500/10' : 
                        item.module === 'ProductFinder' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : 
                        'text-slate-400 border-slate-700 bg-slate-800'
                      }`}>
                        {item.module}
                      </span>
                      {item.isPinned && <Pin size={12} className="text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handlePin(item.id)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded hover:bg-slate-900">
                        <Pin size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-900">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">{item.title}</h4>
                  <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed mb-3">
                    {item.snippet}
                  </p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => navigator.clipboard.writeText(item.snippet)}
                            className="text-slate-500 hover:text-white transition-colors" title="Copy"
                        >
                            <Copy size={14}/>
                        </button>
                        {item.link && (
                            <a href={item.link} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors">
                                <ExternalLink size={14}/>
                            </a>
                        )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredIdeas.length === 0 && (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-sm">No ideas found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const SaveIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

export default SidePanelIdeas;
