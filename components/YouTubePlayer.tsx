


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
    onEnded?: () => void;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, isPlaying, onPlayerPlay, onPlayerPause, onEnded }) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const createPlayer = () => {
            if (containerRef.current && !playerRef.current) {
                playerRef.current = new window.YT.Player(containerRef.current, {
                    host: 'https://www.youtube-nocookie.com',
                    videoId: videoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        rel: 0,
                        showinfo: 0,
                        modestbranding: 1,
                        iv_load_policy: 3,
                    },
                    events: {
                        'onStateChange': onPlayerStateChange
                    }
                });
            }
        };

        const onPlayerStateChange = (event: any) => {
            // YT.PlayerState.ENDED === 0
            // YT.PlayerState.PLAYING === 1
            // YT.PlayerState.PAUSED === 2
            if (event.data === 1) { 
                onPlayerPlay();
            } else if (event.data === 2) {
                onPlayerPause();
            } else if (event.data === 0) {
                onEnded?.();
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
    }, [videoId, onPlayerPlay, onPlayerPause, onEnded]);

    useEffect(() => {
        if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
            const playerState = playerRef.current.getPlayerState();
            if (isPlaying && playerState !== 1 && playerState !== 3) { // 1=playing, 3=buffering
                playerRef.current.playVideo();
            } else if (!isPlaying && playerState === 1) {
                playerRef.current.pauseVideo();
            }
        }
    }, [isPlaying]);

    return <div ref={containerRef} className="w-full h-full" />;
};

export default React.memo(YouTubePlayer);