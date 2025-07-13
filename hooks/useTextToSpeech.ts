
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTextToSpeechProps {
  onEnd: () => void;
}

export const useTextToSpeech = ({ onEnd }: UseTextToSpeechProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      const synth = window.speechSynthesis;
      synthRef.current = synth;

      const updateVoices = () => {
        setVoices(synth.getVoices());
      };

      updateVoices(); // Initial check
      synth.addEventListener('voiceschanged', updateVoices);

      return () => {
        synth.removeEventListener('voiceschanged', updateVoices);
        synth.cancel();
      };
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (!isSupported || !synthRef.current) return;
    
    setSpeechError(null);
    synthRef.current.cancel(); // Clear any previous utterances

    const utterance = new SpeechSynthesisUtterance(text);
    
    const hausaVoice = voices.find(voice => voice.lang.startsWith('ha'));
    if (hausaVoice) {
      utterance.voice = hausaVoice;
    } else {
      utterance.lang = 'ha-NG'; // Fallback language code
    }
    
    utterance.pitch = 1;
    utterance.rate = 0.9;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEndRef.current();
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      setIsSpeaking(false);
      console.error('SpeechSynthesisUtterance.onerror', event);

      let errorMessage = 'An unknown audio narration error occurred.';
      if (event && event.error) {
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Speech synthesis is not permitted. Please check browser permissions.';
            break;
          case 'synthesis-unavailable':
            errorMessage = 'Speech synthesis is not available on this browser.';
            break;
          case 'language-unavailable':
            errorMessage = 'The Hausa language is not supported for narration on this browser.';
            break;
          case 'voice-unavailable':
            errorMessage = 'The required Hausa voice is currently unavailable.';
            break;
          case 'synthesis-failed':
            errorMessage = 'The speech synthesis engine failed to generate audio.';
            break;
          case 'network':
            errorMessage = 'A network error prevented audio narration from loading.';
            break;
          case 'audio-busy':
            errorMessage = 'The audio output device is busy. Please try again.';
            break;
          case 'canceled':
            // This is a programmatic cancellation, not a user-facing error.
            return;
          default:
            errorMessage = `An unexpected narration error occurred: ${event.error}.`;
            break;
        }
      }
      setSpeechError(errorMessage);
    };

    synthRef.current.speak(utterance);
  }, [isSupported, voices]);

  const cancel = useCallback(() => {
    if (!isSupported || !synthRef.current?.speaking) return;
    
    setSpeechError(null);
    setIsSpeaking(false);
    synthRef.current.cancel();
  }, [isSupported]);
  
  return { isSupported, isSpeaking, speak, cancel, speechError };
};