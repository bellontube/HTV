

import React, { useState } from 'react';
import { useSound } from '../hooks/useSound.tsx';
import { RecordIcon } from './icons/RecordIcon.tsx';

interface WelcomeScreenProps {
  bookTitle: string;
  onBookTitleChange: (newTitle: string) => void;
  onEnter: () => void;
  onStartRecordingRequest: (includeMic: boolean) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  bookTitle,
  onBookTitleChange,
  onEnter,
  onStartRecordingRequest,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [includeMic, setIncludeMic] = useState(true);
  const { playSound } = useSound();

  const handleEditableKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  };
  
  const handleEnter = () => {
    if (isExiting) return;
    playSound('book-open');
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

  return (
    <main className="flex-grow flex flex-col items-center justify-center p-8 overflow-hidden" style={{ perspective: '1500px' }}>
      <div 
        className={`relative w-80 h-[450px] cursor-pointer group book-container ${isExiting ? 'book-exit-to-studio' : ''}`}
        style={{ transform: 'rotateY(-28deg) rotateX(8deg)' }}
        aria-label="Open the studio"
        role="button"
      >
        <div onClick={handleEnter} className="absolute w-full h-full">
            <div className="absolute w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
                <div className="absolute w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg" style={{ transform: 'translateZ(-30px)' }} />
                <div className="absolute w-full h-full" style={{ transform: 'translateX(-28px) translateZ(-2px) rotateY(-90deg) scaleY(0.98)', width: '28px', background: 'linear-gradient(to right, #f9fafb, #e5e7eb, #d1d5db)' }} />
                <div className="absolute top-0 left-0 w-full h-full rounded-r-lg border-l-2 border-r-2 border-gray-900" style={{ transform: 'translateX(-30px) translateZ(-2px) rotateY(-90deg)', width: '32px', background: 'linear-gradient(to right, #2a203e, #1e172e, #2a203e)' }} />
                <div className="book-cover absolute w-full h-full border-purple-800/60 rounded-lg shadow-2xl shadow-purple-900/20 flex flex-col justify-between p-6 text-center text-white transform-gpu transition-all duration-500 group-hover:transform group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:rotateY(3deg) group-hover:shadow-3xl">
                  <div className="w-full relative z-10">
                    <div className="w-full py-1">
                      <h3 className="font-lora text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-red-400 editable-book-title cursor-text outline-none rounded-md px-2 py-1 transition-all"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => onBookTitleChange(e.currentTarget.textContent?.trim() || 'Untitled Feature')}
                        onKeyDown={handleEditableKeyDown}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {bookTitle}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-300 font-lora text-lg mt-4 italic relative z-10">
                    {currentDate}
                  </p>
                  <div className="text-center relative z-10">
                    <p className="text-gray-400 font-lora italic text-md">Click to open the studio</p>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mx-auto mt-2"></div>
                  </div>
                </div>
            </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button onClick={handleRecordClick} className="tool-button flex items-center gap-2 !text-base !px-6 !py-3 bg-red-600/20 border-red-500/50 text-red-300 hover:bg-red-600/40 hover:border-red-500/80">
            <RecordIcon/>
            Start
        </button>
        <div className="flex items-center">
            <input 
                id="mic-checkbox-welcome"
                type="checkbox"
                checked={includeMic}
                onChange={(e) => setIncludeMic(e.target.checked)}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-offset-gray-800 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="mic-checkbox-welcome" className="ml-2 text-sm text-gray-300 cursor-pointer">
                Mic Only
            </label>
        </div>
      </div>
    </main>
  );
};

export default WelcomeScreen;