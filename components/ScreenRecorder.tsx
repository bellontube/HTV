



import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { CloseIcon } from './icons/CloseIcon.tsx';
import { RecordingStatus } from '../types.ts';
import { PlayIcon } from './icons/PlayIcon.tsx';
import { PauseIcon } from './icons/PauseIcon.tsx';
import { StopIcon } from './icons/StopIcon.tsx';

interface ScreenRecorderProps {
  onStatusChange: (status: RecordingStatus) => void;
}

interface ScreenRecorderHandle {
  prepare: (includeMic: boolean) => void;
  cancel: () => void;
  stop: () => void;
}

const ScreenRecorder = forwardRef<ScreenRecorderHandle, ScreenRecorderProps>(({ onStatusChange }, ref) => {
    const [status, setStatus] = useState<RecordingStatus>('idle');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
      onStatusChange(status);
    }, [status, onStatusChange]);

    const cleanup = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        mediaRecorderRef.current = null;
    };
    
    const handleStopRecording = () => {
        // This is now mainly triggered by videoTrack.onended
        if (mediaRecorderRef.current && (status === 'recording' || status === 'paused')) {
            mediaRecorderRef.current.stop();
        } else if (status === 'ready') {
            // If recording was prepared but not started, just clean up.
            cleanup();
            setStatus('idle');
        }
    };

    useImperativeHandle(ref, () => ({
        prepare: (includeMic: boolean) => {
            prepareToRecord(includeMic);
        },
        cancel: () => {
            cleanup();
            setStatus('idle');
        },
        stop: () => {
            handleStopRecording();
        }
    }));

    const prepareToRecord = async (includeMic: boolean) => {
        if (status !== 'idle') return;
        setStatus('preparing');
        
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
        recordedChunksRef.current = [];

        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                // Prefer capturing the current tab to get a clean view without browser chrome,
                // and to help the browser identify the correct audio stream.
                preferCurrentTab: true,
                video: { 
                    // @ts-ignore The 'cursor' property is valid but not in all TS lib versions.
                    cursor: "never" // Don't record the mouse cursor
                },
                audio: true, // Request tab audio
            });

            const videoTrack = displayStream.getVideoTracks()[0];
            const systemAudioTrack = displayStream.getAudioTracks()[0];
            let micAudioTrack: MediaStreamTrack | null = null;
            
            const tracksToCombine: MediaStreamTrack[] = [videoTrack];

            if (includeMic) {
                 try {
                    const micStream = await navigator.mediaDevices.getUserMedia({
                        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 }
                    });
                    if (micStream.getAudioTracks().length > 0) {
                        micAudioTrack = micStream.getAudioTracks()[0];
                    }
                 } catch(err) {
                     console.warn("Could not get microphone. Recording without it.", err);
                 }
            }
            
            if (systemAudioTrack && micAudioTrack) {
                const audioContext = new AudioContext();
                audioContextRef.current = audioContext;
                const destination = audioContext.createMediaStreamDestination();

                const systemSource = audioContext.createMediaStreamSource(new MediaStream([systemAudioTrack]));
                systemSource.connect(destination);

                const micSource = audioContext.createMediaStreamSource(new MediaStream([micAudioTrack]));
                micSource.connect(destination);

                tracksToCombine.push(destination.stream.getAudioTracks()[0]);
            } else if (systemAudioTrack) {
                tracksToCombine.push(systemAudioTrack);
            } else if (micAudioTrack) {
                tracksToCombine.push(micAudioTrack);
            }

            const finalStream = new MediaStream(tracksToCombine);
            mediaStreamRef.current = finalStream;
            
            // The user will now use the browser's "Stop sharing" button to stop.
            // This event fires when that happens.
            videoTrack.onended = () => {
                handleStopRecording();
            };

            mediaRecorderRef.current = new MediaRecorder(finalStream, {
                mimeType: 'video/webm; codecs=vp8,opus'
            });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                if (recordedChunksRef.current.length > 0) {
                    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    setVideoUrl(url);
                    setStatus('finished');
                } else {
                    setStatus('idle');
                }
                cleanup();
            };
            
            setStatus('ready');

        } catch (err) {
            console.error("Error starting screen recording:", err);
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                 alert('Permission to record the screen was denied. Please try again and grant access.');
            } else {
                 alert(`An error occurred while starting the screen recording. Please check console for details.`);
            }
            cleanup();
            setStatus('idle');
        }
    };
    
    const handleStartRecording = () => {
      if (mediaRecorderRef.current && status === 'ready') {
        mediaRecorderRef.current.start();
        setStatus('recording');
      }
    }
    const handlePauseRecording = () => {
      if (mediaRecorderRef.current && status === 'recording') {
        mediaRecorderRef.current.pause();
        setStatus('paused');
      }
    }
    const handleResumeRecording = () => {
      if (mediaRecorderRef.current && status === 'paused') {
        mediaRecorderRef.current.resume();
        setStatus('recording');
      }
    }
    
    const handleCancel = () => {
      cleanup();
      setStatus('idle');
    }
    
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    const handleDiscard = () => {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
        recordedChunksRef.current = [];
        setStatus('idle');
    };

    const handleDownload = () => {
        if (!videoUrl) return;
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = `kannywood-htv-recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (status === 'idle') return null;

    if (status === 'finished' && videoUrl) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-[var(--color-surface-3)] rounded-xl shadow-2xl p-4 border border-[var(--color-border-secondary)] max-w-4xl w-full flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-[var(--color-accent-text)]">Recording Preview</h3>
                        <button onClick={handleDiscard} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                            <CloseIcon />
                        </button>
                    </div>
                    <video src={videoUrl} controls autoPlay className="w-full rounded-lg bg-black" />
                    <div className="flex justify-end gap-3">
                        <button onClick={handleDiscard} className="bg-[var(--color-surface-4)] hover:opacity-80 text-[var(--color-text-primary)] font-bold py-2 px-4 rounded-lg transition-colors">
                            Discard
                        </button>
                        <button onClick={handleDownload} className="flex items-center gap-2 bg-[var(--color-accent-1)] hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <DownloadIcon />
                            Download
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    const renderControls = () => {
      switch(status) {
        case 'preparing':
          return <p className="text-lg">Preparing recorder...</p>;
        case 'ready':
          return (
            <>
              <p className="text-lg">Ready to Record</p>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleStartRecording} 
                  className="tool-button flex items-center gap-2 !text-base !px-6 !py-3 bg-[rgba(var(--color-danger-rgb),0.2)] border-[rgba(var(--color-danger-rgb),0.5)] text-[rgb(var(--color-danger-rgb))] hover:bg-[rgba(var(--color-danger-rgb),0.4)] hover:border-[rgba(var(--color-danger-rgb),0.8)]"
                >
                  <div className="w-4 h-4 rounded-full bg-[rgb(var(--color-danger-rgb))] animate-pulse"></div> Record
                </button>
                <button onClick={handleCancel} className="tool-button !text-base">Cancel</button>
              </div>
            </>
          );
        case 'recording':
        case 'paused':
          return (
             <>
              <div className="flex items-center gap-2 text-lg">
                <div className={`w-4 h-4 rounded-full bg-[rgb(var(--color-danger-rgb))] ${status === 'recording' ? 'animate-pulse' : ''}`}></div>
                {status === 'recording' ? 'Recording' : 'Paused'}
              </div>
              <div className="flex items-center gap-4">
                <button onClick={status === 'recording' ? handlePauseRecording : handleResumeRecording} className="tool-button !p-3">
                    {status === 'recording' ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button 
                  onClick={handleStopRecording} 
                  className="tool-button !p-3 bg-[rgba(var(--color-danger-rgb),0.4)] hover:bg-[rgba(var(--color-danger-rgb),0.6)] border-[rgba(var(--color-danger-rgb),0.8)] text-[rgb(var(--color-danger-rgb))]"
                >
                    <StopIcon />
                </button>
              </div>
            </>
          )
        default:
          return null;
      }
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 flex justify-center z-50 pointer-events-none">
            <div className="bg-[var(--color-surface-2)]/80 backdrop-blur-md border border-[var(--color-border-secondary)] rounded-xl shadow-2xl p-3 flex items-center justify-center gap-6 text-[var(--color-text-primary)] pointer-events-auto">
              {renderControls()}
            </div>
        </div>
    );
});

ScreenRecorder.displayName = 'ScreenRecorder';

export default ScreenRecorder;