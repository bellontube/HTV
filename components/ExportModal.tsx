
import React, { useState, useEffect, useRef } from 'react';
import { useStudio } from '../contexts/StudioProvider.tsx';
import { StudioMediaItem, MediaAsset, TimelineClip } from '../types.ts';
import { useSound } from '../hooks/useSound.tsx';
import { ExportIcon } from './icons/ExportIcon.tsx';

declare const FFmpeg: any;

interface ExportModalProps {
    onClose: () => void;
    mediaAssets: MediaAsset[];
    timelineClips: TimelineClip[];
    watermark: { url: string; file: File; } | null;
    onWatermarkChange: (watermark: { url: string; file: File; } | null) => void;
    watermarkOpacity: number;
    onWatermarkOpacityChange: (opacity: number) => void;
    watermarkPosition: string;
    onWatermarkPositionChange: (position: string) => void;
    audioLeftRef: React.RefObject<HTMLAudioElement>;
    audioRightRef: React.RefObject<HTMLAudioElement>;
}

const ExportModal: React.FC<ExportModalProps> = (props) => {
    const { state: studioState } = useStudio();
    const { playSound } = useSound();
    const { onClose, mediaAssets, timelineClips } = props;

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportMessage, setExportMessage] = useState('');
    const [exportedUrl, setExportedUrl] = useState<string | null>(null);

    const ffmpegRef = useRef<any>(null);

    useEffect(() => {
        const loadFFmpeg = async () => {
            if (!ffmpegRef.current) {
                const ffmpeg = new FFmpeg.FFmpeg();
                ffmpeg.on('log', ({ message }: { message: string }) => { console.log(message); });
                ffmpeg.on('progress', ({ progress, time }: { progress: number, time: number }) => {
                    if(progress > 0 && progress <= 1) {
                      setExportProgress(Math.round(progress * 100));
                      setExportMessage(`Encoding... ${Math.round(progress * 100)}%`);
                    }
                });
                await ffmpeg.load({ coreURL: "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js" });
                ffmpegRef.current = ffmpeg;
            }
        };
        loadFFmpeg();
    }, []);

    const fetchFile = async (file: File | string): Promise<Uint8Array> => {
        const source = (typeof file === 'string') ? file : URL.createObjectURL(file);
        const response = await fetch(source);
        return new Uint8Array(await response.arrayBuffer());
    };

    const renderSlideshowToVideo = async (items: StudioMediaItem[], durationPerImage: number): Promise<Uint8Array | null> => {
        const images = items.filter(item => item.type === 'image');
        if (images.length === 0) return null;
        const ffmpeg = ffmpegRef.current;
        const tempVideoName = `slideshow_${self.crypto.randomUUID()}.mp4`;
        
        for (let i = 0; i < images.length; i++) {
            const imgData = await fetchFile(images[i].url);
            await ffmpeg.writeFile(`img${i}.jpg`, imgData);
        }
        
        const fileList = images.map((_,i) => `file 'img${i}.jpg'\nduration ${durationPerImage}`).join('\n');
        await ffmpeg.writeFile('slideshow_list.txt', new TextEncoder().encode(fileList));

        // Pan and zoom effect for 'pan' transition
        const panZoomFilter = `zoompan=z='min(zoom+0.001,1.5)':d=25*${durationPerImage}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080`;

        await ffmpeg.exec(
             '-f', 'concat', 
             '-safe', '0', 
             '-i', 'slideshow_list.txt', 
             '-vf', `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,${studioState.left.slideshowTransition === 'pan' ? panZoomFilter + ',' : ''}fade=t=in:st=0:d=0.5,fade=t=out:st=${durationPerImage - 0.5}:d=0.5,format=yuv420p`,
             '-r', '30', 
             '-c:v', 'libx264',
             tempVideoName
        );

        const data = await ffmpeg.readFile(tempVideoName);

        for (let i = 0; i < images.length; i++) { await ffmpeg.deleteFile(`img${i}.jpg`); }
        await ffmpeg.deleteFile(tempVideoName);
        await ffmpeg.deleteFile('slideshow_list.txt');
        return data as Uint8Array;
    };

    const handleExport = async () => {
        if (timelineClips.length === 0 || !ffmpegRef.current.loaded) {
            alert("Please add at least one video clip to the timeline to export.");
            return;
        }
        setIsExporting(true);
        setExportProgress(0);
        setExportMessage('Starting export process...');
        setExportedUrl(null);
        playSound('start');

        try {
            const ffmpeg = ffmpegRef.current;

            // 1. Create trimmed video clips from timeline
            setExportMessage('Preparing video clips...');
            let concatList = '';
            for (let i = 0; i < timelineClips.length; i++) {
                const clip = timelineClips[i];
                const asset = mediaAssets.find(a => a.id === clip.assetId);
                if (!asset) continue;

                const inputFilename = `source_${asset.id}.mp4`;
                const outputFilename = `clip_${i}.ts`;
                await ffmpeg.writeFile(inputFilename, await fetchFile(asset.file));
                
                await ffmpeg.exec(
                    '-i', inputFilename, '-ss', `${clip.startTime}`, '-to', `${clip.endTime}`,
                    '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-bsf:v', 'h264_mp4toannexb',
                    outputFilename
                );
                concatList += `file '${outputFilename}'\n`;
            }
            
            // 2. Concatenate trimmed clips into one main video
            setExportMessage('Assembling timeline...');
            await ffmpeg.writeFile('concat_list.txt', new TextEncoder().encode(concatList));
            await ffmpeg.exec('-f', 'concat', '-safe', '0', '-i', 'concat_list.txt', '-c', 'copy', '-bsf:a', 'aac_adtstoasc', 'edited_main.mp4');

            // 3. Render slideshows
            setExportMessage('Rendering left slideshow...');
            const leftSlideshowVideo = await renderSlideshowToVideo(studioState.left.images, 3);
            setExportMessage('Rendering right slideshow...');
            const rightSlideshowVideo = await renderSlideshowToVideo(studioState.right.images, 3);
            
            // 4. Setup for Final Composition
            setExportMessage('Preparing final composition...');
            let command = ['-i', 'edited_main.mp4'];
            let videoInputStreamCount = 1;
            if (leftSlideshowVideo) { await ffmpeg.writeFile('left.mp4', leftSlideshowVideo); command.push('-i', 'left.mp4'); videoInputStreamCount++; }
            if (rightSlideshowVideo) { await ffmpeg.writeFile('right.mp4', rightSlideshowVideo); command.push('-i', 'right.mp4'); videoInputStreamCount++; }

            let audioInputStreamCount = 0;
            let customAudioMaps = [];

            if (props.audioLeftRef.current?.src) { await ffmpeg.writeFile('audio_left.mp3', await fetchFile(props.audioLeftRef.current.src)); command.push('-i', 'audio_left.mp3'); customAudioMaps.push(`[${videoInputStreamCount + audioInputStreamCount}:a:0]`); audioInputStreamCount++; }
            if (props.audioRightRef.current?.src) { await ffmpeg.writeFile('audio_right.mp3', await fetchFile(props.audioRightRef.current.src)); command.push('-i', 'audio_right.mp3'); customAudioMaps.push(`[${videoInputStreamCount + audioInputStreamCount}:a:0]`); audioInputStreamCount++; }

            if (props.watermark) { await ffmpeg.writeFile('watermark.png', await fetchFile(props.watermark.file)); command.push('-i', 'watermark.png'); }

            // 5. Build filter_complex string
            let filterComplex = `[0:v]scale=960:540,setsar=1[center];`;
            let lastOverlay = '[center]';
            if (leftSlideshowVideo) { filterComplex += `[1:v]scale=480:810,setsar=1[left_scaled]; ${lastOverlay}[left_scaled]overlay=0:(H-h)/2[bg1];`; lastOverlay = '[bg1]'; }
            if (rightSlideshowVideo) { const rightIdx = 1 + (leftSlideshowVideo ? 1 : 0); filterComplex += `[${rightIdx}:v]scale=480:810,setsar=1[right_scaled]; ${lastOverlay}[right_scaled]overlay=W-w:(H-h)/2[bg2];`; lastOverlay = '[bg2]'; }
            
            let finalVideoMap = lastOverlay;
            if (props.watermark) { const wmIdx = command.length - (command.includes('watermark.png') ? 1 : 0) -1; const positionMap: { [key: string]: string } = { 'top-left': '10:10', 'top-right': 'W-w-10:10', 'bottom-left': '10:H-h-10', 'bottom-right': 'W-w-10:H-h-10' }; filterComplex += `[${wmIdx}:v]colorchannelmixer=aa=${props.watermarkOpacity}[wm]; ${lastOverlay}[wm]overlay=${positionMap[props.watermarkPosition]}[outv];`; finalVideoMap = '[outv]'; }

            const allAudioMaps = ['[0:a:0]', ...customAudioMaps];
            filterComplex += `${allAudioMaps.join('')}amix=inputs=${allAudioMaps.length}:duration=longest[outa]`;
            
            command.push('-filter_complex', filterComplex.replace(/;$/, ''));
            command.push('-map', finalVideoMap, '-map', '[outa]');
            command.push('-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-shortest', 'final_output.mp4');

            setExportMessage('Encoding final video...');
            await ffmpeg.exec(...command);
            
            setExportMessage('Finalizing...');
            const data = await ffmpeg.readFile('final_output.mp4');
            const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
            setExportedUrl(url);
            playSound('success');

        } catch (error) {
            console.error(error);
            setExportMessage(`Export failed. See console for details.`);
            playSound('error');
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };
    
    const handleWatermarkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            if (props.watermark) URL.revokeObjectURL(props.watermark.url);
            props.onWatermarkChange({ url: URL.createObjectURL(file), file });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 max-w-2xl w-full flex flex-col gap-4 fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center"><h2 className="text-2xl font-bold font-lora text-purple-300 flex items-center gap-3"><ExportIcon /> Video Exporter</h2><button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button></div>
                {isExporting ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-8">
                        <div className="w-16 h-16 border-4 border-t-purple-500 border-gray-600 rounded-full animate-spin"></div>
                        <p className="text-gray-300 text-lg font-semibold">{exportMessage}</p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${exportProgress}%` }}></div></div>
                    </div>
                ) : exportedUrl ? (
                    <div className="text-center p-4">
                         <h3 className="text-2xl text-green-400 font-bold mb-4">Export Complete!</h3>
                         <video src={exportedUrl} controls className="w-full rounded-lg bg-black mb-4"></video>
                         <a href={exportedUrl} download={`kannywood-htv-export-${Date.now()}.mp4`} className="w-full text-center bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors inline-block">Download Video</a>
                         <button onClick={() => setExportedUrl(null)} className="mt-4 text-gray-400 hover:underline">Export another</button>
                    </div>
                ) : (
                    <>
                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="font-semibold text-lg text-gray-300 mb-2">Branding & Watermark</h3>
                            <div className="grid grid-cols-2 gap-4 items-start">
                                <div>
                                    <label htmlFor="watermark-upload" className="block text-sm font-medium text-gray-400 mb-2">Logo Image</label>
                                    <input type="file" id="watermark-upload" accept="image/png,image/jpeg" onChange={handleWatermarkFileChange} className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-900/50 file:text-purple-300 hover:file:bg-purple-900/80" />
                                    {props.watermark && (<div className="mt-2 flex items-center gap-2"><img src={props.watermark.url} alt="Watermark preview" className="w-8 h-8 object-contain rounded bg-white/10" /><span className="text-xs text-gray-500 truncate">{props.watermark.file.name}</span></div>)}
                                </div>
                                <div>
                                    <label htmlFor="watermark-opacity" className="block text-sm font-medium text-gray-400 mb-2">Opacity ({props.watermarkOpacity})</label>
                                    <input id="watermark-opacity" type="range" min="0.1" max="1" step="0.05" value={props.watermarkOpacity} onChange={e => props.onWatermarkOpacityChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-400 mb-2">Position</label>
                                <div className="watermark-position-grid">
                                    {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (<label key={pos} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="watermark-position" value={pos} checked={props.watermarkPosition === pos} onChange={e => props.onWatermarkPositionChange(e.target.value)} className="w-4 h-4 text-purple-600 bg-gray-900 border-gray-600 focus:ring-purple-500"/><span className="text-sm text-gray-300 capitalize">{pos.replace('-', ' ')}</span></label>))}
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-4 mt-4">
                           {timelineClips.length === 0 && (<p className="text-center text-sm text-yellow-400 bg-yellow-900/30 p-3 rounded-lg mb-4"><strong>Note:</strong> Your editing timeline is empty. Please add video clips to enable export.</p>)}
                           <button onClick={handleExport} disabled={!ffmpegRef.current?.loaded || isExporting || timelineClips.length === 0} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-3 px-4 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{!ffmpegRef.current?.loaded ? 'Loading Exporter...' : 'Export Final Video'}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ExportModal;
