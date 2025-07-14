
import React, { useMemo } from 'react';

interface CreativeSparkLoaderProps {
    text: string;
}

const CreativeSparkLoader: React.FC<CreativeSparkLoaderProps> = ({ text }) => {
    const sparks = useMemo(() => {
        return Array.from({ length: 15 }).map((_, i) => {
            const style = {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1.5}s`,
                animationDuration: `${1 + Math.random() * 0.8}s`,
            };
            return <div key={i} className="spark" style={style} />;
        });
    }, []);

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 z-10 overflow-hidden">
            <div className="relative w-48 h-48">
                {sparks}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
                 <div className="w-12 h-12 border-4 border-t-[var(--color-accent-1)] border-[var(--color-border-secondary)] rounded-full animate-spin"></div>
                 <p className="text-[var(--color-text-primary)] text-lg font-semibold mt-2">{text}</p>
            </div>
        </div>
    );
};

export default CreativeSparkLoader;