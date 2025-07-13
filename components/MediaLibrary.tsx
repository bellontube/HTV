

import React from 'react';
import { MediaAsset } from '../types.ts';
import { PlusIcon } from './icons/PlusIcon.tsx';

interface MediaLibraryProps {
    mediaAssets: MediaAsset[];
    onAddMediaAssets: (files: FileList) => void;
    onSelectAsset: (assetId: string) => void;
    activeAssetId: string | null;
}

const formatTime = (timeInSeconds: number) => {
    const time = Math.max(0, timeInSeconds);
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};

const MediaLibrary: React.FC<MediaLibraryProps> = ({ mediaAssets, onAddMediaAssets, onSelectAsset, activeAssetId }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onAddMediaAssets(e.target.files);
        }
    };

    return (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-3 shrink-0">
                <h3 className="text-lg font-semibold text-gray-200">Media Library ({mediaAssets.length})</h3>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                {mediaAssets.length > 0 ? (
                    <div className="flex flex-col gap-2">
                        {mediaAssets.map(asset => (
                            <button
                                key={asset.id}
                                onClick={() => onSelectAsset(asset.id)}
                                className={`w-full text-left p-2 rounded-md transition-colors ${asset.id === activeAssetId ? 'bg-purple-800/70' : 'bg-gray-700/50 hover:bg-purple-900/50'}`}
                            >
                                <p className="text-sm font-semibold text-gray-200 truncate">{asset.name}</p>
                                <p className="text-xs text-gray-400">Duration: {formatTime(asset.duration)}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <label 
                        htmlFor="media-library-upload"
                        className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-4 cursor-pointer border-2 border-dashed border-gray-700 rounded-lg hover:border-purple-500 hover:bg-gray-900/50 transition-all group"
                    >
                        <PlusIcon className="h-8 w-8 mb-2 text-gray-600 group-hover:text-purple-400 transition-colors" />
                        <p className="font-semibold text-gray-400">Add Video Files</p>
                        <p className="text-xs">Click or drag & drop to populate your library.</p>
                        <input
                            id="media-library-upload"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            accept="video/*"
                            className="hidden"
                        />
                    </label>
                )}
            </div>
        </div>
    );
};

export default MediaLibrary;