

import React, { useState, useEffect, useRef } from 'react';
import WelcomeScreen from './components/WelcomeScreen.tsx';
import GoodbyeScreen from './components/GoodbyeScreen.tsx';
import StudioPage from './components/pages/StudioPage.tsx';
import { StudioProvider } from './contexts/StudioProvider.tsx';
import { useSound } from './hooks/useSound.tsx';
import { SoundOnIcon } from './components/icons/SoundOnIcon.tsx';
import { SoundOffIcon } from './components/icons/SoundOffIcon.tsx';
import AmbientPlayer from './components/AmbientPlayer.tsx';
import { MediaAsset } from './types.ts';
import AudioMessagePlayer from './components/AudioMessagePlayer.tsx';
import { CloseIcon } from './components/icons/CloseIcon.tsx';
import * as db from './services/dbService.ts';
import ScreenRecorder from './components/ScreenRecorder.tsx';

type PlayerId = 'movie' |
  'audio-left-1' | 'audio-left-2' | 'audio-left-3' | 'audio-left-4' |
  'audio-right-1' | 'audio-right-2' | 'audio-right-3' | 'audio-right-4';
type AppView = 'welcome' | 'studio' | 'goodbye';
type MovieSource = { type: 'local'; assetId: string } | { type: 'youtube'; url: string; };

interface ScreenRecorderHandle {
  start: (includeMic: boolean) => void;
}

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('welcome');
  
  const [movieSource, setMovieSource] = useState<MovieSource | null>(null);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const { isMuted, toggleMute } = useSound();

  // General App State
  const [mainTitle, setMainTitle] = useState("Kannywood HTV");
  const [subTitle, setSubTitle] = useState("Welcome! If you enjoy the show, remember to like and subscribe!");
  const [bookTitle, setBookTitle] = useState("The Daily Feature");
  
  // Media State
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  
  const activeMediaAsset = mediaAssets.find(asset => asset.id === activeAssetId) || null;

  // Player Sync State
  const movieRef = useRef<{ seekTo: (time: number) => void }>(null);
  const audioRefs: Record<string, React.RefObject<HTMLAudioElement>> = {
    'audio-left-1': useRef<HTMLAudioElement>(null),
    'audio-left-2': useRef<HTMLAudioElement>(null),
    'audio-left-3': useRef<HTMLAudioElement>(null),
    'audio-left-4': useRef<HTMLAudioElement>(null),
    'audio-right-1': useRef<HTMLAudioElement>(null),
    'audio-right-2': useRef<HTMLAudioElement>(null),
    'audio-right-3': useRef<HTMLAudioElement>(null),
    'audio-right-4': useRef<HTMLAudioElement>(null),
  };
  const [activePlayer, setActivePlayer] = useState<PlayerId | null>(null);
  const [playerToResume, setPlayerToResume] = useState<'movie' | null>(null);
  
  const mediaAssetsRef = useRef<MediaAsset[]>([]);
  mediaAssetsRef.current = mediaAssets;

  const screenRecorderRef = useRef<ScreenRecorderHandle>(null);

  const handleStartRecording = (includeMic: boolean) => {
    if (screenRecorderRef.current) {
      screenRecorderRef.current.start(includeMic);
    }
  };

  // Load settings from DB on mount
  useEffect(() => {
    const loadSettings = async () => {
        const storedMainTitle = await db.getSetting('mainTitle');
        if (storedMainTitle !== undefined) setMainTitle(storedMainTitle);

        const storedSubTitle = await db.getSetting('subTitle');
        if (storedSubTitle !== undefined) setSubTitle(storedSubTitle);

        const storedBookTitle = await db.getSetting('bookTitle');
        if (storedBookTitle !== undefined) setBookTitle(storedBookTitle);
    };
    loadSettings();
  }, []);

  // Save settings to DB when they change
  useEffect(() => {
    const saveSettings = async () => {
      await db.setSetting('mainTitle', mainTitle);
      await db.setSetting('subTitle', subTitle);
      await db.setSetting('bookTitle', bookTitle);
    };
    saveSettings();
  }, [mainTitle, subTitle, bookTitle]);
  
  useEffect(() => {
    const hydrateAssets = async () => {
        const storedAssets = await db.getAllItems('videos');
        if (storedAssets && storedAssets.length > 0) {
            const assetsWithUrls = storedAssets.map(asset => ({
                ...asset,
                url: URL.createObjectURL(asset.file),
            }));
            setMediaAssets(assetsWithUrls);
        }
    };
    hydrateAssets();

    return () => {
      mediaAssetsRef.current.forEach(asset => URL.revokeObjectURL(asset.url));
    };
  }, []); 

  useEffect(() => {
    if (activeAssetId) {
        setMovieSource({ type: 'local', assetId: activeAssetId });
    }
  }, [activeAssetId]);

  const handleAddMediaAssets = (files: FileList) => {
    const assetsToProcess: MediaAsset[] = Array.from(files).map(file => ({
        id: self.crypto.randomUUID(), name: file.name, url: URL.createObjectURL(file), file, duration: 0,
    }));

    const promises = assetsToProcess.map(asset => new Promise<MediaAsset>(resolve => {
        const videoEl = document.createElement('video');
        videoEl.src = asset.url;
        videoEl.onloadedmetadata = async () => {
            const finalAsset = { ...asset, duration: videoEl.duration };
            const assetToStore = { id: finalAsset.id, name: finalAsset.name, file: finalAsset.file, duration: finalAsset.duration };
            await db.storeItem('videos', assetToStore);
            resolve(finalAsset);
        };
        videoEl.onerror = () => {
            console.error(`Error loading metadata for ${asset.name}`);
            resolve(asset);
        };
    }));

    Promise.all(promises).then(finalAssets => {
        setMediaAssets(prev => [...prev, ...finalAssets]);
        if (finalAssets.length > 0 && !activeAssetId) {
            setActiveAssetId(finalAssets[0].id);
        }
    });
  };


  const handleYoutubeUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrlInput) {
        setMovieSource({ type: 'youtube', url: youtubeUrlInput });
        setActiveAssetId(null); 
        setYoutubeUrlInput('');
    }
  };

  const handlePlay = (id: PlayerId) => {
    if (id.startsWith('audio-') && movieRef.current && activePlayer === 'movie') {
        setPlayerToResume('movie');
    }
    setActivePlayer(id);
  };
  const handlePause = (id: PlayerId) => {
    if (activePlayer !== id) return;
    if (id.startsWith('audio-')) {
        if (playerToResume === 'movie') {
            setActivePlayer('movie');
            setPlayerToResume(null);
        } else {
            setActivePlayer(null);
        }
    } else {
        setActivePlayer(null);
    }
  };
  const handleAudioEnded = () => {
    if (playerToResume === 'movie') {
        setActivePlayer('movie');
    } else {
        setActivePlayer(null);
    }
    setPlayerToResume(null);
  };

  useEffect(() => {
    for (const [id, ref] of Object.entries(audioRefs)) {
        const player = ref.current;
        if (player) {
            if (id === activePlayer) {
                player.play().catch(e => console.error(`Playback failed for ${id}:`, e));
            } else {
                player.pause();
            }
        }
    }
  }, [activePlayer]);
  
  const handleEditableKeyDown = (e: React.KeyboardEvent<HTMLElement>) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); } };
  
  const renderView = () => {
    switch(currentView) {
      case 'welcome':
        return <WelcomeScreen 
                  bookTitle={bookTitle} 
                  onBookTitleChange={setBookTitle} 
                  onEnter={() => setCurrentView('studio')}
                  onStartRecordingRequest={handleStartRecording}
                />;
      case 'studio': {
        return (
          <StudioProvider>
            <StudioPage
              mediaAssets={mediaAssets}
              onAddMediaAssets={handleAddMediaAssets}
              activeMediaAsset={activeMediaAsset}
              onSelectAsset={setActiveAssetId}
              movieRef={movieRef}
              movieSource={movieSource}
              youtubeUrlInput={youtubeUrlInput}
              onYoutubeUrlInputChange={setYoutubeUrlInput}
              onYoutubeUrlSubmit={handleYoutubeUrlSubmit}
              isPlaying={activePlayer === 'movie'}
              onPlayRequest={() => handlePlay('movie')}
              onPauseRequest={() => handlePause('movie')}
            />
          </StudioProvider>
        );
      }
      case 'goodbye':
        return <GoodbyeScreen bookTitle={bookTitle} onAnimationEnd={() => { setCurrentView('welcome'); }} />;
    }
  }

  const isStudio = currentView === 'studio';

  return (
    <div className="bg-gray-900 text-white h-screen flex flex-col antialiased overflow-hidden living-background">
      <ScreenRecorder ref={screenRecorderRef} />
      
      <header className="flex items-center justify-between py-3 px-6 border-b border-gray-700/50 shrink-0 shadow-lg bg-gray-900/30 backdrop-blur-sm main-header z-20">
        <div className="flex-1 flex justify-start gap-2">
            {['1', '2', '3', '4'].map(i => {
                const id = `audio-left-${i}` as PlayerId;
                return (
                    <AudioMessagePlayer 
                        key={id}
                        ref={audioRefs[id]}
                        id={`audio-import-left-${i}`}
                        title={`Left Audio ${i}`}
                        isPlaying={activePlayer === id}
                        onPlayRequest={() => handlePlay(id)}
                        onPauseRequest={() => handlePause(id)}
                        onEnded={handleAudioEnded}
                    />
                );
            })}
        </div>

        <div className="flex flex-col items-center text-center">
            <h1 contentEditable={!isStudio} suppressContentEditableWarning onBlur={e => setMainTitle(e.currentTarget.textContent?.trim() || 'Kannywood HTV')} onKeyDown={handleEditableKeyDown} className="text-4xl font-bold font-lora text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 cursor-pointer outline-none focus:ring-2 focus:ring-purple-500 rounded-md px-2">{mainTitle}</h1>
            <p contentEditable={!isStudio} suppressContentEditableWarning onBlur={e => setSubTitle(e.currentTarget.textContent?.trim() || '')} onKeyDown={handleEditableKeyDown} className="text-lg text-gray-400 cursor-pointer outline-none focus:ring-2 focus:ring-pink-500 rounded-md px-2 mt-1">{subTitle}</p>
        </div>

        <div className="flex-1 flex justify-end items-center gap-2">
            {['1', '2', '3', '4'].map(i => {
                const id = `audio-right-${i}` as PlayerId;
                return (
                   <AudioMessagePlayer
                        key={id}
                        ref={audioRefs[id]}
                        id={`audio-import-right-${i}`}
                        title={`Right Audio ${i}`}
                        isPlaying={activePlayer === id}
                        onPlayRequest={() => handlePlay(id)}
                        onPauseRequest={() => handlePause(id)}
                        onEnded={handleAudioEnded}
                   />
                );
            })}
             {isStudio && (
                <button onClick={() => setCurrentView('goodbye')} className="tool-button !p-2" aria-label="Close Studio">
                    <CloseIcon />
                </button>
            )}
        </div>
      </header>
      
      <div className="flex-grow flex flex-col overflow-hidden">
        {renderView()}
      </div>

      <footer className="flex items-center justify-between py-2 px-4 border-t border-gray-700/50 text-gray-500 text-xs shrink-0 bg-gray-900/30 backdrop-blur-sm main-footer">
        <p>© 2024 Kannywood HTV. All Rights Reserved.</p>
        <div className="flex items-center gap-4">
            <AmbientPlayer />
            <button onClick={toggleMute} className="footer-control-button" aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}>{isMuted ? <SoundOffIcon /> : <SoundOnIcon />}</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
