
import React from 'react';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  disabled: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, disabled }) => {
  return (
    <div className="h-full flex flex-col">
      <label htmlFor="prompt" className="block text-md font-medium text-gray-300 mb-2">
        What should the story be about?
      </label>
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={disabled}
        placeholder="e.g., A brave child who befriends a gentle giant in the forest of Dajin Rugu..."
        className="w-full flex-grow p-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
      />
      <p className="text-xs text-gray-500 mt-2">Enter your story idea in English or Hausa.</p>
    </div>
  );
};

export default PromptInput;
