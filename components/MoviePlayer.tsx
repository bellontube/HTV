
import React, { useState, forwardRef, useEffect, useRef } from 'react';
import YouTubePlayer from './YouTubePlayer.tsx';
import { MediaAsset } from '../types.ts';
import { YouTubeIcon } from './icons/YouTubeIcon.tsx';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-text)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

interface MoviePlayerProps {
    assetToPlay: MediaAsset | null;
    youtubeUrl: string | null;
    isPlaying: boolean;
    onPlayRequest: () => void;
    onPauseRequest: () => void;
    youtubeUrlInput: string;
    onYoutubeUrlInputChange: (value: string) => void;
    onYoutubeUrlSubmit: (e: React.FormEvent) => void;
    onAddMediaAssets?: (files: FileList) => void;
    // Optional props for editor features
    onTimeUpdate?: (time: number) => void;
    onDurationChange?: (duration: number) => void;
    clipStartTime?: number;
    clipEndTime?: number;
    showUploadPlaceholder?: boolean;
}

const MoviePlayer = forwardRef<{ seekTo: (time: number) => void; }, MoviePlayerProps>(
    (props, ref) => {
        const { 
            assetToPlay, youtubeUrl, isPlaying, onPlayRequest, onPauseRequest, 
            youtubeUrlInput, onYoutubeUrlInputChange, onYoutubeUrlSubmit,
            onTimeUpdate, onDurationChange, onAddMediaAssets,
            clipStartTime = 0,
            clipEndTime,
            showUploadPlaceholder = true
        } = props;
        const videoRef = useRef<HTMLVideoElement>(null);
        const [isDraggingOver, setIsDraggingOver] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);
        
        useEffect(() => {
            const video = videoRef.current;
            if (!video) return;

            if (isPlaying) {
                // When play is requested, ensure we are within bounds.
                if (video.currentTime < clipStartTime || (clipEndTime !== undefined && video.currentTime >= clipEndTime)) {
                    video.currentTime = clipStartTime;
                }
                video.play().catch(e => console.error("Video playback failed", e));
            } else {
                video.pause();
            }
        }, [isPlaying, assetToPlay, clipStartTime, clipEndTime]);

        const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
            const video = e.currentTarget;
            const currentTime = video.currentTime;
            if (clipEndTime !== undefined && currentTime > clipEndTime) {
                if (isPlaying) {
                    video.pause();
                    onPauseRequest();
                }
                if (video.currentTime > clipEndTime) {
                    video.currentTime = clipEndTime;
                }
            }
            onTimeUpdate?.(video.currentTime);
        };
        
        const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
            const video = e.currentTarget;
            onDurationChange?.(video.duration);
            video.currentTime = clipStartTime;
            onTimeUpdate?.(clipStartTime);
        };

        React.useImperativeHandle(ref, () => ({
            seekTo: (time: number) => {
                if (videoRef.current) {
                    const boundedTime = Math.max(clipStartTime, Math.min(time, clipEndTime ?? videoRef.current.duration));
                    videoRef.current.currentTime = boundedTime;
                }
            }
        }));
        
        const extractYouTubeID = (url: string | null) => {
            if (!url) return null;
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }
        
        const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); };
        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); };
        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onAddMediaAssets) {
                onAddMediaAssets(e.dataTransfer.files);
                e.dataTransfer.clearData();
            }
        };
        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && onAddMediaAssets) {
                onAddMediaAssets(e.target.files);
            }
            if (fileInputRef.current) fileInputRef.current.value = '';
        };

        const videoId = extractYouTubeID(youtubeUrl);

        return (
            <div 
              className="w-full h-full bg-black rounded-xl flex items-center justify-center relative aspect-[16/9]"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
                {assetToPlay ? (
                    <video
                        ref={videoRef}
                        key={assetToPlay.id}
                        src={assetToPlay.url}
                        className="w-full h-full object-contain rounded-xl"
                        onPlay={onPlayRequest}
                        onPause={onPauseRequest}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        controls
                    />
                ) : videoId ? (
                    <YouTubePlayer 
                        videoId={videoId} isPlaying={isPlaying}
                        onPlayerPlay={onPlayRequest} onPlayerPause={onPauseRequest}
                    />
                ) : (
                    showUploadPlaceholder ? (
                        <div className={`w-full h-full flex flex-col items-center justify-center p-8 gap-6 transition-all ${isDraggingOver ? 'drag-over-active' : ''}`}>
                            <form onSubmit={onYoutubeUrlSubmit} className="w-full max-w-md">
                                <label htmlFor="youtube-url" className="flex items-center justify-center gap-3 mb-3">
                                    <YouTubeIcon />
                                    <h3 className="text-xl font-semibold text-[var(--color-text-secondary)]">Play YouTube Video</h3>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="youtube-url"
                                        type="url"
                                        value={youtubeUrlInput}
                                        onChange={(e) => onYoutubeUrlInputChange(e.target.value)}
                                        placeholder="Paste a YouTube video URL to play..."
                                        className="w-full p-3 bg-[var(--color-surface-2)] border border-[var(--color-border-secondary)] rounded-lg text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-brand-youtube)] focus:border-[var(--color-brand-youtube)] transition-all"
                                    />
                                    <button type="submit" className="bg-[var(--color-brand-youtube)] text-white font-bold py-3 px-5 rounded-lg hover:opacity-80 transition-opacity">
                                        Load
                                    </button>
                                </div>
                            </form>
                            <div className="flex items-center gap-4 w-full max-w-md">
                                <hr className="flex-grow border-[var(--color-border-secondary)]" />
                                <span className="text-[var(--color-text-muted)]">OR</span>
                                <hr className="flex-grow border-[var(--color-border-secondary)]" />
                            </div>
                            <label htmlFor="movie-upload" className="cursor-pointer group flex flex-col items-center justify-center text-center p-4 w-full h-full border-2 border-dashed border-[var(--color-border-secondary)] rounded-xl hover:border-[var(--color-accent-text)] hover:bg-[var(--color-surface-2)]/50 transition-all">
                                <UploadIcon />
                                <h3 className="mt-2 text-xl font-semibold text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">Upload Local File</h3>
                                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{isDraggingOver ? 'Drop the file to upload' : 'Click or drag & drop a video file'}</p>
                                <input
                                    id="movie-upload"
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                             <p>No video selected for preview.</p>
                        </div>
                    )
                )}
            </div>
        );
    }
);

export default MoviePlayer;