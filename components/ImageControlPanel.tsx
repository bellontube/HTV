
import React from 'react';
import { StudioMediaItem } from '../types.ts';
import Loader from './Loader.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';

interface ImageControlPanelProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
  images: StudioMediaItem[];
  error: string | null;
  onGenerate: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

const ImageControlPanel: React.FC<ImageControlPanelProps> = ({
  prompt,
  setPrompt,
  isGenerating,
  images,
  error,
  onGenerate,
  onImport,
  onRemove,
  onClearAll,
}) => {
  return (
    <div className="h-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold font-lora text-[var(--color-accent-text)] text-center shrink-0">Image Studio</h2>
      
      {isGenerating ? (
        <div className="flex-grow flex items-center justify-center">
            <Loader />
        </div>
      ) : (
        <div className="flex flex-col gap-4 flex-grow overflow-hidden">
            {/* Prompt Input */}
            <div className='shrink-0'>
              <label htmlFor="prompt" className="block text-md font-medium text-[var(--color-text-secondary)] mb-2">
                Image Generation Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="e.g., A majestic lion with a crown of stars..."
                className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-border-secondary)] rounded-lg text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-accent-1)] focus:border-[var(--color-accent-1)] transition-all resize-none"
                rows={3}
              />
            </div>
            
            {/* Gallery */}
            <div className="flex-grow bg-[var(--color-surface-2)]/50 border border-[var(--color-border-secondary)] rounded-lg flex flex-col overflow-hidden">
                <div className="p-2 border-b border-[var(--color-border-secondary)] flex justify-between items-center shrink-0">
                    <h3 className="font-semibold text-[var(--color-text-secondary)]">Image Gallery ({images.length})</h3>
                    {images.length > 0 && (
                        <button onClick={onClearAll} className="text-xs text-[var(--color-accent-2)] hover:opacity-80 hover:underline">Clear All</button>
                    )}
                </div>
                <div className="overflow-y-auto p-2">
                    {images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            {images.map(image => (
                                <div key={image.id} className="relative group aspect-square">
                                    <img src={image.url} alt={image.prompt || 'Imported image'} className="w-full h-full object-cover rounded-md" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button onClick={() => onRemove(image.id)} className="text-white hover:text-[rgb(var(--color-danger-rgb))] transition-colors p-2 rounded-full bg-black/50 hover:bg-black/75" aria-label="Remove image">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center text-[var(--color-text-muted)] p-4">
                            <p>Generate or import images to begin your slideshow.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {error && (
        <div className="bg-[rgba(var(--color-danger-rgb),0.2)] border border-[rgba(var(--color-danger-rgb),0.5)] text-[rgb(var(--color-danger-rgb))] px-4 py-2 rounded-lg text-sm shrink-0" role="alert">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="shrink-0 flex flex-col gap-2">
        <button
          onClick={onGenerate}
          disabled={!prompt || isGenerating}
          className="w-full bg-gradient-to-r from-[var(--color-accent-1)] to-[var(--color-accent-2)] text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate AI Images (4)'}
        </button>
        <label htmlFor="image-import" className="w-full text-center bg-[var(--color-surface-4)] text-[var(--color-text-primary)] font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-all duration-300 cursor-pointer">
          Import Local Images
        </label>
        <input id="image-import" type="file" accept="image/*" multiple onChange={onImport} className="hidden" />
      </div>
    </div>
  );
};

export default ImageControlPanel;