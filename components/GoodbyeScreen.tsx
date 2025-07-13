
import React, { useEffect } from 'react';
import { useSound } from '../hooks/useSound.tsx';

interface GoodbyeScreenProps {
  bookTitle: string;
  onAnimationEnd: () => void;
}

const GoodbyeScreen: React.FC<GoodbyeScreenProps> = ({ bookTitle, onAnimationEnd }) => {
  const { playSound } = useSound();

  useEffect(() => {
    playSound('book-close');
  }, [playSound]);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main 
      className="flex-grow flex items-center justify-center p-8 overflow-hidden" 
      style={{ perspective: '1500px' }}
      onAnimationEnd={onAnimationEnd}
    >
      <div 
        className="relative w-80 h-[450px] group book-container book-enter-from-studio"
        style={{ transform: 'rotateY(-28deg) rotateX(8deg)' }}
        aria-label="Closing the studio"
        role="presentation"
      >
        {/* Main book structure with preserve-3d */}
        <div className="absolute w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            {/* Back Cover */}
            <div className="absolute w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg" style={{ transform: 'translateZ(-30px)' }} />
            
            {/* Pages */}
            <div className="absolute w-full h-full" style={{ transform: 'translateX(-28px) translateZ(-2px) rotateY(-90deg) scaleY(0.98)', width: '28px', background: 'linear-gradient(to right, #f9fafb, #e5e7eb, #d1d5db)' }} />
            
            {/* Spine */}
            <div className="absolute top-0 left-0 w-full h-full rounded-r-lg border-l-2 border-r-2 border-gray-900" style={{ 
              transform: 'translateX(-30px) translateZ(-2px) rotateY(-90deg)', 
              width: '32px',
              background: 'linear-gradient(to right, #2a203e, #1e172e, #2a203e)'
            }} />

            {/* Front Cover */}
            <div className="book-cover absolute w-full h-full border-purple-800/60 rounded-lg shadow-2xl shadow-purple-900/20 flex flex-col justify-between p-6 text-center text-white transform-gpu">
              <div className="w-full relative z-10">
                <div className="w-full py-1">
                  <h3 className="font-lora text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-red-400 px-2 py-1">
                    {bookTitle}
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-300 font-lora text-lg mt-4 italic relative z-10">
                {currentDate}
              </p>

              <div className="text-center relative z-10">
                <p className="text-gray-400 font-lora italic text-md">Thank you for creating!</p>
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mx-auto mt-2"></div>
              </div>
            </div>
        </div>
      </div>
    </main>
  );
};

export default GoodbyeScreen;