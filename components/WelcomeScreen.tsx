import React, { useState, useRef } from 'react';
import { useSound } from '../hooks/useSound.tsx';
import { RecordIcon } from './icons/RecordIcon.tsx';
import { RecordingStatus, MediaAsset } from '../types.ts';
import MoviePlayer from './MoviePlayer.tsx';

type MovieSource = { type: 'local'; assetId: string } | { type: 'youtube'; url: string; } | null;

interface WelcomeScreenProps {
  featureTitle: string;
  onFeatureTitleChange: (newTitle: string) => void;
  onEnter: () => void;
  onStartRecordingRequest: (includeMic: boolean) => void;
  recorderStatus: RecordingStatus;
  // Movie Player props
  onAddMediaAssets: (files: FileList) => void;
  activeMediaAsset: MediaAsset | null;
  movieSource: MovieSource;
  isMoviePlayerActive: boolean;
  onMoviePlayRequest: () => void;
  onMoviePauseRequest: () => void;
  youtubeUrlInput: string;
  onYoutubeUrlInputChange: (value: string) => void;
  onYoutubeUrlSubmit: (e: React.FormEvent) => void;
  movieRef: React.RefObject<{ seekTo: (time: number) => void; }>;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = (props) => {
  const { 
    featureTitle, onFeatureTitleChange, onEnter, onStartRecordingRequest,
    recorderStatus, onAddMediaAssets, activeMediaAsset, movieSource, 
    isMoviePlayerActive, onMoviePlayRequest, onMoviePauseRequest, 
    youtubeUrlInput, onYoutubeUrlInputChange, onYoutubeUrlSubmit, movieRef
  } = props;

  const [isExiting, setIsExiting] = useState(false);
  const [includeMic, setIncludeMic] = useState(true);
  const { playSound } = useSound();
  const tvContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
      const el = tvContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rx = (y / rect.height - 0.5) * -15; // Rotate on X-axis
      const ry = (x / rect.width - 0.5) * 15;  // Rotate on Y-axis
      el.style.setProperty('--rx', `${rx}deg`);
      el.style.setProperty('--ry', `${ry}deg`);
  };

  const handleMouseLeave = () => {
      const el = tvContainerRef.current;
      if (!el) return;
      // Reset to default tilt
      el.style.setProperty('--rx', `8deg`);
      el.style.setProperty('--ry', `-12deg`);
  };

  const handleEditableKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };
  
  const handleEnter = () => {
    if (isExiting) return;
    playSound('start'); 
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 800); 
  };
  
  const handleRecordClick = () => {
    onStartRecordingRequest(includeMic);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const showRecordControls = recorderStatus === 'idle' || recorderStatus === 'finished';

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-4 lg:p-8 overflow-hidden" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className={`w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 transition-opacity duration-500 ${isExiting ? 'tv-zoom-in-to-studio' : ''}`}>

        {/* Info Panel */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
          <h2 
            className="font-lora text-4xl lg:text-5xl font-bold text-transparent bg-clip-text editable-title cursor-text outline-none rounded-md px-2 py-1 transition-all"
            style={{backgroundImage: 'var(--main-title-gradient)'}}
            contentEditable
            suppressContentEditableWarning
            onBlur={e => onFeatureTitleChange(e.currentTarget.textContent?.trim() || 'Untitled Feature')}
            onKeyDown={handleEditableKeyDown}
          >
            {featureTitle}
          </h2>
          <p className="text-[var(--color-text-secondary)] font-lora text-lg mt-2">
            {currentDate}
          </p>
          <div className="w-48 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-text)] to-transparent mx-auto lg:mx-0 my-6"></div>
          <button onClick={handleEnter} className="tool-button !text-lg !px-8 !py-4">
            Enter Studio
          </button>
        </div>
        
        {/* TV Panel */}
        <div className="relative w-full lg:w-1/2 order-1 lg:order-2">
            <div ref={tvContainerRef} className="living-tv-container">
                <div className="living-tv-body">
                    <div className="living-tv-screen-area">
                        <div className="living-tv-screen-wrapper">
                            <div className="living-tv-screen">
                                <MoviePlayer 
                                  ref={movieRef}
                                  assetToPlay={activeMediaAsset}
                                  youtubeUrl={movieSource?.type === 'youtube' ? movieSource.url : null}
                                  isPlaying={isMoviePlayerActive}
                                  onPlayRequest={onMoviePlayRequest}
                                  onPauseRequest={onMoviePauseRequest}
                                  youtubeUrlInput={youtubeUrlInput}
                                  onYoutubeUrlInputChange={onYoutubeUrlInputChange}
                                  onYoutubeUrlSubmit={onYoutubeUrlSubmit}
                                  onAddMediaAssets={onAddMediaAssets}
                                  showUploadPlaceholder={true}
                                />
                            </div>
                        </div>
                        <div className="living-tv-brand">K-HTV 2000</div>
                    </div>
                    <div className="living-tv-controls">
                        <div className="living-tv-grille" />
                        <div className="living-tv-knob" />
                        <div className="living-tv-knob" />
                    </div>
                </div>
                <div className="living-tv-stand" />
            </div>
        </div>
      </div>
      
      {showRecordControls && !isExiting && (
          <div className="mt-8 flex flex-col items-center gap-3 fade-in">
            <button 
              onClick={handleRecordClick} 
              className="tool-button flex items-center gap-2 !text-base !px-6 !py-3 bg-[rgba(var(--color-danger-rgb),0.2)] border-[rgba(var(--color-danger-rgb),0.5)] text-[rgb(var(--color-danger-rgb))] hover:bg-[rgba(var(--color-danger-rgb),0.4)] hover:border-[rgba(var(--color-danger-rgb),0.8)]"
            >
                <RecordIcon/>
                Start Recording
            </button>
            <div className="flex items-center">
                <input 
                    id="mic-checkbox-welcome"
                    type="checkbox"
                    checked={includeMic}
                    onChange={(e) => setIncludeMic(e.target.checked)}
                    className="w-4 h-4 text-[var(--color-accent-1)] bg-[var(--color-surface-4)] border-[var(--color-border-secondary)] rounded focus:ring-[var(--color-accent-1)] focus:ring-offset-[var(--color-background-main)] focus:ring-2 cursor-pointer"
                />
                <label htmlFor="mic-checkbox-welcome" className="ml-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                    Include Microphone
                </label>
            </div>
          </div>
      )}
    </main>
  );
};

export default WelcomeScreen;