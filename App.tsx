import React, { useEffect, useState, useRef } from 'react';
import { Globe3D } from './components/Globe3D';
import { Player } from './components/Player';
import { Sidebar } from './components/Sidebar';
import { RadioStation, StationFilter } from './types';
import { fetchTopStations, searchStations } from './services/radioService';
import { getStationInsight, getMoodRecommendation } from './services/geminiService';

export default function App() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [aiInsight, setAiInsight] = useState<string>("Welcome! Select a station to begin.");
  const [loading, setLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      try {
        // Fetch Top Global and specifically Turkish stations to populate the map well for the requested region
        // Increased limits and added tag search to maximize coverage of Turkish stations
        const [globalData, turkishData, turkishTagData] = await Promise.all([
          fetchTopStations(50),
          searchStations({ country: 'Turkey', limit: 200 }),
          searchStations({ tag: 'turkish', limit: 100 })
        ]);

        // Merge arrays: Put Turkish stations first for visibility in list
        const allStations = [...turkishData, ...turkishTagData, ...globalData];
        
        // Deduplicate by UUID
        const uniqueStations = new Map();
        allStations.forEach(s => {
          if (s.geo_lat && s.geo_long && !uniqueStations.has(s.stationuuid)) {
            uniqueStations.set(s.stationuuid, s);
          }
        });

        const finalStations = Array.from(uniqueStations.values());

        // Explicitly sort to ensure Turkish stations are at the top
        // This handles cases where merge order might not be preserved or logic varies
        finalStations.sort((a, b) => {
           const isTurkish = (s: RadioStation) => 
             s.countrycode === 'TR' || 
             s.country?.toLowerCase() === 'turkey' || 
             s.tags?.toLowerCase().includes('turkey') ||
             s.tags?.toLowerCase().includes('turkish');

           const aIsTR = isTurkish(a);
           const bIsTR = isTurkish(b);
           
           if (aIsTR && !bIsTR) return -1;
           if (!aIsTR && bIsTR) return 1;
           return 0;
        });

        setStations(finalStations);
      } catch (e) {
        console.error("Failed to load initial stations", e);
      } finally {
        setLoading(false);
      }
    };
    init();

    // Setup Audio
    audioRef.current.volume = volume;
    audioRef.current.onplaying = () => setIsPlaying(true);
    audioRef.current.onpause = () => setIsPlaying(false);
    audioRef.current.onerror = () => {
      setIsPlaying(false);
      setAiInsight("Signal lost... try another station.");
    };

    return () => {
      audioRef.current.pause();
    };
  }, []);

  // Handle Volume
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  const handleStationSelect = async (station: RadioStation) => {
    if (currentStation?.stationuuid === station.stationuuid) {
      // Toggle play if same station
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      return;
    }

    setCurrentStation(station);
    audioRef.current.src = station.url_resolved;
    audioRef.current.play().catch(e => console.warn("Playback error", e));
    
    setAiInsight("Tuning in...");
    
    // Fetch AI Insight
    const insight = await getStationInsight(station.name, station.country, station.tags);
    setAiInsight(insight);
  };

  const handlePlayPause = () => {
    if (!currentStation) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    const results = await searchStations({ name: query, limit: 50 });
    const mapped = results.filter(s => s.geo_lat && s.geo_long);
    setStations(mapped);
    setLoading(false);
    if (mapped.length === 0) setAiInsight("No stations found for that search.");
    else setAiInsight(`Found ${mapped.length} stations.`);
  };

  const handleAIMood = async (query: string) => {
    setLoading(true);
    setAiInsight("AI is finding your frequency...");
    const response = await getMoodRecommendation(query);
    
    setAiInsight(response.explanation);

    const filter: StationFilter = { limit: 50 };
    if (response.country) filter.country = response.country;
    if (response.tag) filter.tag = response.tag;

    const results = await searchStations(filter);
    const mapped = results.filter(s => s.geo_lat && s.geo_long);
    
    // If strict filter fails, try looser search
    if (mapped.length === 0 && response.tag) {
         const looseResults = await searchStations({ tag: response.tag, limit: 50 });
         setStations(looseResults.filter(s => s.geo_lat));
    } else {
         setStations(mapped);
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* 3D Background */}
      <Globe3D 
        stations={stations} 
        onStationSelect={handleStationSelect} 
        currentStation={currentStation}
      />
      
      {/* Sidebar Interface */}
      <Sidebar 
        stations={stations}
        currentStation={currentStation}
        onSelect={handleStationSelect}
        onSearch={handleSearch}
        onAIMood={handleAIMood}
        isSearching={loading}
      />

      {/* Player Interface */}
      <Player 
        station={currentStation}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        aiInsight={aiInsight}
        volume={volume}
        onVolumeChange={setVolume}
      />
    </div>
  );
}