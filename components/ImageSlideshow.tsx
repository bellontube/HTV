
import React, { useState, useEffect, useRef } from 'react';
import { StudioMediaItem } from '../types.ts';
import { PlayIcon } from './icons/PlayIcon.tsx';
import { PauseIcon } from './icons/PauseIcon.tsx';
import { NextIcon } from './icons/NextIcon.tsx';
import { PrevIcon } from './icons/PrevIcon.tsx';

interface ImageSlideshowProps {
  images: StudioMediaItem[];
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [delay, setDelay] = useState(3000); // 3 seconds

  const currentImage: StudioMediaItem | undefined = images[currentIndex];

  useEffect(() => {
    // Reset index if images change and current index is out of bounds
    if (images.length > 0 && currentIndex >= images.length) {
      setCurrentIndex(0);
    }
    // If all images are cleared, stop playing
    if (images.length === 0) {
        setIsPlaying(false);
    } else if (!isPlaying && images.length > 0) {
        // Auto-play when new images are added
        setIsPlaying(true);
    }
  }, [images, currentIndex]);

  useEffect(() => {
    if (isPlaying && images.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, delay);
      return () => clearInterval(timer);
    }
  }, [isPlaying, images.length, delay]);

  const handlePlayPause = () => {
    if (images.length > 0) {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (images.length > 0) {
      setCurrentIndex(prev => (prev + 1) % images.length);
    }
  };

  const handlePrev = () => {
    if (images.length > 0) {
      setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    }
  };

  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDelay = Number(e.target.value) * 1000;
    setDelay(Math.max(500, newDelay)); // Minimum 0.5s delay
  }

  const progressPercentage = images.length > 0 ? ((currentIndex + 1) / images.length) * 100 : 0;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
      <div className="w-full max-w-[280px] aspect-[9/16] bg-black rounded-2xl shadow-2xl shadow-[var(--color-shadow-primary)] overflow-hidden border-2 border-[var(--color-border-secondary)] relative flex flex-col">
        {/* Image Viewport */}
        <div className="flex-grow relative bg-black">
          {images.length > 0 ? (
            images.map((image, index) => (
              <div key={image.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                <img src={image.url} alt={image.prompt || `Image ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] text-center p-4">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               <p>Your slideshow will play here.</p>
            </div>
          )}
        </div>

        {/* Controls Area */}
        <div className="shrink-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
          <div className="w-full bg-[var(--color-surface-4)]/50 rounded-full h-1 mb-3">
            <div className="bg-[var(--color-accent-1)] h-1 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
          </div>
          <div className="flex items-center justify-center gap-5">
            <button onClick={handlePrev} disabled={images.length < 2} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed transition-colors"><PrevIcon /></button>
            <button onClick={handlePlayPause} disabled={images.length === 0} className="w-12 h-12 rounded-full bg-[var(--color-accent-1)] text-white flex items-center justify-center hover:opacity-90 transition-all transform hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying && images.length > 0 ? <PauseIcon /> : <PlayIcon />}
            </button>
            <button onClick={handleNext} disabled={images.length < 2} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:text-[var(--color-text-muted)] disabled:cursor-not-allowed transition-colors"><NextIcon /></button>
          </div>
        </div>
      </div>
      
      {/* Speed Control */}
      <div className="w-full max-w-[280px] flex items-center gap-2 px-2">
        <label htmlFor="speed" className="text-xs text-[var(--color-text-muted)]">Speed</label>
        <input 
          id="speed"
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={delay / 1000}
          onChange={handleDelayChange}
          disabled={images.length === 0}
          className="w-full"
        />
        <span className="text-xs text-[var(--color-text-secondary)] w-8 text-right">
          {delay/1000}s
        </span>
      </div>
    </div>
  );
};

export default ImageSlideshow;