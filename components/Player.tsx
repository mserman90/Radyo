import React, { useEffect, useRef, useState } from 'react';
import { RadioStation } from '../types';
import { Play, Pause, Volume2, VolumeX, Radio, Activity, RadioReceiver } from 'lucide-react';
import { DraggablePanel } from './DraggablePanel';

interface PlayerProps {
  station: RadioStation | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  aiInsight: string;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export const Player: React.FC<PlayerProps> = ({ 
  station, 
  isPlaying, 
  onPlayPause, 
  aiInsight, 
  volume, 
  onVolumeChange 
}) => {
  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(30).fill(5));

  // Fake visualizer effect
  useEffect(() => {
    if (!isPlaying) {
      setVisualizerBars(new Array(30).fill(5));
      return;
    }
    
    const interval = setInterval(() => {
      setVisualizerBars(prev => prev.map(() => Math.random() * 80 + 10));
    }, 80);

    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!station) {
    return (
      <DraggablePanel 
        title="System Status" 
        width="w-72"
        initialPos={{ x: window.innerWidth / 2 - 144, y: window.innerHeight - 150 }}
        icon={<Activity className="w-4 h-4 text-orange-400" />}
      >
        <div className="p-4 flex flex-col items-center text-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping mb-2" />
          <span className="text-xs text-gray-300 font-mono uppercase tracking-widest">Waiting for signal</span>
          <span className="text-[10px] text-gray-600">Select a target on the globe</span>
        </div>
      </DraggablePanel>
    );
  }

  return (
    <DraggablePanel 
      title="Playback Control" 
      width="w-[90vw] md:w-[500px]" 
      initialPos={{ x: window.innerWidth / 2 - 250, y: window.innerHeight - 250 }}
      icon={<Radio className="w-4 h-4 text-green-400" />}
    >
      <div className="p-4 md:p-5 flex flex-col gap-4">
        
        {/* Main Info & Controls */}
        <div className="flex items-center justify-between gap-4">
          
          {/* Station Badge */}
          <div className="w-14 h-14 rounded bg-black border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.1)] shrink-0 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 group-hover:opacity-100 transition-opacity" />
             {station.favicon ? (
               <img src={station.favicon} alt="icon" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} />
             ) : (
               <Radio className="text-gray-600 w-6 h-6" />
             )}
          </div>

          {/* Meta Data */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="text-white font-bold text-sm truncate font-mono tracking-tight">{station.name}</h3>
            <div className="flex items-center gap-2 text-[10px] text-cyan-400/80 uppercase tracking-wider">
              <span className="px-1 bg-cyan-900/30 rounded border border-cyan-500/20">{station.countrycode}</span>
              <span className="truncate">{station.tags?.split(',')[0] || 'FM'}</span>
              {isPlaying && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-1" />}
            </div>
          </div>

          {/* Play Button */}
          <button 
            onClick={onPlayPause}
            className="w-10 h-10 rounded border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 transition-all flex items-center justify-center shrink-0 active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4 text-white" fill="currentColor" /> : <Play className="w-4 h-4 text-white ml-0.5" fill="currentColor" />}
          </button>
        </div>

        {/* Volume & Visualizer Row */}
        <div className="flex items-center gap-4 h-8 bg-black/30 rounded border border-white/5 px-3">
          <button onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)} className="shrink-0">
               {volume === 0 ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-cyan-400" />}
          </button>
          
          {/* Custom Range Input */}
          <div className="w-20 relative group flex items-center">
             <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={volume} 
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
            />
          </div>

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Visualizer */}
          <div className="flex-1 flex items-end justify-end gap-[1px] h-5 pb-1">
            {visualizerBars.map((h, i) => (
              <div 
                key={i} 
                className="w-1 bg-gradient-to-t from-cyan-900 to-cyan-400 opacity-80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* AI Insight Footer */}
        <div className="relative bg-purple-900/10 border-l-2 border-purple-500 pl-3 py-2">
           <div className="text-[10px] text-purple-300 font-mono uppercase mb-0.5 opacity-70">AI Analysis</div>
           <p className="text-xs text-purple-100 italic leading-relaxed">{aiInsight}</p>
        </div>
      </div>
    </DraggablePanel>
  );
};