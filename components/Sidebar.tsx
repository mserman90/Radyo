import React, { useState } from 'react';
import { RadioStation } from '../types';
import { Search, MapPin, Globe, Tag, Sparkles, Loader2 } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';

interface SidebarProps {
  stations: RadioStation[];
  currentStation: RadioStation | null;
  onSelect: (s: RadioStation) => void;
  onSearch: (query: string) => void;
  onAIMood: (query: string) => void;
  isSearching: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  stations, 
  currentStation, 
  onSelect, 
  onSearch, 
  onAIMood,
  isSearching
}) => {
  const [mode, setMode] = useState<'list' | 'ai'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiQuery, setAiQuery] = useState('');

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleSubmitAI = (e: React.FormEvent) => {
    e.preventDefault();
    onAIMood(aiQuery);
  };

  return (
    <DraggablePanel 
      title="Global Tuner" 
      icon={<Globe className="w-4 h-4" />}
      initialPos={{ x: 20, y: 20 }}
      width="w-96"
      height="h-[calc(100vh-300px)] max-h-[700px]"
      resizable={true}
    >
        {/* Tabs */}
        <div className="flex border-b border-white/10 shrink-0">
          <button 
            onClick={() => setMode('list')}
            className={`flex-1 py-3 text-xs font-medium transition-colors uppercase tracking-widest ${mode === 'list' ? 'bg-white/10 text-white border-b-2 border-cyan-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            Stations
          </button>
          <button 
            onClick={() => setMode('ai')}
            className={`flex-1 py-3 text-xs font-medium transition-colors flex items-center justify-center gap-2 uppercase tracking-widest ${mode === 'ai' ? 'bg-purple-500/10 text-purple-300 border-b-2 border-purple-500' : 'text-gray-500 hover:text-purple-300 hover:bg-purple-500/5'}`}
          >
            <Sparkles className="w-3 h-3" />
            AI Tuner
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col relative min-h-0">
          
          {isSearching && (
             <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
             </div>
          )}

          {mode === 'list' && (
            <>
              <div className="p-4 shrink-0">
                <form onSubmit={handleSubmitSearch} className="relative">
                  <input 
                    type="text" 
                    placeholder="Search frequency..." 
                    className="w-full bg-black/40 border border-white/10 rounded py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors font-mono placeholder-gray-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="w-3 h-3 text-gray-500 absolute left-3 top-2.5" />
                </form>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {stations.length === 0 ? (
                  <div className="text-center text-gray-600 mt-10 text-xs font-mono">NO SIGNALS DETECTED</div>
                ) : (
                  stations.map((s) => (
                    <div 
                      key={s.stationuuid}
                      onClick={() => onSelect(s)}
                      className={`p-2 rounded cursor-pointer transition-all flex items-center gap-3 group border ${currentStation?.stationuuid === s.stationuuid ? 'bg-cyan-950/30 border-cyan-500/50' : 'hover:bg-white/5 border-transparent'}`}
                    >
                      <div className="w-8 h-8 rounded bg-gray-900 flex items-center justify-center shrink-0 overflow-hidden relative border border-white/5">
                        {s.favicon ? <img src={s.favicon} className="w-full h-full object-cover" /> : <Globe className="text-gray-700 w-4 h-4" />}
                        {currentStation?.stationuuid === s.stationuuid && (
                          <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold truncate font-mono ${currentStation?.stationuuid === s.stationuuid ? 'text-cyan-300' : 'text-gray-300 group-hover:text-white'}`}>{s.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase">
                          <span className="flex items-center gap-1"><MapPin className="w-2 h-2" /> {s.countrycode}</span>
                          {s.tags && <span className="truncate max-w-[100px]">• {s.tags.split(',')[0]}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {mode === 'ai' && (
            <div className="p-5 flex flex-col h-full">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-b from-purple-900/50 to-black rounded-full mx-auto mb-3 flex items-center justify-center border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Sparkles className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1 font-mono uppercase tracking-wider">Mood Frequency</h3>
              </div>

              <form onSubmit={handleSubmitAI} className="space-y-4 flex-1 flex flex-col">
                <textarea 
                  className="w-full bg-black/40 border border-purple-500/20 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors resize-none h-24 text-xs font-mono placeholder-gray-600"
                  placeholder="Describe the atmosphere (e.g. 'Rainy jazz cafe in Tokyo')..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                ></textarea>
                <button 
                  type="submit"
                  className="w-full py-3 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-500/40 rounded-lg text-purple-100 text-xs font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(168,85,247,0.1)] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3 h-3" /> Scan Frequencies
                </button>
                
                <div className="mt-auto text-[10px] text-center text-gray-600 font-mono">
                  AI SYSTEM: ONLINE
                </div>
              </form>
            </div>
          )}
        </div>
    </DraggablePanel>
  );
};