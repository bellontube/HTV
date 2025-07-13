
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Story, Scene } from '../types.ts';
import { PlayIcon } from './icons/PlayIcon.tsx';
import { PauseIcon } from './icons/PauseIcon.tsx';
import { NextIcon } from './icons/NextIcon.tsx';
import { PrevIcon } from './icons/PrevIcon.tsx';
import { ReplayIcon } from './icons/ReplayIcon.tsx';
import { ShareIcon } from './icons/ShareIcon.tsx';

interface StoryPlayerProps {
  story: Story;
}

const StoryPlayer: React.FC<StoryPlayerProps> = ({ story }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [showMoral, setShowMoral] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const currentScene: Scene | undefined = story.scenes[currentSceneIndex];

  const handleAudioEnd = useCallback(() => {
    if (currentSceneIndex < story.scenes.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      setIsFinished(true);
      setShowMoral(true);
    }
  }, [currentSceneIndex, story.scenes.length]);
  
  useEffect(() => {
    const audioEl = audioRef.current;
    if (audioEl) {
      const onWaiting = () => setIsAudioLoading(true);
      const onCanPlay = () => setIsAudioLoading(false);

      audioEl.addEventListener('ended', handleAudioEnd);
      audioEl.addEventListener('waiting', onWaiting);
      audioEl.addEventListener('playing', onCanPlay);
      audioEl.addEventListener('canplay', onCanPlay);

      return () => {
        audioEl.removeEventListener('ended', handleAudioEnd);
        audioEl.removeEventListener('waiting', onWaiting);
        audioEl.removeEventListener('playing', onCanPlay);
        audioEl.removeEventListener('canplay', onCanPlay);
      };
    }
  }, [handleAudioEnd]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    setIsAudioLoading(false); 
    if (isPlaying) {
      if (currentScene?.audioUrl) {
        if (audioEl.src !== currentScene.audioUrl) {
          audioEl.src = currentScene.audioUrl;
        }
        audioEl.play().catch(e => {
          console.error("Audio play failed:", e);
          setIsPlaying(false);
        });
      } else {
        setIsPlaying(false);
      }
    } else {
      audioEl.pause();
    }
  }, [currentScene, isPlaying]);

  const handlePlayPause = () => {
    if (isFinished) {
        setCurrentSceneIndex(0);
        setIsFinished(false);
        setIsPlaying(true);
    } else {
        setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (currentSceneIndex < story.scenes.length - 1) {
      setIsFinished(false);
      setCurrentSceneIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      setIsFinished(false);
      setCurrentSceneIndex(prev => prev - 1);
    }
  };
  
  const handleShare = async () => {
    const shareData = {
      title: `AI Story: ${story.title}`,
      text: `Check out this AI-generated story in Hausa: "${story.title}".\n\nMoral: ${story.moral}`,
      url: window.location.href,
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            throw new Error('Web Share API not supported, falling back to clipboard.');
        }
    } catch (err) {
      console.log(err);
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`).then(() => {
        setShareStatus('Copied!');
        setTimeout(() => setShareStatus(''), 2000);
      }, () => {
        setShareStatus('Failed');
        setTimeout(() => setShareStatus(''), 2000);
      });
    }
  };

  const progressPercentage = ((currentSceneIndex + 1) / story.scenes.length) * 100;
  const canPlay = !!currentScene?.audioUrl;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <audio ref={audioRef} className="hidden" />
      <div className="w-full max-w-[280px] aspect-[9/16] bg-black rounded-2xl shadow-2xl shadow-purple-900/20 overflow-hidden border-2 border-gray-700 relative flex flex-col">
        {/* Image Viewport */}
        <div className="flex-grow relative bg-black">
          {story.scenes.map((scene, index) => (
            <div key={scene.sceneNumber} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSceneIndex ? 'opacity-100' : 'opacity-0'}`}>
              {scene.imageUrl ? (
                <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover ken-burns" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black" />
              )}
            </div>
          ))}

          {/* Loading/Buffering Overlay */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 transition-opacity duration-300 pointer-events-none ${!currentScene?.imageUrl || !currentScene?.audioUrl || isAudioLoading ? 'opacity-100' : 'opacity-0'}`}>
             {!currentScene?.imageUrl ? <><div className="w-8 h-8 border-2 border-t-purple-500 border-gray-700 rounded-full animate-spin"></div><p className="text-gray-400 text-xs">Generating image...</p></>
            : !currentScene?.audioUrl ? <><div className="w-8 h-8 border-2 border-t-pink-500 border-gray-700 rounded-full animate-spin"></div><p className="text-gray-400 text-xs">Generating audio...</p></>
            : isAudioLoading ? <><div className="w-8 h-8 border-2 border-t-blue-500 border-gray-700 rounded-full animate-spin"></div><p className="text-gray-400 text-xs">Buffering...</p></>
            : null}
          </div>

          {/* Finished Overlay */}
          {isFinished && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center transition-opacity duration-1000">
                  <h3 className="text-lg font-lora text-purple-300 mb-2">Darasi (Moral)</h3>
                  <p className="text-md text-gray-200 font-lora">{story.moral}</p>
              </div>
          )}
        </div>

        {/* Subtitles & Controls Area */}
        <div className="shrink-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <p className="text-white text-center text-sm mb-3 h-10 flex items-center justify-center" key={currentSceneIndex}>
            {currentScene?.text}
          </p>
          <div className="w-full bg-gray-600/50 rounded-full h-1 mb-3">
            <div className="bg-purple-500 h-1 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
          </div>
          <div className="flex items-center justify-center gap-5">
            <button onClick={handlePrev} disabled={currentSceneIndex === 0} className="text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"><PrevIcon /></button>
            <button onClick={handlePlayPause} disabled={!canPlay && !isFinished} className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-all transform hover:scale-110 shadow-lg disabled:bg-purple-900 disabled:cursor-wait" aria-label={isFinished ? 'Replay' : isPlaying ? 'Pause' : 'Play'}>
              {isFinished ? <ReplayIcon /> : (isPlaying ? <PauseIcon /> : <PlayIcon />)}
            </button>
            <button onClick={handleNext} disabled={currentSceneIndex === story.scenes.length - 1} className="text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"><NextIcon /></button>
          </div>
        </div>
      </div>
      
      {/* Action buttons below player */}
      <div className="w-full max-w-[280px] flex items-center justify-center gap-2 mt-2">
          <button onClick={() => setShowMoral(!showMoral)} className="flex-1 bg-gray-700 text-gray-300 font-semibold py-1.5 px-3 rounded-md hover:bg-gray-600 hover:text-white transition-all duration-300 text-xs">{showMoral ? 'Hide' : 'Show'} Moral</button>
          <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-1.5 bg-gray-700 text-gray-300 font-semibold py-1.5 px-3 rounded-md hover:bg-gray-600 hover:text-white transition-all duration-300 text-xs"><ShareIcon />{shareStatus || 'Share'}</button>
      </div>
      {showMoral && (
          <blockquote className="w-full max-w-[280px] mt-2 border-l-2 border-purple-400 pl-2 text-xs">
            <h3 className="font-bold text-purple-300">Moral:</h3>
            <p className="text-gray-300 italic">{story.moral}</p>
          </blockquote>
        )}
    </div>
  );
};

export default StoryPlayer;
