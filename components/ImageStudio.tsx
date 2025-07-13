


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStudio } from '../contexts/StudioProvider.tsx';
import { useSound } from '../hooks/useSound.tsx';
import { generateImagesFromPrompt } from '../services/geminiService.ts';
import { extractDominantColors } from '../services/colorService.ts';
import { StudioMediaItem } from '../types.ts';
import * as db from '../services/dbService.ts';
import { PlayIcon } from './icons/PlayIcon.tsx';
import { PauseIcon } from './icons/PauseIcon.tsx';
import { NextIcon } from './icons/NextIcon.tsx';
import { PrevIcon } from './icons/PrevIcon.tsx';
import { PaletteIcon } from './icons/PaletteIcon.tsx';
import CreativeSparkLoader from './CreativeSparkLoader.tsx';
import ColorPalette from './ColorPalette.tsx';
import YouTubePlayer from './YouTubePlayer.tsx';
import { YouTubeIcon } from './icons/YouTubeIcon.tsx';

const GenerateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11.983 1.904a1 1 0 00-1.625-.033L2.512 11.498a1 1 0 00.787 1.625h2.828v3.002a1 1 0 001.732.68l7.268-9.123a1 1 0 00-.787-1.625h-2.828V1.969a1 1 0 00-1.53-.865z" />
    </svg>
);

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

const artStyles = {
    "cinematic": "Cinematic digital painting, hyper-detailed, dramatic lighting, rich colors, emotional, 8k, epic.",
    "photorealistic": "Photorealistic, 85mm lens, f/1.4, sharp focus, professional color grading, ultra detailed.",
    "anime": "Modern anime style, vibrant colors, detailed characters, dynamic composition, masterpiece, studio quality.",
    "fantasy": "Fantasy art, ethereal lighting, intricate details, magical atmosphere, by a master fantasy artist.",
    "retro-comic": "Retro comic book style, bold lines, halftone dots, limited color palette, vintage feel.",
};

interface ImageStudioProps {
  studio: 'left' | 'right';
  isStudioActive: boolean;
  onPlayRequest: () => void;
  onPauseRequest: () => void;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ studio, isStudioActive, onPlayRequest, onPauseRequest }) => {
    const { state, dispatch } = useStudio();
    const { playSound } = useSound();
    const studioState = state[studio];
    const { title, prompt, images, imageCount, artStyle, slideshowTransition, isGenerating, error } = studioState;
    const isOtherStudioGenerating = (studio === 'left' ? state.right.isGenerating : state.left.isGenerating);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [delay, setDelay] = useState(3000);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [activePalette, setActivePalette] = useState<{ imageId: string; colors: string[] } | null>(null);
    const [isExtractingPalette, setIsExtractingPalette] = useState(false);
    const [youtubeShortsUrl, setYoutubeShortsUrl] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
    const uniqueId = studio;
    const hasImages = images.length > 0;
    const currentItem = hasImages ? images[currentIndex] : null;

    const onNextItem = useCallback(() => {
        if (images.length > 1) {
            setCurrentIndex(prev => (prev + 1) % images.length);
        } else {
            onPauseRequest();
        }
    }, [images.length, onPauseRequest]);

    // Auto-advance for images
    useEffect(() => {
        if (isStudioActive && hasImages && currentItem?.type === 'image') {
            const timer = setTimeout(onNextItem, delay);
            return () => clearTimeout(timer);
        }
    }, [isStudioActive, hasImages, currentItem, delay, onNextItem]);
    
    // Play/Pause control for local video elements
    useEffect(() => {
        if (currentItem?.type === 'video') {
            const videoEl = videoRefs.current[currentItem.id];
            if (videoEl) {
                if (isStudioActive && videoEl.paused) {
                    videoEl.play().catch(e => console.error("Video playback failed", e));
                } else if (!isStudioActive && !videoEl.paused) {
                    videoEl.pause();
                }
            }
        }
    }, [isStudioActive, currentItem]);

    // General cleanup and index reset effect
    useEffect(() => {
        if (images.length > 0 && currentIndex >= images.length) {
            setCurrentIndex(0);
        }
        if (images.length === 0 && isStudioActive) {
            onPauseRequest();
        }
        setActivePalette(null);
    }, [images, currentIndex, isStudioActive, onPauseRequest]);
    
     useEffect(() => {
      if(!isGenerating) {
        setIsConfirmingClear(false);
        setActivePalette(null);
      }
    }, [isGenerating]);

    const extractYouTubeID = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    const handlePlayPause = () => {
        if (!hasImages) return;
        if (isStudioActive) {
            onPauseRequest();
        } else {
            onPlayRequest();
        }
    };
    
    const handleNext = () => hasImages && onNextItem();
    const handlePrev = () => images.length > 1 && setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => setDelay(Math.max(500, Number(e.target.value) * 1000));
    const handleEditableKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLElement).blur(); }
    };
    
    const handlePaletteClick = async (e: React.MouseEvent, imageId: string, imageUrl: string) => {
        e.stopPropagation();
        if (activePalette?.imageId === imageId) {
            setActivePalette(null);
            return;
        }
        setIsExtractingPalette(true);
        setActivePalette(null);
        playSound('click');
        try {
            const colors = await extractDominantColors(imageUrl);
            setActivePalette({ imageId, colors });
        } catch (err) {
            console.error("Failed to extract color palette:", err);
        } finally {
            setIsExtractingPalette(false);
        }
    };

    const handleImport = async (files: FileList | null) => {
        if (!files) return;
        playSound('drop');

        const mediaFiles = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        if (mediaFiles.length === 0) return;

        const newMediaItems: StudioMediaItem[] = [];
        const storePromises: Promise<any>[] = [];

        for (const file of mediaFiles) {
             const isVideo = file.type.startsWith('video/');
             let duration: number | undefined = undefined;

             if (isVideo) {
                 try {
                     duration = await new Promise<number>((resolve, reject) => {
                         const videoEl = document.createElement('video');
                         videoEl.preload = 'metadata';
                         videoEl.onloadedmetadata = () => {
                             URL.revokeObjectURL(videoEl.src);
                             resolve(videoEl.duration);
                         };
                         videoEl.onerror = () => {
                             URL.revokeObjectURL(videoEl.src);
                             reject(new Error(`Could not read metadata for ${file.name}`));
                         };
                         videoEl.src = URL.createObjectURL(file);
                     });
                 } catch (err) {
                     console.error(err);
                 }
             }

            const newMedia: StudioMediaItem = {
                id: self.crypto.randomUUID(),
                url: URL.createObjectURL(file),
                source: 'local' as const,
                prompt: file.name,
                type: isVideo ? 'video' : 'image',
                duration,
            };
            newMediaItems.push(newMedia);
            storePromises.push(db.storeItem('images', {
                id: newMedia.id, file, source: 'local', studio, prompt: file.name, type: newMedia.type, duration: newMedia.duration
            }));
        }
        
        await Promise.all(storePromises);
        dispatch({ type: 'ADD_IMAGES', payload: { studio, images: newMediaItems } });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleImport(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };
    
    const handleImportYoutubeShort = async () => {
        if (!youtubeShortsUrl) return;
        const videoId = extractYouTubeID(youtubeShortsUrl);
        if (!videoId) {
            dispatch({ type: 'SET_ERROR', payload: { studio, error: 'Invalid YouTube URL.' } });
            setTimeout(() => dispatch({ type: 'SET_ERROR', payload: { studio, error: null } }), 3000);
            return;
        }
        playSound('drop');

        const newMedia: StudioMediaItem = {
            id: self.crypto.randomUUID(),
            url: videoId,
            source: 'youtube',
            prompt: `YouTube Short: ${youtubeShortsUrl}`,
            type: 'youtube',
        };

        await db.storeItem('images', { ...newMedia, file: null, url: newMedia.url });
        dispatch({ type: 'ADD_IMAGES', payload: { studio, images: [newMedia] } });
        setYoutubeShortsUrl('');
    };

    const handleYoutubeShortsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleImportYoutubeShort();
        }
    };


    const handleGenerateClick = async () => {
        if (!prompt || isGenerating) return;
        playSound('start');
        dispatch({type: 'SET_GENERATING', payload: { studio, isGenerating: true }});
        try {
            const base64ImageData = await generateImagesFromPrompt(prompt, imageCount, artStyle);
            
            const newImages: StudioMediaItem[] = [];
            const storePromises = base64ImageData.map(async (url) => {
                const res = await fetch(url);
                const blob = await res.blob();
                const newImage: StudioMediaItem = {
                    id: self.crypto.randomUUID(),
                    url: URL.createObjectURL(blob),
                    source: 'ai' as const,
                    prompt: prompt,
                    type: 'image'
                };
                newImages.push(newImage);
                return db.storeItem('images', {
                    id: newImage.id, file: blob, source: 'ai', studio, prompt, type: 'image'
                });
            });

            await Promise.all(storePromises);
            
            playSound('success');
            dispatch({ type: 'ADD_IMAGES', payload: { studio, images: newImages }});
            dispatch({ type: 'SET_GENERATING', payload: { studio, isGenerating: false } });

        } catch(err) {
            playSound('error');
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            dispatch({ type: 'SET_ERROR', payload: { studio, error: errorMessage } });
        }
    }

    const handleClearConfirm = () => {
        playSound('delete');
        dispatch({ type: 'CLEAR_IMAGES', payload: { studio } });
        setIsConfirmingClear(false);
    };

    const anyStudioBusy = isGenerating || isOtherStudioGenerating;
    const progressPercentage = hasImages ? ((currentIndex + 1) / images.length) * 100 : 0;
    const loaderText = 'Generating...';
    const isCurrentlyPlaying = isStudioActive && hasImages;

    return (
        <div 
            className="w-full h-full flex flex-col items-center gap-2 transition-all"
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleDrop}
        >
            <h2 className="text-xl font-bold font-lora text-purple-300 text-center shrink-0">
                <span contentEditable={!anyStudioBusy} suppressContentEditableWarning onBlur={e => dispatch({type: 'SET_VALUE', payload: {studio, key: 'title', value: e.currentTarget.textContent?.trim() || 'Untitled' }})} onKeyDown={handleEditableKeyDown} className="cursor-pointer outline-none focus:ring-2 focus:ring-purple-500 rounded-md px-2">{title}</span>
                {hasImages && <span className="ml-1 text-gray-400 font-normal">({images.length})</span>}
            </h2>

            <div className={`w-full flex-grow bg-black shadow-2xl shadow-purple-900/20 border-2 border-gray-700 relative flex flex-col overflow-hidden transition-all ${isDraggingOver ? 'drag-over-active' : ''} ${hasImages ? 'rounded-2xl' : 'rounded-t-2xl'}`}>
                <div className="flex-grow relative bg-gray-900 flex flex-col">
                     <div className="flex-grow relative overflow-hidden">
                        {hasImages ? images.map((item, index) => (
                            <div key={item.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                               <div className="relative w-full h-full group">
                                    {item.type === 'video' ? (
                                        <video
                                            ref={(el) => { videoRefs.current[item.id] = el; }}
                                            src={item.url}
                                            className="w-full h-full object-contain bg-black cursor-pointer"
                                            onClick={handlePlayPause}
                                            onEnded={onNextItem}
                                            playsInline
                                        />
                                    ) : item.type === 'youtube' ? (
                                        <YouTubePlayer
                                            videoId={item.url}
                                            isPlaying={isStudioActive && index === currentIndex}
                                            onPlayerPlay={onPlayRequest}
                                            onPlayerPause={onPauseRequest}
                                            onEnded={onNextItem}
                                        />
                                    ) : (
                                        <img src={item.url} alt={item.prompt || `Media ${index + 1}`} className={`w-full h-full object-cover ${slideshowTransition === 'pan' ? 'transition-pan' : ''}`} />
                                    )}

                                    {item.type === 'image' && item.source === 'ai' && (
                                        <button onClick={(e) => handlePaletteClick(e, item.id, item.url)} className="palette-icon p-1.5 bg-black/50 rounded-full text-white hover:bg-black/80 hover:text-purple-300" aria-label="Extract color palette">
                                            <PaletteIcon />
                                        </button>
                                    )}
                                    {item.prompt && (
                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <p className="line-clamp-2"><b>Prompt:</b> {item.prompt}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="h-full w-full flex flex-col p-4 gap-3 justify-center items-center text-gray-500 text-center">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                               <p className="text-sm">{isDraggingOver ? 'Drop files to import' : 'Use the controls below to begin.'}</p>
                            </div>
                        )}
                        {isGenerating && <CreativeSparkLoader text={loaderText} />}
                        {isExtractingPalette && <CreativeSparkLoader text="Extracting colors..." />}
                        {activePalette && <ColorPalette colors={activePalette.colors} onClose={() => setActivePalette(null)} />}
                    </div>

                    <div className="shrink-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent min-h-[52px]">
                        {hasImages && (
                            <>
                              <div className="w-full bg-gray-600/50 rounded-full h-1 mb-3">
                                <div className="bg-purple-500 h-1 rounded-full transition-all duration-500" style={{width: `${progressPercentage}%`}}></div>
                              </div>
                              <div className="flex items-center justify-center gap-5">
                                <button onClick={handlePrev} disabled={images.length < 2} className="text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"><PrevIcon /></button>
                                <button onClick={handlePlayPause} className="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-all transform hover:scale-110 shadow-lg" aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}>{isCurrentlyPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                                <button onClick={handleNext} disabled={images.length < 2} className="text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"><NextIcon /></button>
                              </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {!hasImages ? (
                <div className="w-full shrink-0 p-3 flex flex-col gap-2 bg-gray-900/70 rounded-b-lg border-t-2 border-gray-700">
                    <textarea id={`prompt-${uniqueId}`} value={prompt} onChange={(e) => dispatch({type: 'SET_VALUE', payload: {studio, key: 'prompt', value: e.target.value}})} disabled={anyStudioBusy} placeholder="Describe the images to generate..." className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none disabled:bg-gray-700 disabled:text-gray-500 text-center" rows={2}/>
                    
                    <div className="flex items-center gap-2">
                        <YouTubeIcon className="h-6 w-6 shrink-0 text-red-500" />
                        <input
                            type="url"
                            placeholder="Paste YouTube Shorts URL..."
                            className="w-full text-xs p-1.5 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-1 focus:ring-purple-500 disabled:bg-gray-700"
                            value={youtubeShortsUrl}
                            onChange={e => setYoutubeShortsUrl(e.target.value)}
                            onKeyDown={handleYoutubeShortsKeyDown}
                            disabled={anyStudioBusy}
                        />
                        <button
                            onClick={handleImportYoutubeShort}
                            className="text-xs bg-red-600 text-white font-bold p-1.5 px-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                            disabled={anyStudioBusy || !youtubeShortsUrl.trim()}
                        >
                            Add
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        <div>
                             <label htmlFor={`artStyle-${uniqueId}`} className="text-xs text-gray-400 mb-1 block">Art Style</label>
                             <select id={`artStyle-${uniqueId}`} value={artStyle} onChange={e => dispatch({type: 'SET_VALUE', payload: {studio, key: 'artStyle', value: e.target.value}})} disabled={anyStudioBusy} className="w-full text-xs p-1.5 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-1 focus:ring-purple-500">
                                 {Object.entries(artStyles).map(([key, value]) => <option key={key} value={value}>{key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                             </select>
                        </div>
                        <div>
                            <label htmlFor={`transition-${uniqueId}`} className="text-xs text-gray-400 mb-1 block">Transition (Images)</label>
                            <select id={`transition-${uniqueId}`} value={slideshowTransition} onChange={e => dispatch({type: 'SET_VALUE', payload: {studio, key: 'slideshowTransition', value: e.target.value as 'fade' | 'pan'}})} disabled={anyStudioBusy} className="w-full text-xs p-1.5 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-1 focus:ring-purple-500">
                                <option value="fade">Fade</option>
                                <option value="pan">Pan (Ken Burns)</option>
                             </select>
                        </div>
                        <div>
                            <label htmlFor={`count-${uniqueId}`} className="text-xs text-gray-400 mb-1 block">Image Count</label>
                            <div className="flex items-center gap-2 bg-gray-800 border border-gray-600 rounded-md p-1">
                                <input id={`count-${uniqueId}`} type="range" min="1" max="10" step="1" value={imageCount} onChange={e => dispatch({type: 'SET_VALUE', payload: {studio, key: 'imageCount', value: Number(e.target.value)}})} disabled={anyStudioBusy} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm disabled:opacity-50"/>
                                <span className="text-xs text-gray-300 w-6 text-right font-mono">{imageCount}</span>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-400 mt-1 text-center bg-red-900/30 p-2 rounded-md">{error}</p>}
                    
                    <div className="flex items-stretch gap-2 mt-2">
                        <button onClick={handleGenerateClick} disabled={!prompt || anyStudioBusy} className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-1.5 px-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-md">
                            {isGenerating ? 'Generating...' : <><GenerateIcon/> Generate</>}
                        </button>
                        <label htmlFor={`import-${uniqueId}`} className={`flex-1 flex items-center justify-center gap-1.5 bg-gray-600 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-gray-700 transition-all duration-300 text-xs shadow-md ${anyStudioBusy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <UploadIcon/> Import
                        </label>
                        <input id={`import-${uniqueId}`} ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={(e) => { handleImport(e.target.files); if(e.target) e.target.value = ''; }} className="hidden" disabled={anyStudioBusy} />
                    </div>
                </div>
            ) : (
                <div className="w-full shrink-0 flex flex-col gap-2 pt-2">
                     {currentItem?.type === 'image' && (
                        <div className="w-full flex items-center gap-2 px-1">
                           <label htmlFor={`speed-${uniqueId}`} className="text-xs text-gray-400">Speed (Images)</label>
                           <input id={`speed-${uniqueId}`} type="range" min="1" max="10" step="0.5" value={delay / 1000} onChange={handleDelayChange} className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm"/>
                           <span className="text-xs text-gray-300 w-8 text-right font-mono">{delay/1000}s</span>
                       </div>
                     )}

                    {error && <p className="text-xs text-red-400 mt-1 text-center bg-red-900/30 p-2 rounded-md">{error}</p>}

                    {!isConfirmingClear ? (
                        <button onClick={() => { playSound('click'); setIsConfirmingClear(true); }} disabled={anyStudioBusy} className="w-full bg-red-800/80 text-white font-bold py-1.5 rounded-lg hover:bg-red-700 transition-colors duration-300 text-xs disabled:bg-red-900/50 disabled:cursor-not-allowed mt-2">Clear Media</button>
                    ) : (
                        <div className="mt-2 bg-red-900/30 p-2 rounded-lg text-center">
                            <p className="text-xs text-red-300 mb-2">Are you sure?</p>
                            <div className="flex gap-2 justify-center">
                                <button onClick={handleClearConfirm} className="bg-red-600 text-white font-bold text-xs py-1 px-4 rounded-md hover:bg-red-700">Yes, Clear</button>
                                <button onClick={() => { playSound('click'); setIsConfirmingClear(false);}} className="bg-gray-600 text-white font-bold text-xs py-1 px-4 rounded-md hover:bg-gray-700">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ImageStudio;