import React, { useRef } from 'react';
import { PlayIcon } from './icons/PlayIcon.tsx';
import { PauseIcon } from './icons/PauseIcon.tsx';
import { CloseIcon } from './icons/CloseIcon.tsx';

interface AudioMessagePlayerProps {
  id: string;
  title?: string;
  isPlaying: boolean;
  audioUrl: string | null;
  onPlayRequest: () => void;
  onPauseRequest: () => void;
  onEnded: () => void;
  onFileChange: (file: File) => void;
  onFileRemove: () => void;
}

const AudioMessagePlayer = React.forwardRef<HTMLAudioElement, AudioMessagePlayerProps>(
  ({ id, title, isPlaying, audioUrl, onPlayRequest, onPauseRequest, onEnded, onFileChange, onFileRemove }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileChange(file);
        }
        // Reset file input to allow selecting the same file again
        if(event.target) event.target.value = '';
    };

    const handlePlayPause = () => {
        if (!audioUrl) return;
        if (isPlaying) {
            onPauseRequest();
        } else {
            onPlayRequest();
        }
    };

    const handleRemoveAudio = () => {
        if (isPlaying) {
           onPauseRequest();
        }
        onFileRemove();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    const handleAudioEnd = () => {
        onEnded();
        const audioEl = (ref as React.RefObject<HTMLAudioElement>)?.current;
        if (audioEl) {
            audioEl.currentTime = 0;
        }
    };

    return (
        <div className="flex items-center gap-2">
            <audio
                ref={ref}
                src={audioUrl ?? undefined}
                onEnded={handleAudioEnd}
                onPause={onPauseRequest}
                onPlay={onPlayRequest}
            />
            <input 
                id={id} 
                ref={fileInputRef} 
                type="file" 
                accept="audio/*" 
                onChange={handleFileSelect} 
                className="hidden" 
            />

            {!audioUrl ? (
                <label htmlFor={id} className="tool-button !p-2 cursor-pointer !border-[var(--color-border-secondary)]" title={title || "Add custom audio"}>
                    <PlayIcon className="h-5 w-5 text-[var(--color-text-muted)]" />
                </label>
            ) : (
                <button onClick={handlePlayPause} className="tool-button !p-2" aria-label={isPlaying ? `Pause ${title || 'custom audio'}` : `Play ${title || 'custom audio'}`} title={title}>
                    {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                </button>
            )}
            
            {audioUrl && (
                <button onClick={handleRemoveAudio} className="tool-button !p-2 !text-[var(--color-text-muted)] hover:!text-[rgb(var(--color-danger-rgb))] hover:!border-[rgb(var(--color-danger-rgb))] hover:!bg-[rgba(var(--color-danger-rgb),0.2)]" aria-label={`Remove ${title || 'custom audio'}`} title={`Remove ${title || 'custom audio'}`}>
                    <CloseIcon />
                </button>
            )}
        </div>
    );
});

export default AudioMessagePlayer;