
import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { DownloadIcon } from './icons/DownloadIcon.tsx';
import { CloseIcon } from './icons/CloseIcon.tsx';

const ScreenRecorder = forwardRef((props, ref) => {
    const [recordingState, setRecordingState] = useState<'idle' | 'countingDown' | 'recording'>('idle');
    const [countdown, setCountdown] = useState<number>(3);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const countdownTimerRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
        start: (includeMic: boolean) => {
            prepareToRecord(includeMic);
        }
    }));

    const cleanup = () => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
        mediaRecorderRef.current = null;
    };
    
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        } else {
            cleanup();
            setRecordingState('idle');
        }
    };

    const prepareToRecord = async (includeMic: boolean) => {
        if (recordingState !== 'idle') return;
        
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
        recordedChunksRef.current = [];

        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: "browser" },
                audio: true, 
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
                }
                cleanup();
                setRecordingState('idle');
            };

            setCountdown(3);
            setRecordingState('countingDown');

            countdownTimerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownTimerRef.current!);
                        countdownTimerRef.current = null;
                        if (mediaRecorderRef.current) {
                            mediaRecorderRef.current.start();
                            setRecordingState('recording');
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (err) {
            console.error("Error starting screen recording:", err);
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                 alert('Permission to record the screen was denied. Please try again and grant access.');
            } else {
                 alert(`An error occurred while starting the screen recording. Please check console for details.`);
            }
            cleanup();
            setRecordingState('idle');
        }
    };
    
    useEffect(() => {
        return () => {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            cleanup();
        };
    }, []);

    const handleDiscard = () => {
        if (videoUrl) URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
        recordedChunksRef.current = [];
        setRecordingState('idle');
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

    if (recordingState === 'idle' && !videoUrl) return null;
    if (recordingState === 'recording') return null;

    if (recordingState === 'countingDown') {
        return (
            <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
                <h2 className="text-8xl font-bold text-white font-mono">{countdown}</h2>
                <p className="text-xl text-gray-200 mt-4">Recording will begin shortly...</p>
                <div className="mt-8 bg-gray-900/80 p-3 rounded-lg border border-gray-700 max-w-md text-center">
                    <p className="text-md text-gray-300">To stop recording, use the browser's native "Stop sharing" button.</p>
                </div>
            </div>
        );
    }

    if (videoUrl) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl shadow-2xl p-4 border border-gray-700 max-w-4xl w-full flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-purple-300">Recording Preview</h3>
                        <button onClick={handleDiscard} className="text-gray-400 hover:text-white">
                            <CloseIcon />
                        </button>
                    </div>
                    <video src={videoUrl} controls autoPlay className="w-full rounded-lg bg-black" />
                    <div className="flex justify-end gap-3">
                        <button onClick={handleDiscard} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Discard
                        </button>
                        <button onClick={handleDownload} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <DownloadIcon />
                            Download
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
});

export default ScreenRecorder;