
import React, { useState } from 'react';
import MoviePlayer from '../MoviePlayer.tsx';
import AudioMessagePlayer from '../AudioMessagePlayer.tsx';
import VideoEditor from '../VideoEditor.tsx';
import AIHelperModal from '../AIHelperModal.tsx';
import ExportModal from '../ExportModal.tsx';
import { BackIcon } from '../icons/BackIcon.tsx';
import { SparklesIcon } from '../icons/SparklesIcon.tsx';
import { ExportIcon } from '../icons/ExportIcon.tsx';
import { MediaAsset, TimelineClip } from '../../types.ts';

type PlayerId = 'movie' | 'audio-left' | 'audio-right';

interface EditorPageProps {
    onNavigateToImport: () => void;
    onNavigateToHome: () => void;
    // Media props
    mediaAssets: MediaAsset[];
    onAddMediaAssets: (files: FileList) => void;
    timelineClips: TimelineClip[];
    selectedTimelineClipId: string | null;
    // Timeline actions
    onAddClipToTimeline: (assetId: string) => void;
    onInsertClip: (assetId: string, index: number) => void;
    onRemoveClip: (clipId: string) => void;
    onSplitClip: () => void;
    onReorderClips: (sourceIndex: number, destIndex: number) => void;
    onSelectTimelineClip: (clipId: string) => void;
    // Player props
    movieRef: React.RefObject<{ seekTo: (time: number) => void; }>;
    activeMediaAsset: MediaAsset | null;
    youtubeUrl: string | null;
    isPlaying: boolean;
    onPlayRequest: () => void;
    onPauseRequest: () => void;
    onTimeUpdate: (time: number) => void;
    onDurationChange: (duration: number) => void;
    playerTime: number;
    playerDuration: number;
    selectedTimelineClip: TimelineClip | null;
    // Audio props
    audioLeftRef: React.RefObject<HTMLAudioElement>;
    audioRightRef: React.RefObject<HTMLAudioElement>;
    activePlayer: PlayerId | null;
    onAudioPlayRequest: (id: PlayerId) => void;
    onAudioPauseRequest: (id: PlayerId) => void;
    onAudioEnded: () => void;
    // Export props
    watermark: { url: string; file: File; } | null;
    onWatermarkChange: (watermark: { url: string; file: File; } | null) => void;
    watermarkOpacity: number;
    onWatermarkOpacityChange: (opacity: number) => void;
    watermarkPosition: string;
    onWatermarkPositionChange: (position: string) => void;
}


const EditorPage: React.FC<EditorPageProps> = (props) => {
    const { onNavigateToImport, onNavigateToHome, ...p } = props;
    const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    return (
        <div className="relative w-full h-full flex flex-col bg-gray-900">
            {isAiHelperOpen && <AIHelperModal onClose={() => setIsAiHelperOpen(false)} />}
            {isExportModalOpen && <ExportModal onClose={() => setIsExportModalOpen(false)} mediaAssets={p.mediaAssets} timelineClips={p.timelineClips} watermark={p.watermark} onWatermarkChange={p.onWatermarkChange} watermarkOpacity={p.watermarkOpacity} onWatermarkOpacityChange={p.onWatermarkOpacityChange} watermarkPosition={p.watermarkPosition} onWatermarkPositionChange={p.onWatermarkPositionChange} audioLeftRef={p.audioLeftRef} audioRightRef={p.audioRightRef}/>}
            
            <header className="flex justify-between items-center py-3 px-4 border-b border-gray-700/50 shrink-0 shadow-lg bg-gray-900/30 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onNavigateToImport} className="tool-button flex items-center gap-2">
                        <BackIcon /> Back to Library
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <AudioMessagePlayer ref={p.audioLeftRef} title="Left Audio Channel" id="audio-import-left" isPlaying={p.activePlayer === 'audio-left'} onPlayRequest={() => p.onAudioPlayRequest('audio-left')} onPauseRequest={() => p.onAudioPauseRequest('audio-left')} onEnded={p.onAudioEnded}/>
                    <AudioMessagePlayer ref={p.audioRightRef} title="Right Audio Channel" id="audio-import-right" isPlaying={p.activePlayer === 'audio-right'} onPlayRequest={() => p.onAudioPlayRequest('audio-right')} onPauseRequest={() => p.onAudioPauseRequest('audio-right')} onEnded={p.onAudioEnded}/>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsAiHelperOpen(true)} className="tool-button flex items-center gap-2"><SparklesIcon /> AI Helper</button>
                    <button onClick={() => setIsExportModalOpen(true)} className="tool-button flex items-center gap-2"><ExportIcon /> Export Video</button>
                </div>
            </header>
            
            <main className="flex-grow flex flex-col p-4 overflow-hidden gap-4">
                <div className="flex-grow bg-black rounded-xl border-2 border-gray-700 flex items-center justify-center shadow-2xl shadow-purple-900/20 min-h-0">
                    <MoviePlayer 
                        ref={p.movieRef} 
                        assetToPlay={p.activeMediaAsset} 
                        youtubeUrl={null} // No YT preview in editor
                        isPlaying={p.isPlaying} 
                        onPlayRequest={p.onPlayRequest} 
                        onPauseRequest={p.onPauseRequest}
                        onTimeUpdate={p.onTimeUpdate} 
                        onDurationChange={p.onDurationChange}
                        clipStartTime={p.selectedTimelineClip?.startTime ?? 0} 
                        clipEndTime={p.selectedTimelineClip?.endTime ?? p.playerDuration}
                        // Disable upload placeholders in editor view
                        youtubeUrlInput=""
                        onYoutubeUrlInputChange={() => {}}
                        onYoutubeUrlSubmit={(e) => e.preventDefault()}
                        showUploadPlaceholder={false}
                        onAddMediaAssets={p.onAddMediaAssets}
                    />
                </div>
                <div className="shrink-0">
                    <VideoEditor
                        mediaAssets={p.mediaAssets} onAddMediaAssets={p.onAddMediaAssets}
                        timelineClips={p.timelineClips} onAddClipToTimeline={p.onAddClipToTimeline} onInsertClip={p.onInsertClip}
                        onRemoveClip={p.onRemoveClip} onSplitClip={p.onSplitClip}
                        onReorderClips={p.onReorderClips} selectedTimelineClipId={p.selectedTimelineClipId}
                        onSelectTimelineClip={p.onSelectTimelineClip} playerTime={p.playerTime}
                    />
                </div>
            </main>
        </div>
    );
};

export default EditorPage;
