
import React, { useState, useRef, useEffect } from 'react';
import { useSound } from '../hooks/useSound.tsx';
import { MusicNoteIcon } from './icons/MusicNoteIcon.tsx';
import { PlayIcon } from './icons/PlayIcon.tsx';
import { PauseIcon } from './icons/PauseIcon.tsx';

const soundscapes = {
    'off': { name: 'Off', src: '' },
    'lofi': { name: 'Lofi Beats', src: 'https://cdn.pixabay.com/audio/2022/05/23/audio_7845d4a1b0.mp3' },
    'cosmic': { name: 'Cosmic Drone', src: 'https://cdn.pixabay.com/audio/2023/05/15/audio_130384813e.mp3' },
    'rain': { name: 'Gentle Rain', src: 'https://cdn.pixabay.com/audio/2022/11/07/audio_87823429f5.mp3' },
};
type SoundscapeKey = keyof typeof soundscapes;

const AmbientPlayer: React.FC = () => {
    const [currentTrackKey, setCurrentTrackKey] = useState<SoundscapeKey>('off');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [volume, setVolume] = useState(0.3);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { isMuted: isUiMuted } = useSound();

    // Effect to wire up event listeners and reflect the audio element's true state in React.
    // This runs once on mount to set up the connections.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onWaiting = () => setIsLoading(true);
        const onPlaying = () => setIsLoading(false); // Fired when playback starts after buffering/loading
        const onError = () => {
            const err = audio.error;
            console.error(`Ambient audio error - Code: ${err?.code}, Message: ${err?.message || 'Unknown error'}`);
            setIsLoading(false);
            setIsPlaying(false);
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('waiting', onWaiting);
        audio.addEventListener('playing', onPlaying);
        audio.addEventListener('error', onError);

        // Cleanup listeners on component unmount
        return () => {
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('waiting', onWaiting);
            audio.removeEventListener('playing', onPlaying);
            audio.removeEventListener('error', onError);
        };
    }, []); // Empty dependency array ensures this runs only once.

    // Effect to manage the audio source based on user selection and global mute state.
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const newSrc = soundscapes[currentTrackKey]?.src;

        // Stop and clear the source if muted or the track is set to 'off'
        if (isUiMuted || !newSrc) {
            audio.pause();
            if (audio.src) {
                audio.removeAttribute('src'); // A robust way to clear the source
                audio.load();               // Resets the media element and its state
            }
            return;
        }

        // If the source is different, load the new one.
        if (audio.currentSrc !== newSrc) {
            setIsLoading(true);
            audio.src = newSrc;
            audio.load();
            audio.play().catch(() => {
                // Autoplay is often blocked by browsers. This is an expected behavior,
                // not an error. The user can click the play button manually.
                console.warn("Ambient sound autoplay was blocked by the browser.");
            });
        }
    }, [currentTrackKey, isUiMuted]);

    // Effect for setting the volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Manual play/pause control for the user's button clicks
    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio || isLoading) return; // Prevent action while loading

        if (audio.paused) {
            audio.play().catch(e => console.error("Manual play failed:", e));
        } else {
            audio.pause();
        }
    };

    const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentTrackKey(e.target.value as SoundscapeKey);
    };

    const showControls = currentTrackKey !== 'off' && !isUiMuted;

    return (
        <div className="flex items-center gap-2 text-[var(--color-accent-text)]">
             <audio ref={audioRef} loop />
            <MusicNoteIcon />
            <select
                value={currentTrackKey}
                onChange={handleTrackChange}
                className="bg-transparent border-none text-[var(--color-accent-text)] text-xs focus:ring-0 p-0 pr-6"
                aria-label="Select ambient soundscape"
            >
                {Object.entries(soundscapes).map(([key, {name}]) => (
                    <option key={key} value={key} className="bg-[var(--color-surface-3)] text-[var(--color-text-primary)]">{name}</option>
                ))}
            </select>
            <div className={`flex items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="footer-control-button flex items-center justify-center"
                    aria-label={isLoading ? "Loading ambient sound" : isPlaying ? "Pause ambient sound" : "Play ambient sound"}
                 >
                    {isLoading
                        ? <div className="h-5 w-5 border-2 border-t-[var(--color-accent-text)] border-[var(--color-border-secondary)] rounded-full animate-spin"></div>
                        : isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-16"
                    aria-label="Ambient sound volume"
                 />
            </div>
        </div>
    );
}

export default AmbientPlayer;