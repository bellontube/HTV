
import React, { useState, forwardRef } from 'react';
import YouTubePlayer from './YouTubePlayer.tsx';

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const YouTubeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
);


type MovieSource = { type: 'local'; url: string; file: File; } | { type: 'youtube'; url: string; };
type PlayerId = 'movie' | 'audio-left' | 'audio-right';

interface MoviePlayerProps {
    movieSource: MovieSource | null;
    onMovieSourceChange: (source: MovieSource | null) => void;
    onPlay: () => void;
    onPause: () => void;
    activePlayer: PlayerId | null;
    setActivePlayer: (id: PlayerId | null) => void;
}

const MoviePlayer = forwardRef<HTMLVideoElement, MoviePlayerProps>(
    ({ movieSource, onMovieSourceChange, onPlay, onPause, activePlayer, setActivePlayer }, ref) => {
        const [isDraggingOver, setIsDraggingOver] = useState(false);
        const [youtubeUrlInput, setYoutubeUrlInput] = useState('');

        const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true);
        };
        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
        };
        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault(); e.stopPropagation();
        };
        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('video/')) {
                    const url = URL.createObjectURL(file);
                    onMovieSourceChange({ type: 'local', url, file });
                }
                e.dataTransfer.clearData();
            }
        };

        const handleLocalFileSelect = (file: File | undefined) => {
            if (file && file.type.startsWith('video/')) {
                const url = URL.createObjectURL(file);
                onMovieSourceChange({ type: 'local', url, file });
            }
        };

        const handleYoutubeUrlSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (youtubeUrlInput) {
                onMovieSourceChange({ type: 'youtube', url: youtubeUrlInput });
            }
        };
        
        const extractYouTubeID = (url: string) => {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }

        const videoId = movieSource?.type === 'youtube' ? extractYouTubeID(movieSource.url) : null;

        return (
            <div 
                className="w-full h-full bg-black rounded-xl flex items-center justify-center relative aspect-video"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {movieSource?.type === 'local' ? (
                    <video
                        ref={ref}
                        key={movieSource.url}
                        src={movieSource.url}
                        controls
                        className="w-full h-full object-contain rounded-xl"
                        onPlay={onPlay}
                        onPause={onPause}
                    />
                ) : videoId ? (
                    <YouTubePlayer 
                        videoId={videoId} 
                        isPlaying={activePlayer === 'movie'}
                        onPlayerPlay={() => setActivePlayer('movie')}
                        onPlayerPause={() => setActivePlayer(null)}
                    />
                ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-8 gap-6 transition-all ${isDraggingOver ? 'drag-over-active' : ''}`}>
                        <form onSubmit={handleYoutubeUrlSubmit} className="w-full max-w-md">
                            <label htmlFor="youtube-url" className="flex items-center justify-center gap-3 mb-3">
                                <YouTubeIcon />
                                <h3 className="text-xl font-semibold text-gray-300">Repurpose YouTube Video</h3>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="youtube-url"
                                    type="url"
                                    value={youtubeUrlInput}
                                    onChange={(e) => setYoutubeUrlInput(e.target.value)}
                                    placeholder="Paste a YouTube video URL..."
                                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                                />
                                <button type="submit" className="bg-red-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-red-700 transition-colors">
                                    Load
                                </button>
                            </div>
                        </form>
                        
                        <div className="flex items-center gap-4 w-full max-w-md">
                            <hr className="flex-grow border-gray-700" />
                            <span className="text-gray-500">OR</span>
                            <hr className="flex-grow border-gray-700" />
                        </div>

                        <label htmlFor="movie-upload" className="cursor-pointer group flex flex-col items-center justify-center text-center p-4 w-full h-full border-2 border-dashed border-gray-700 rounded-xl hover:border-purple-500 hover:bg-gray-900/50 transition-all">
                            <UploadIcon />
                            <h3 className="mt-2 text-xl font-semibold text-gray-300 group-hover:text-white">Upload Local File</h3>
                            <p className="mt-1 text-sm text-gray-500">{isDraggingOver ? 'Drop the file to upload' : 'Click or drag & drop a video file'}</p>
                            <input
                                id="movie-upload"
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleLocalFileSelect(e.target.files?.[0])}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}
            </div>
        );
    }
);

export default MoviePlayer;
