import React, { useState } from 'react';
import { useSound } from '../hooks/useSound.tsx';

interface ColorPaletteProps {
    colors: string[];
    onClose: () => void;
}

const ColorSwatch: React.FC<{ color: string }> = ({ color }) => {
    const [copied, setCopied] = useState(false);
    const { playSound } = useSound();

    const handleCopy = () => {
        navigator.clipboard.writeText(color).then(() => {
            playSound('click');
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    return (
        <div
            onClick={handleCopy}
            className="relative w-full aspect-square rounded-full border-2 border-white/20 shadow-lg cursor-pointer transform hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={`Copy ${color}`}
        >
            {copied && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                    <span className="text-white text-xs font-bold">Copied!</span>
                </div>
            )}
        </div>
    );
};


const ColorPalette: React.FC<ColorPaletteProps> = ({ colors, onClose }) => {
    const { playSound } = useSound();
    
    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        playSound('click');
        onClose();
    };

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 fade-in">
            <div className="relative bg-gray-900/80 border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-900/50">
                <button onClick={handleClose} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-red-500 transition-colors" aria-label="Close palette">
                    &times;
                </button>
                <h3 className="text-lg font-lora text-center text-purple-300 mb-4">Dominant Colors</h3>
                <div className="grid grid-cols-5 gap-4">
                    {colors.map(color => <ColorSwatch key={color} color={color} />)}
                </div>
                <p className="text-xs text-gray-500 text-center mt-4">Click a color to copy its hex code.</p>
            </div>
        </div>
    );
};

export default ColorPalette;
