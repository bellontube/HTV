
import React, { useState, useRef, useEffect } from 'react';
import { PlayIcon } from './icons/PlayIcon.tsx';
import { PauseIcon } from './icons/PauseIcon.tsx';
import { CloseIcon } from './icons/CloseIcon.tsx';

interface AudioMessagePlayerProps {
  id: string;
  title?: string;
  isPlaying: boolean;
  onPlayRequest: () => void;
  onPauseRequest: () => void;
  onEnded: () => void;
}

const AudioMessagePlayer = React.forwardRef<HTMLAudioElement, AudioMessagePlayerProps>(
  ({ id, title, isPlaying, onPlayRequest, onPauseRequest, onEnded }, ref) => {
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const url = audioUrl;
        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [audioUrl]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            setAudioUrl(URL.createObjectURL(file));
        }
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
        setAudioUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    const handleAudioEnd = () => {
        onEnded();
        if ((ref as React.RefObject<HTMLAudioElement>)?.current) {
            (ref as React.RefObject<HTMLAudioElement>).current!.currentTime = 0;
        }
    };

    return (
        <div className="flex items-center gap-2">
            <audio
                ref={ref}
                src={audioUrl ?? undefined}
                onEnded={handleAudioEnd}
            />
            <input id={id} ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />

            {!audioUrl ? (
                <label htmlFor={id} className="tool-button !p-2 cursor-pointer !border-gray-600" title={title || "Add custom audio"}>
                    <PlayIcon className="h-5 w-5 text-gray-500" />
                </label>
            ) : (
                <button onClick={handlePlayPause} className="tool-button !p-2" aria-label={isPlaying ? `Pause ${title || 'custom audio'}` : `Play ${title || 'custom audio'}`} title={title}>
                    {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                </button>
            )}
            
            {audioUrl && (
                <button onClick={handleRemoveAudio} className="tool-button !p-2 !text-gray-400 hover:!text-red-400 hover:!border-red-600 hover:!bg-red-900/50" aria-label={`Remove ${title || 'custom audio'}`} title={`Remove ${title || 'custom audio'}`}>
                    <CloseIcon />
                </button>
            )}
        </div>
    );
});

export default AudioMessagePlayer;