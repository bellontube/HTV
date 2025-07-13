
import React, { useState, useRef } from 'react';
import { MediaAsset, TimelineClip } from '../types.ts';
import { CloseIcon } from './icons/CloseIcon.tsx';
import { PlusIcon } from './icons/PlusIcon.tsx';
import { SplitIcon } from './icons/SplitIcon.tsx';

const formatTime = (timeInSeconds: number) => {
    const time = Math.max(0, timeInSeconds);
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    const milliseconds = Math.floor((time % 1) * 100).toString().padStart(2, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
};

// --- AddClipModal Component ---
interface AddClipModalProps {
    mediaAssets: MediaAsset[];
    onSelectAsset: (assetId: string) => void;
    onClose: () => void;
    onAddMediaAssets: (files: FileList) => void;
}

const AddClipModal: React.FC<AddClipModalProps> = ({ mediaAssets, onSelectAsset, onClose, onAddMediaAssets }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) onAddMediaAssets(e.target.files);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 max-w-lg w-full flex flex-col gap-4 fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-purple-300">Add Media to Timeline</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon /></button>
                </div>
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-y-auto p-2 flex flex-col gap-2 max-h-[50vh]">
                    {mediaAssets.length === 0 && <p className="text-center text-gray-500 m-auto p-4">Your media library is empty. Upload videos to get started.</p>}
                    {mediaAssets.map(asset => (
                        <button key={asset.id} onClick={() => onSelectAsset(asset.id)} className="w-full text-left p-2 rounded-md transition-colors bg-gray-800 hover:bg-purple-900/50">
                            <p className="text-sm font-semibold text-gray-200 truncate">{asset.name}</p>
                            <p className="text-xs text-gray-400">Duration: {formatTime(asset.duration)}</p>
                        </button>
                    ))}
                </div>
                <label htmlFor="modal-video-upload" className="tool-button text-center cursor-pointer">Upload New Videos to Library</label>
                <input id="modal-video-upload" type="file" multiple accept="video/*" className="hidden" onChange={handleFileChange} />
            </div>
        </div>
    );
};

// --- TimelineItem Component ---
interface TimelineItemProps {
    clip: TimelineClip;
    isSelected: boolean;
    onSelect: () => void;
    onRemove: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ clip, isSelected, onSelect, onRemove, onDragStart, onDragEnd }) => {
    const duration = clip.endTime - clip.startTime;
    const clipWidth = Math.max(100, duration * 20); // 20px per second, min 100px

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={onSelect}
            className={`timeline-item relative flex flex-col justify-between p-2 rounded-lg cursor-pointer shrink-0 transition-all duration-150 ease-in-out ${isSelected ? 'active bg-purple-800/60' : 'bg-gray-700'}`}
            style={{ width: `${clipWidth}px` }}
        >
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-500 transform hover:scale-110 transition-all">
                &times;
            </button>
            <p className="text-xs font-semibold text-white truncate">{clip.assetName}</p>
            <p className="text-xs font-mono text-purple-300">{formatTime(duration)}</p>
        </div>
    );
};

// --- Main VideoEditor Component ---
interface VideoEditorProps {
    mediaAssets: MediaAsset[];
    onAddMediaAssets: (files: FileList) => void;
    timelineClips: TimelineClip[];
    onAddClipToTimeline: (assetId: string) => void;
    onInsertClip: (assetId: string, index: number) => void;
    onRemoveClip: (clipId: string) => void;
    onSplitClip: () => void;
    onReorderClips: (sourceIndex: number, destIndex: number) => void;
    selectedTimelineClipId: string | null;
    onSelectTimelineClip: (clipId: string) => void;
    playerTime: number;
}

const VideoEditor: React.FC<VideoEditorProps> = (props) => {
    const { mediaAssets, onAddMediaAssets, timelineClips, onInsertClip, onRemoveClip, onSplitClip, onReorderClips, selectedTimelineClipId, onSelectTimelineClip, playerTime } = props;
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addIndex, setAddIndex] = useState(0);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);

    const handleOpenAddModal = (index: number) => {
        setAddIndex(index);
        setIsAddModalOpen(true);
    };

    const handleAssetSelectForInsert = (assetId: string) => {
        onInsertClip(assetId, addIndex);
        setIsAddModalOpen(false);
    };
    
    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        (e.target as HTMLElement).classList.add('dragging');
    };

    const handleDragEnd = (e: React.DragEvent) => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            const adjustedDestIndex = dragOverIndex > draggedIndex ? dragOverIndex -1 : dragOverIndex;
            onReorderClips(draggedIndex, adjustedDestIndex);
        }
        (e.target as HTMLElement).classList.remove('dragging');
        setDraggedIndex(null);
        setDragOverIndex(null);
        const timeline = timelineContainerRef.current;
        if(timeline) timeline.classList.remove('timeline-drag-over');
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (index !== dragOverIndex) {
            setDragOverIndex(index);
        }
    };
    
    const handleContainerDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const timeline = timelineContainerRef.current;
        if(timeline) timeline.classList.add('timeline-drag-over');
    };
    
    const handleContainerDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        const timeline = timelineContainerRef.current;
        if(timeline && !timeline.contains(e.relatedTarget as Node)) {
          timeline.classList.remove('timeline-drag-over');
          setDragOverIndex(null);
        }
    }
    
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      handleDragEnd(e);
    }
    
    const totalDuration = timelineClips.reduce((acc, clip) => acc + (clip.endTime - clip.startTime), 0);

    return (
        <div className="video-editor-panel rounded-xl p-3 flex flex-col gap-3 h-[200px] w-full">
            {isAddModalOpen && <AddClipModal mediaAssets={mediaAssets} onSelectAsset={handleAssetSelectForInsert} onClose={() => setIsAddModalOpen(false)} onAddMediaAssets={onAddMediaAssets}/>}

             <div className="flex items-center justify-between shrink-0 px-1">
                <div className="flex items-center gap-4">
                     <button onClick={() => handleOpenAddModal(timelineClips.length)} className="tool-button">
                        <PlusIcon /> Add Media from Library
                    </button>
                    <button onClick={onSplitClip} className="tool-button disabled:opacity-50 disabled:cursor-not-allowed" disabled={!selectedTimelineClipId}>
                        <SplitIcon /> Split at {formatTime(playerTime)}
                    </button>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-400">Timeline Duration</p>
                    <p className="font-mono text-lg text-white">{formatTime(totalDuration)}</p>
                </div>
             </div>
            
            {/* Timeline */}
            <div
                ref={timelineContainerRef}
                className="flex-grow h-full bg-gray-900/50 border border-gray-700 rounded-lg flex items-center gap-4 p-3 overflow-x-auto transition-all"
                onDragOver={handleContainerDragOver}
                onDragLeave={handleContainerDragLeave}
                onDrop={handleDrop}
             >
                {timelineClips.length === 0 ? (
                    <div className="w-full text-center text-gray-500">
                        <p>Your timeline is empty.</p>
                        <p className="text-xs">Click "Add Media from Library" to start building your video.</p>
                    </div>
                ) : (
                    <>
                        {timelineClips.map((clip, index) => (
                           <React.Fragment key={clip.id}>
                             <div 
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={handleDrop}
                                className={`h-16 transition-all duration-150 ease-in-out ${dragOverIndex === index ? 'w-8' : 'w-4'}`}
                             >
                                {dragOverIndex === index && <div className="w-1 h-full bg-purple-500 rounded-full mx-auto" />}
                             </div>
                             <TimelineItem
                               clip={clip}
                               isSelected={clip.id === selectedTimelineClipId}
                               onSelect={() => onSelectTimelineClip(clip.id)}
                               onRemove={() => onRemoveClip(clip.id)}
                               onDragStart={(e) => handleDragStart(e, index)}
                               onDragEnd={handleDragEnd}
                             />
                           </React.Fragment>
                        ))}
                         <div 
                            onDragOver={(e) => handleDragOver(e, timelineClips.length)}
                            onDrop={handleDrop}
                            className={`h-16 transition-all duration-150 ease-in-out ${dragOverIndex === timelineClips.length ? 'w-8' : 'w-4'}`}
                         >
                            {dragOverIndex === timelineClips.length && <div className="w-1 h-full bg-purple-500 rounded-full mx-auto" />}
                         </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VideoEditor;
