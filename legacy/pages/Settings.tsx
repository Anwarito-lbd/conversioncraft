
import React, { useState } from 'react';
import { Save, Lock, Globe, User, Bell, Facebook, Instagram, Video } from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'integrations' | 'team'>('general');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in-up duration-500 pb-20">
        <header>
            <h2 className="text-3xl font-bold text-white">Settings</h2>
            <p className="text-slate-400 mt-1">Manage your account preferences and integrations.</p>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-1">
            {[
                { id: 'general', label: 'General', icon: User },
                { id: 'integrations', label: 'Integrations', icon: Globe },
                { id: 'team', label: 'Team', icon: Lock },
            ].map((tab) => {
                const Icon = tab.icon;
                return (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <Icon size={16}/> {tab.label}
                    </button>
                )
            })}
        </div>

        {activeTab === 'general' && (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Full Name</label>
                        <input type="text" defaultValue="Demo User" className="glass-input w-full px-4 py-3 rounded-xl text-white outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-300">Email Address</label>
                        <input type="email" defaultValue="user@example.com" className="glass-input w-full px-4 py-3 rounded-xl text-white outline-none" />
                    </div>
                </div>
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Bell size={20} className="text-slate-400"/>
                        </div>
                        <div>
                            <h4 className="text-white font-medium">Email Notifications</h4>
                            <p className="text-xs text-slate-500">Receive weekly summaries and alerts.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                </div>
            </div>
        )}

        {activeTab === 'integrations' && (
            <div className="space-y-6">
                 <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#000000] rounded-xl flex items-center justify-center border border-slate-800">
                            <Video className="text-white" size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold">TikTok for Business</h4>
                            <p className="text-sm text-slate-400">Auto-post ads and track pixel events.</p>
                        </div>
                    </div>
                    <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors">
                        Connect Account
                    </button>
                 </div>

                 <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                            <Facebook className="text-white" size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold">Meta Ads Manager</h4>
                            <p className="text-sm text-slate-400">Sync campaigns with Facebook & Instagram.</p>
                        </div>
                    </div>
                    <button className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-colors">
                        Connect Account
                    </button>
                 </div>
            </div>
        )}

        <div className="flex justify-end">
            <button className="bg-white hover:bg-slate-200 text-slate-950 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg">
                <Save size={18}/> Save Changes
            </button>
        </div>
    </div>
  );
};

export default Settings;
