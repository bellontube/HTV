

import React from 'react';
import ImageStudio from '../ImageStudio.tsx';
import MoviePlayer from '../MoviePlayer.tsx';
import { MediaAsset } from '../../types.ts';
import { ExitIcon } from '../icons/ExitIcon.tsx';
import { EditIcon } from '../icons/EditIcon.tsx';

interface ImportPageProps {
    onNavigateToEditor: () => void;
    onNavigateToHome: () => void;
    onAddMediaAssets: (files: FileList) => void;
    // Movie Player props
    movieRef: React.RefObject<{ seekTo: (time: number) => void; }>;
    activeMediaAsset: MediaAsset | null;
    movieSource: { type: 'local'; assetId: string; } | { type: 'youtube'; url: string; } | null;
    youtubeUrlInput: string;
    onYoutubeUrlInputChange: (value: string) => void;
    onYoutubeUrlSubmit: (e: React.FormEvent) => void;
    isPlaying: boolean;
    onPlayRequest: () => void;
    onPauseRequest: () => void;
    onTimeUpdate: (time: number) => void;
    onDurationChange: (duration: number) => void;
    // Studio Player props
    isLeftStudioActive: boolean;
    isRightStudioActive: boolean;
    onStudioPlayRequest: (studio: 'left' | 'right') => void;
    onStudioPauseRequest: (studio: 'left' | 'right') => void;
}

const ImportPage: React.FC<ImportPageProps> = (props) => {
    const { 
        onNavigateToEditor,
        onNavigateToHome,
        onAddMediaAssets,
        movieRef,
        activeMediaAsset,
        movieSource,
        youtubeUrlInput,
        onYoutubeUrlInputChange,
        onYoutubeUrlSubmit,
        isPlaying,
        onPlayRequest,
        onPauseRequest,
        onTimeUpdate,
        onDurationChange,
        isLeftStudioActive,
        isRightStudioActive,
        onStudioPlayRequest,
        onStudioPauseRequest,
    } = props;

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            onAddMediaAssets(e.target.files);
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col">
            <header className="flex justify-between items-center py-3 px-4 border-b border-gray-700/50 shrink-0 shadow-lg bg-gray-900/30 backdrop-blur-sm">
                 <button onClick={onNavigateToHome} className="tool-button flex items-center gap-2">
                    <ExitIcon /> Close Studio
                </button>
                 <button onClick={onNavigateToEditor} className="tool-button flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                    <EditIcon /> Go to Editor
                </button>
            </header>
            
            <main className="flex-grow flex flex-col p-4 overflow-hidden">
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-[5fr_6fr_5fr] gap-4 overflow-hidden">
                    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 flex flex-col gap-4 overflow-hidden">
                        <ImageStudio
                            studio="left"
                            isStudioActive={isLeftStudioActive}
                            onPlayRequest={() => onStudioPlayRequest('left')}
                            onPauseRequest={() => onStudioPauseRequest('left')}
                        />
                    </div>
                    
                    <div className="flex flex-col gap-4 overflow-hidden">
                        <div className="flex-grow bg-black rounded-xl border-2 border-gray-700 flex items-center justify-center shadow-2xl shadow-purple-900/20 min-h-0">
                            <MoviePlayer 
                              ref={movieRef} 
                              assetToPlay={activeMediaAsset} 
                              youtubeUrl={movieSource?.type === 'youtube' ? movieSource.url : null}
                              youtubeUrlInput={youtubeUrlInput} 
                              onYoutubeUrlInputChange={onYoutubeUrlInputChange} 
                              onYoutubeUrlSubmit={onYoutubeUrlSubmit}
                              isPlaying={isPlaying} 
                              onPlayRequest={onPlayRequest} 
                              onPauseRequest={onPauseRequest}
                              onTimeUpdate={onTimeUpdate} 
                              onDurationChange={onDurationChange}
                              clipStartTime={0} 
                              clipEndTime={activeMediaAsset?.duration || 0}
                              showUploadPlaceholder={true}
                              onAddMediaAssets={onAddMediaAssets}
                            />
                        </div>
                         <div className="shrink-0">
                            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 flex flex-col items-center justify-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-200">Media Library</h3>
                                <p className="text-sm text-gray-400 text-center">Add videos to your library, preview them above, then proceed to the editor.</p>
                                <button onClick={handleUploadClick} className="tool-button mt-2">Add Media Files</button>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="video/*" className="hidden" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 flex flex-col gap-4 overflow-hidden">
                        <ImageStudio
                            studio="right"
                            isStudioActive={isRightStudioActive}
                            onPlayRequest={() => onStudioPlayRequest('right')}
                            onPauseRequest={() => onStudioPauseRequest('right')}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ImportPage;