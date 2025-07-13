
import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

interface YouTubePlayerProps {
    videoId: string;
    isPlaying: boolean;
    onPlayerPlay: () => void;
    onPlayerPause: () => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, isPlaying, onPlayerPlay, onPlayerPause }) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const createPlayer = () => {
            if (containerRef.current && !playerRef.current) {
                playerRef.current = new window.YT.Player(containerRef.current, {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        rel: 0,
                        showinfo: 0,
                        modestbranding: 1,
                    },
                    events: {
                        'onStateChange': onPlayerStateChange
                    }
                });
            }
        };

        const onPlayerStateChange = (event: any) => {
            // YT.PlayerState.PLAYING === 1
            // YT.PlayerState.PAUSED === 2
            if (event.data === 1) { 
                onPlayerPlay();
            } else if (event.data === 2) {
                onPlayerPause();
            }
        };

        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            window.onYouTubeIframeAPIReady = createPlayer;
        }
        
        return () => {
            if(playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [videoId, onPlayerPlay, onPlayerPause]);

    useEffect(() => {
        if (playerRef.current && playerRef.current.getPlayerState) {
            if (isPlaying && playerRef.current.getPlayerState() !== 1) {
                playerRef.current.playVideo();
            } else if (!isPlaying && playerRef.current.getPlayerState() === 1) {
                playerRef.current.pauseVideo();
            }
        }
    }, [isPlaying]);

    return <div ref={containerRef} className="w-full h-full" />;
};

export default YouTubePlayer;
