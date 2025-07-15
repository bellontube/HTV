

import React, { useState, useEffect, useRef, useCallback } from 'react';
import WelcomeScreen from './components/WelcomeScreen.tsx';
import GoodbyeScreen from './components/GoodbyeScreen.tsx';
import StudioPage from './components/pages/StudioPage.tsx';
import { useSound } from './hooks/useSound.tsx';
import { SoundOnIcon } from './components/icons/SoundOnIcon.tsx';
import { SoundOffIcon } from './components/icons/SoundOffIcon.tsx';
import AmbientPlayer from './components/AmbientPlayer.tsx';
import { MediaAsset, PlayerId, RecordingStatus } from './types.ts';
import AudioMessagePlayer from './components/AudioMessagePlayer.tsx';
import { CloseIcon } from './components/icons/CloseIcon.tsx';
import * as db from './services/dbService.ts';
import ScreenRecorder from './components/ScreenRecorder.tsx';
import { PlayIcon } from './components/icons/PlayIcon.tsx';
import { PauseIcon } from './components/icons/PauseIcon.tsx';
import { PaintBrushIcon } from './components/icons/PaintBrushIcon.tsx';

type AppView = 'welcome' | 'studio' | 'goodbye';
type MovieSource = { type: 'local'; assetId: string } | { type: 'youtube'; url: string; };
type Theme = 'indigo-empress' | 'ruby-royalty' | 'nollywood-noir';

interface ScreenRecorderHandle {
  prepare: (includeMic: boolean) => void;
  cancel: () => void;
  stop: () => void;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  const [theme, setTheme] = useState<Theme>('indigo-empress');
  
  const [movieSource, setMovieSource] = useState<MovieSource | null>(null);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const { isMuted, toggleMute, playSound } = useSound();

  // General App State
  const [mainTitle, setMainTitle] = useState("Kannywood HTV");
  const [subTitle, setSubTitle] = useState("Barka da zuwa! Idan kuna jin daɗin shirin, ku danna alamar so (like) sannan kuyi subscribing.");
  const [featureTitle, setFeatureTitle] = useState("The Daily Feature");
  
  // Media State - Simplified to one active asset, no library.
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  
  const activeMediaAsset = mediaAssets.find(asset => asset.id === activeAssetId) || null;

  // --- Centralized Player State ---
  const movieRef = useRef<{ seekTo: (time: number) => void }>(null);
  const audioRefs: Record<string, React.RefObject<HTMLAudioElement>> = {
    'audio-left-1': useRef<HTMLAudioElement>(null), 'audio-left-2': useRef<HTMLAudioElement>(null),
    'audio-left-3': useRef<HTMLAudioElement>(null), 'audio-left-4': useRef<HTMLAudioElement>(null),
    'audio-right-1': useRef<HTMLAudioElement>(null), 'audio-right-2': useRef<HTMLAudioElement>(null),
    'audio-right-3': useRef<HTMLAudioElement>(null), 'audio-right-4': useRef<HTMLAudioElement>(null),
  };
  const [audioSources, setAudioSources] = useState<Record<string, string | null>>({});
  const [activePlayers, setActivePlayers] = useState<Set<PlayerId>>(new Set());
  const [playersToResume, setPlayersToResume] = useState<Set<PlayerId>>(new Set());
  
  const mediaAssetsRef = useRef<MediaAsset[]>([]);
  mediaAssetsRef.current = mediaAssets;

  const screenRecorderRef = useRef<ScreenRecorderHandle>(null);
  const [recorderStatus, setRecorderStatus] = useState<RecordingStatus>('idle');

  const handlePrepareRecording = (includeMic: boolean) => {
    if (screenRecorderRef.current) {
      screenRecorderRef.current.prepare(includeMic);
    }
  };

  const handleMovieEnded = useCallback(() => {
      // If a recording is in progress when the main movie finishes, stop the recording.
      if (recorderStatus === 'recording' || recorderStatus === 'paused') {
        console.log("Main movie finished, stopping recording automatically.");
        screenRecorderRef.current?.stop();
      }
  }, [recorderStatus]);

  // Load settings from DB on mount
  useEffect(() => {
    const loadSettings = async () => {
        const storedMainTitle = await db.getSetting('mainTitle');
        if (storedMainTitle) setMainTitle(storedMainTitle);
        const storedSubTitle = await db.getSetting('subTitle');
        if (storedSubTitle) setSubTitle(storedSubTitle);
        const storedFeatureTitle = await db.getSetting('featureTitle');
        if (storedFeatureTitle) setFeatureTitle(storedFeatureTitle);
        
        const validThemes: Theme[] = ['indigo-empress', 'ruby-royalty', 'nollywood-noir'];
        const storedTheme = await db.getSetting('theme');
        if (storedTheme && validThemes.includes(storedTheme as Theme)) {
            setTheme(storedTheme);
        } else {
            setTheme('indigo-empress'); // Default to new default if stored theme is old/invalid
        }
    };
    loadSettings();
  }, []);

  // Save settings to DB when they change
  useEffect(() => {
    db.setSetting('mainTitle', mainTitle);
  }, [mainTitle]);
  useEffect(() => {
    db.setSetting('subTitle', subTitle);
  }, [subTitle]);
  useEffect(() => {
    db.setSetting('featureTitle', featureTitle);
  }, [featureTitle]);
  useEffect(() => {
    db.setSetting('theme', theme);
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);
  
  // Hydrate audio assets from DB on mount
  useEffect(() => {
    const hydrateAssets = async () => {
        const storedAudio = await db.getAllItems('audio_messages');
        if (storedAudio && storedAudio.length > 0) {
            const audioSrcs: Record<string, string> = {};
            storedAudio.forEach(item => {
                audioSrcs[item.id] = URL.createObjectURL(item.file);
            });
            setAudioSources(audioSrcs);
        }
    };
    hydrateAssets();

    // Cleanup object URLs on unmount
    return () => {
      mediaAssetsRef.current.forEach(asset => URL.revokeObjectURL(asset.url));
      Object.values(audioSources).forEach(url => {
        if(url) URL.revokeObjectURL(url);
      });
    };
  }, []); 

  useEffect(() => {
    if (activeAssetId) setMovieSource({ type: 'local', assetId: activeAssetId });
  }, [activeAssetId]);

  const handleAddMediaAssets = (files: FileList) => {
    // Revoke URLs from previous assets before replacing them
    mediaAssets.forEach(asset => URL.revokeObjectURL(asset.url));
    
    const assetsToProcess: MediaAsset[] = Array.from(files).filter(f => f.type.startsWith('video/')).map(file => ({ id: self.crypto.randomUUID(), name: file.name, url: URL.createObjectURL(file), file, duration: 0 }));

    if (assetsToProcess.length === 0) return;

    const promises = assetsToProcess.map(asset => new Promise<MediaAsset>(resolve => {
        const videoEl = document.createElement('video');
        videoEl.src = asset.url;
        videoEl.onloadedmetadata = async () => {
            const finalAsset = { ...asset, duration: videoEl.duration };
            resolve(finalAsset);
        };
        videoEl.onerror = () => { console.error(`Error loading metadata for ${asset.name}`); resolve(asset); };
    }));
    Promise.all(promises).then(finalAssets => {
        setMediaAssets(finalAssets);
        if (finalAssets.length > 0) {
          setActiveAssetId(finalAssets[0].id);
        } else {
          setActiveAssetId(null);
        }
    });
  };

  const handleYoutubeUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrlInput) { setMovieSource({ type: 'youtube', url: youtubeUrlInput }); setActiveAssetId(null); setYoutubeUrlInput(''); }
  };
  
  const handleAudioFileChange = async (id: PlayerId, file: File) => {
      playSound('drop');
      const url = URL.createObjectURL(file);
      setAudioSources(prev => {
          const oldUrl = prev[id];
          if(oldUrl) URL.revokeObjectURL(oldUrl);
          return { ...prev, [id]: url };
      });
      await db.storeItem('audio_messages', { id, file });
  };
  
  const handleAudioFileRemove = async (id: PlayerId) => {
      playSound('delete');
      setAudioSources(prev => {
          const oldUrl = prev[id];
          if(oldUrl) URL.revokeObjectURL(oldUrl);
          return { ...prev, [id]: null };
      });
      await db.deleteItem('audio_messages', id);
  };

  const handlePlay = useCallback((id: PlayerId) => {
    setActivePlayers(currentPlayers => {
        const next = new Set(currentPlayers);

        if (id.startsWith('audio-')) {
            const videoPlayerIds: PlayerId[] = ['movie', 'studio-left', 'studio-right'];
            const currentlyPlayingVideos = new Set([...currentPlayers].filter(p => videoPlayerIds.includes(p)));
            if (currentlyPlayingVideos.size > 0) {
                setPlayersToResume(currentlyPlayingVideos);
            } else {
                setPlayersToResume(new Set());
            }
            videoPlayerIds.forEach(p => next.delete(p));
            next.add(id);
        } else if (id === 'movie') {
            next.delete('studio-left');
            next.delete('studio-right');
            next.add(id);
        } else if (id.startsWith('studio-')) {
            next.delete('movie');
            next.add(id);
        } else {
            next.add(id);
        }
        return next;
    });
  }, []);

  const handlePause = useCallback((id: PlayerId) => {
    setActivePlayers(prevActive => {
        if (id.startsWith('audio-')) {
            const next = new Set(prevActive);
            next.delete(id);
            playersToResume.forEach(p => next.add(p));
            setPlayersToResume(new Set());
            return next;
        } else {
            const next = new Set(prevActive);
            next.delete(id);
            return next;
        }
    });
  }, [playersToResume]);
  
  const handleAudioEnded = useCallback((id: PlayerId) => handlePause(id), [handlePause]);

  const handleTogglePlayAll = useCallback(() => {
      const videoPlayers: PlayerId[] = ['movie', 'studio-left', 'studio-right'];
      setActivePlayers(prev => {
          const areAllPlaying = videoPlayers.every(p => prev.has(p));
          const next = new Set(prev);
          if (areAllPlaying) videoPlayers.forEach(p => next.delete(p));
          else videoPlayers.forEach(p => next.add(p));
          return next;
      });
  }, []);
  
  useEffect(() => {
    for (const [id, ref] of Object.entries(audioRefs)) {
        const player = ref.current;
        if (player) {
            if (activePlayers.has(id as PlayerId)) player.play().catch(e => console.error(`Playback failed for ${id}:`, e));
            else player.pause();
        }
    }
  }, [activePlayers]);
  
  const handleEditableKeyDown = (e: React.KeyboardEvent<HTMLElement>) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); } };
  
  const handleMoviePlayRequest = useCallback(() => handlePlay('movie'), [handlePlay]);
  const handleMoviePauseRequest = useCallback(() => handlePause('movie'), [handlePause]);
  const handleStudioPlayRequest = useCallback((studio: 'left' | 'right') => handlePlay(studio === 'left' ? 'studio-left' : 'studio-right'), [handlePlay]);
  const handleStudioPauseRequest = useCallback((studio: 'left' | 'right') => handlePause(studio === 'left' ? 'studio-left' : 'studio-right'), [handlePause]);
  
  const handleThemeChange = () => {
    playSound('click');
    const themes: Theme[] = ['indigo-empress', 'ruby-royalty', 'nollywood-noir'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };
  
  const renderView = () => {
    switch(currentView) {
      case 'welcome':
        return <WelcomeScreen 
                  featureTitle={featureTitle} 
                  onFeatureTitleChange={setFeatureTitle} 
                  onEnter={() => setCurrentView('studio')} 
                  onStartRecordingRequest={handlePrepareRecording} 
                  recorderStatus={recorderStatus}
                  onAddMediaAssets={handleAddMediaAssets}
                  activeMediaAsset={activeMediaAsset}
                  movieSource={movieSource}
                  isMoviePlayerActive={activePlayers.has('movie')}
                  onMoviePlayRequest={handleMoviePlayRequest}
                  onMoviePauseRequest={handleMoviePauseRequest}
                  onMovieEnded={handleMovieEnded}
                  youtubeUrlInput={youtubeUrlInput}
                  onYoutubeUrlInputChange={setYoutubeUrlInput}
                  onYoutubeUrlSubmit={handleYoutubeUrlSubmit}
                  movieRef={movieRef}
                />;
      case 'studio':
        return ( <StudioPage onAddMediaAssets={handleAddMediaAssets} activeMediaAsset={activeMediaAsset} movieRef={movieRef} movieSource={movieSource} youtubeUrlInput={youtubeUrlInput} onYoutubeUrlInputChange={setYoutubeUrlInput} onYoutubeUrlSubmit={handleYoutubeUrlSubmit} isMoviePlayerActive={activePlayers.has('movie')} onMoviePlayRequest={handleMoviePlayRequest} onMoviePauseRequest={handleMoviePauseRequest} onMovieEnded={handleMovieEnded} isLeftStudioActive={activePlayers.has('studio-left')} isRightStudioActive={activePlayers.has('studio-right')} onStudioPlayRequest={handleStudioPlayRequest} onStudioPauseRequest={handleStudioPauseRequest} /> );
      case 'goodbye':
        return <GoodbyeScreen featureTitle={featureTitle} onAnimationEnd={() => { setCurrentView('welcome'); }} />;
    }
  }

  const isStudio = currentView === 'studio';
  const areAllVideosPlaying = activePlayers.has('movie') && activePlayers.has('studio-left') && activePlayers.has('studio-right');

  return (
    <div className="text-white h-screen flex flex-col antialiased overflow-hidden living-background">
      <ScreenRecorder ref={screenRecorderRef} onStatusChange={setRecorderStatus} />
      
      <header className="flex items-center justify-between py-3 px-6 border-b border-[var(--color-border-secondary)]/50 shrink-0 shadow-lg bg-[var(--color-surface-2)]/30 backdrop-blur-sm z-20">
        <div className="flex-1 flex justify-start gap-2">
            {['1', '2', '3', '4'].map(i => {
                const id = `audio-left-${i}` as PlayerId;
                return ( <AudioMessagePlayer key={id} ref={audioRefs[id]} id={id} title={`Left Audio ${i}`} isPlaying={activePlayers.has(id)} audioUrl={audioSources[id] || null} onPlayRequest={() => handlePlay(id)} onPauseRequest={() => handlePause(id)} onEnded={() => handleAudioEnded(id)} onFileChange={(file) => handleAudioFileChange(id, file)} onFileRemove={() => handleAudioFileRemove(id)} /> );
            })}
        </div>

        <div className="flex flex-col items-center text-center">
            <h1 contentEditable={!isStudio} suppressContentEditableWarning onBlur={e => setMainTitle(e.currentTarget.textContent?.trim() || 'Kannywood HTV')} onKeyDown={handleEditableKeyDown} className="text-4xl font-bold font-lora text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent-text)] via-[var(--color-accent-2)] to-[var(--color-danger-rgb)] cursor-pointer outline-none focus:ring-2 focus:ring-[var(--color-accent-1)] rounded-md px-2" style={{backgroundImage: 'var(--main-title-gradient)'}}>{mainTitle}</h1>
            <p contentEditable={!isStudio} suppressContentEditableWarning onBlur={e => setSubTitle(e.currentTarget.textContent?.trim() || '')} onKeyDown={handleEditableKeyDown} className="text-lg text-[var(--color-text-secondary)] cursor-pointer outline-none focus:ring-2 focus:ring-[var(--color-accent-2)] rounded-md px-2 mt-1">{subTitle}</p>
        </div>

        <div className="flex-1 flex justify-end items-center gap-2">
            {['1', '2', '3', '4'].map(i => {
                const id = `audio-right-${i}` as PlayerId;
                return ( <AudioMessagePlayer key={id} ref={audioRefs[id]} id={id} title={`Right Audio ${i}`} isPlaying={activePlayers.has(id)} audioUrl={audioSources[id] || null} onPlayRequest={() => handlePlay(id)} onPauseRequest={() => handlePause(id)} onEnded={() => handleAudioEnded(id)} onFileChange={(file) => handleAudioFileChange(id, file)} onFileRemove={() => handleAudioFileRemove(id)} /> );
            })}
             {isStudio && ( <button onClick={() => setCurrentView('goodbye')} className="tool-button !p-2" aria-label="Close Studio"><CloseIcon /></button> )}
        </div>
      </header>
      
      <div className="flex-grow flex flex-col overflow-hidden">{renderView()}</div>

      <footer className="flex items-center justify-between py-2 px-4 border-t border-[var(--color-border-secondary)]/50 text-[var(--color-text-muted)] text-xs shrink-0 bg-[var(--color-surface-2)]/30 backdrop-blur-sm">
        <p>© 2025 Kannywood HTV. All Rights Reserved.</p>
        <div className="flex items-center gap-4">
            {isStudio && ( <button onClick={handleTogglePlayAll} className="footer-control-button flex items-center gap-2 px-3 !text-sm" aria-label={areAllVideosPlaying ? 'Pause all players' : 'Play all players'}> {areAllVideosPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />} <span className="font-semibold">{areAllVideosPlaying ? 'Pause All' : 'Play All'}</span> </button> )}
            <AmbientPlayer />
            <button onClick={handleThemeChange} className="footer-control-button" aria-label="Change theme"><PaintBrushIcon /></button>
            <button onClick={toggleMute} className="footer-control-button" aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}>{isMuted ? <SoundOffIcon /> : <SoundOnIcon />}</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
