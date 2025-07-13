
import React, { useState } from 'react';
import { useStudio } from '../contexts/StudioProvider.tsx';
import { useSound } from '../hooks/useSound.tsx';
import { generatePromptIdeas } from '../services/geminiService.ts';
import { SparklesIcon } from './icons/SparklesIcon.tsx';

interface AIHelperModalProps {
    onClose: () => void;
}

const AIHelperModal: React.FC<AIHelperModalProps> = ({ onClose }) => {
    const { dispatch } = useStudio();
    const { playSound } = useSound();
    const [theme, setTheme] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ideas, setIdeas] = useState<string[]>([]);
    const [targetStudio, setTargetStudio] = useState<'left' | 'right'>('left');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!theme) return;

        setIsLoading(true);
        setError(null);
        setIdeas([]);
        playSound('start');

        try {
            const promptIdeas = await generatePromptIdeas(theme);
            setIdeas(promptIdeas);
            playSound('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            playSound('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleIdeaClick = (idea: string) => {
        playSound('click');
        dispatch({ type: 'SET_VALUE', payload: { studio: targetStudio, key: 'prompt', value: idea } });
        // Switch target to the other studio for the next click
        setTargetStudio(prev => prev === 'left' ? 'right' : 'left');
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 max-w-2xl w-full flex flex-col gap-4 fade-in" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold font-lora text-purple-300 flex items-center gap-3">
                        <SparklesIcon />
                        AI Prompt Helper
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <p className="text-gray-400 text-sm">Describe the theme of your video, and the AI will generate creative image prompts to enhance it.</p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <textarea
                        value={theme}
                        onChange={e => setTheme(e.target.value)}
                        placeholder="e.g., A travel documentary about the Sahara desert..."
                        className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                        rows={3}
                        disabled={isLoading}
                    />
                     <button type="submit" disabled={!theme || isLoading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-t-white border-transparent rounded-full animate-spin"></div>
                                Generating Ideas...
                            </>
                        ) : 'Generate Prompt Ideas'}
                     </button>
                </form>

                {error && (
                    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm" role="alert">
                        <strong>Error:</strong> {error}
                    </div>
                )}
                
                {ideas.length > 0 && (
                    <div className="border-t border-gray-700 pt-4">
                        <h3 className="font-semibold text-lg text-gray-300 mb-2">Generated Ideas</h3>
                        <p className="text-xs text-gray-500 mb-3">Click an idea to send it to an Image Studio. The target studio (Left/Right) will alternate with each click.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ideas.map((idea, index) => (
                                <button 
                                    key={index}
                                    onClick={() => handleIdeaClick(idea)}
                                    className="p-3 text-left bg-gray-700/50 rounded-lg hover:bg-purple-900/50 hover:border-purple-600 border border-transparent transition-colors text-gray-300 text-sm"
                                >
                                    {idea}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIHelperModal;