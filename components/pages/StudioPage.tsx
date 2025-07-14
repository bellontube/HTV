

import React, { useCallback } from 'react';
import ImageStudio from '../ImageStudio.tsx';
import MoviePlayer from '../MoviePlayer.tsx';
import { MediaAsset } from '../../types.ts';

type MovieSource = { type: 'local'; assetId: string; } | { type: 'youtube'; url: string; } | null;

interface StudioPageProps {
    // Media props
    onAddMediaAssets: (files: FileList) => void;
    activeMediaAsset: MediaAsset | null;
    // Movie Player props
    movieRef: React.RefObject<{ seekTo: (time: number) => void; }>;
    movieSource: MovieSource;
    youtubeUrlInput: string;
    onYoutubeUrlInputChange: (value: string) => void;
    onYoutubeUrlSubmit: (e: React.FormEvent) => void;
    isMoviePlayerActive: boolean;
    onMoviePlayRequest: () => void;
    onMoviePauseRequest: () => void;
    onMovieEnded: () => void;
    // Studio Player props
    isLeftStudioActive: boolean;
    isRightStudioActive: boolean;
    onStudioPlayRequest: (studio: 'left' | 'right') => void;
    onStudioPauseRequest: (studio: 'left' | 'right') => void;
}

const StudioPage: React.FC<StudioPageProps> = (props) => {
    const { 
        onAddMediaAssets,
        activeMediaAsset,
        movieRef,
        movieSource,
        youtubeUrlInput,
        onYoutubeUrlInputChange,
        onYoutubeUrlSubmit,
        isMoviePlayerActive,
        onMoviePlayRequest,
        onMoviePauseRequest,
        onMovieEnded,
        isLeftStudioActive,
        isRightStudioActive,
        onStudioPlayRequest,
        onStudioPauseRequest
    } = props;

    // Create stable callbacks for each studio
    const handleLeftPlayRequest = useCallback(() => onStudioPlayRequest('left'), [onStudioPlayRequest]);
    const handleLeftPauseRequest = useCallback(() => onStudioPauseRequest('left'), [onStudioPauseRequest]);
    const handleRightPlayRequest = useCallback(() => onStudioPlayRequest('right'), [onStudioPlayRequest]);
    const handleRightPauseRequest = useCallback(() => onStudioPauseRequest('right'), [onStudioPauseRequest]);

    return (
        <div className="relative w-full h-full flex flex-col">
            <main className="flex-grow flex flex-col p-4 overflow-hidden">
                 <div className="flex-grow grid grid-cols-1 lg:grid-cols-[3fr_8fr_3fr] gap-4 overflow-hidden">
                    {/* Left Panel */}
                    <div className="bg-[var(--color-surface-2)]/50 rounded-xl border border-[var(--color-border-secondary)] p-4 flex flex-col gap-4 overflow-hidden">
                        <ImageStudio 
                            studio="left"
                            isStudioActive={isLeftStudioActive}
                            onPlayRequest={handleLeftPlayRequest}
                            onPauseRequest={handleLeftPauseRequest}
                        />
                    </div>
                    
                    {/* Center Panel */}
                    <div className="flex flex-col gap-4 overflow-hidden h-full">
                        <div className="flex-grow bg-black rounded-xl border-2 border-[var(--color-border-secondary)] flex items-center justify-center shadow-2xl shadow-[var(--color-shadow-primary)] min-h-0">
                            <MoviePlayer 
                              ref={movieRef} 
                              assetToPlay={activeMediaAsset} 
                              youtubeUrl={movieSource?.type === 'youtube' ? movieSource.url : null}
                              youtubeUrlInput={youtubeUrlInput} 
                              onYoutubeUrlInputChange={onYoutubeUrlInputChange} 
                              onYoutubeUrlSubmit={onYoutubeUrlSubmit}
                              isPlaying={isMoviePlayerActive} 
                              onPlayRequest={onMoviePlayRequest} 
                              onPauseRequest={onMoviePauseRequest}
                              onEnded={onMovieEnded}
                              onAddMediaAssets={onAddMediaAssets}
                              showUploadPlaceholder={!activeMediaAsset && !movieSource}
                            />
                        </div>
                    </div>
                    
                    {/* Right Panel */}
                    <div className="bg-[var(--color-surface-2)]/50 rounded-xl border border-[var(--color-border-secondary)] p-4 flex flex-col gap-4 overflow-hidden">
                        <ImageStudio
                           studio="right"
                           isStudioActive={isRightStudioActive}
                           onPlayRequest={handleRightPlayRequest}
                           onPauseRequest={handleRightPauseRequest}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudioPage;
