


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
  type: 'image' | 'video';
  url:string;     // Base64 data URL or blob URL
  prompt?: string; // The prompt used for generation (if AI)
  source: 'ai' | 'local';
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
  id: string;
  assetId: string;
  assetName: string;
  startTime: number;
  endTime: number;
}