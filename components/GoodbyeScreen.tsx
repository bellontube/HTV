import React, { useEffect } from 'react';
import { useSound } from '../hooks/useSound.tsx';

interface GoodbyeScreenProps {
  featureTitle: string;
  onAnimationEnd: () => void;
}

const GoodbyeScreen: React.FC<GoodbyeScreenProps> = ({ featureTitle, onAnimationEnd }) => {
  const { playSound } = useSound();

  useEffect(() => {
    playSound('book-close'); // Keep a closing sound
  }, [playSound]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main 
      className="flex-grow flex flex-col items-center justify-center p-8 overflow-hidden tv-zoom-out-from-studio" 
      onAnimationEnd={onAnimationEnd}
    >
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
        {/* Info Panel */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
          <h2 
            className="font-lora text-4xl lg:text-5xl font-bold text-transparent bg-clip-text px-2 py-1"
            style={{backgroundImage: 'var(--main-title-gradient)'}}
          >
            {featureTitle}
          </h2>
          <p className="text-[var(--color-text-secondary)] font-lora text-lg mt-2">
            {currentDate}
          </p>
           <div className="w-48 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-text)] to-transparent mx-auto lg:mx-0 my-6"></div>
          <p className="text-[var(--color-text-muted)] font-lora italic text-md">Thank you for creating!</p>
        </div>

        {/* TV Panel */}
        <div className="relative w-full lg:w-1/2 order-1 lg:order-2">
            <div className="living-tv-container">
                <div className="living-tv-body">
                    <div className="living-tv-screen-area">
                        <div className="living-tv-screen-wrapper">
                            <div className="living-tv-screen" />
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
    </main>
  );
};

export default GoodbyeScreen;