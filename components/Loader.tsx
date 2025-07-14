
import React, { useState, useEffect } from 'react';

const loadingTexts = [
  "Sketching concepts on a digital canvas...",
  "Mixing digital paints...",
  "Rendering pixels into art...",
  "Consulting the muse of creation...",
  "Focusing the lens of imagination...",
  "Waking the spirits of the algorithm...",
];

const Loader: React.FC = () => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % loadingTexts.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);


  return (
    <div className="flex flex-col items-center justify-center gap-4 my-8 p-6 bg-[var(--color-surface-3)]/50 rounded-xl w-full">
      <div className="w-12 h-12 border-4 border-t-[var(--color-accent-1)] border-[var(--color-border-secondary)] rounded-full animate-spin"></div>
      <p className="text-[var(--color-text-secondary)] text-lg font-semibold">Generating Images</p>
      <p className="text-[var(--color-text-muted)] text-sm text-center transition-opacity duration-500 h-10 flex items-center">
        {loadingTexts[currentTextIndex]}
      </p>
    </div>
  );
};

export default Loader;