

export interface Scene {
  sceneNumber: number;
  text: string;
  imageUrl?: string;
  audioUrl?: string;
}

export interface Story {
  title: string;
  moral: string;
  scenes: Scene[];
}

export interface StudioMediaItem {
  id: string;      // Unique ID for React keys
  type: 'image' | 'video' | 'youtube';
  url:string;     // Base64 data URL, blob URL, or YouTube Video ID
  prompt?: string; // The prompt used for generation (if AI)
  source: 'ai' | 'local' | 'youtube';
  duration?: number; // duration in seconds for videos
}

export interface StudioState {
  title: string;
  prompt: string;
  images: StudioMediaItem[];
  imageCount: number;
  artStyle: string;
  slideshowTransition: 'fade' | 'pan';
  isGenerating: boolean;
  error: string | null;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string; // Blob URL
  file: File;
  duration: number;
}

export interface TimelineClip {
  id:string;
  assetId: string;
  assetName: string;
  startTime: number;
  endTime: number;
}

export type PlayerId =
  | 'movie'
  | 'studio-left'
  | 'studio-right'
  | 'audio-left-1'
  | 'audio-left-2'
  | 'audio-left-3'
  | 'audio-left-4'
  | 'audio-right-1'
  | 'audio-right-2'
  | 'audio-right-3'
  | 'audio-right-4';