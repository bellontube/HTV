
import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { StudioState, StudioMediaItem } from '../types.ts';
import * as db from '../services/dbService.ts';

type StudioName = 'left' | 'right';

interface AppState {
  left: StudioState;
  right: StudioState;
}

type Action =
  | { type: 'HYDRATE_STATE'; payload: { left: Partial<StudioState>, right: Partial<StudioState> } }
  | { type: 'SET_VALUE'; payload: { studio: StudioName; key: keyof StudioState; value: any } }
  | { type: 'ADD_IMAGES'; payload: { studio: StudioName; images: StudioMediaItem[] } }
  | { type: 'SET_IMAGES'; payload: { studio: StudioName; images: StudioMediaItem[] } }
  | { type: 'CLEAR_IMAGES'; payload: { studio: StudioName } }
  | { type: 'SET_GENERATING'; payload: { studio: StudioName; isGenerating: boolean } }
  | { type: 'SET_ERROR'; payload: { studio: StudioName; error: string | null } };

const StudioContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

const defaultArtStyle = "Cinematic digital painting, hyper-detailed, dramatic lighting, rich colors, emotional, 8k, epic.";

const createInitialStudioState = (defaults: Partial<StudioState> = {}): StudioState => ({
  title: 'Untitled',
  prompt: '',
  images: [],
  imageCount: 10,
  artStyle: defaultArtStyle,
  slideshowTransition: 'fade',
  isGenerating: false,
  error: null,
  ...defaults,
});

const getInitialState = (): AppState => ({
  left: createInitialStudioState({ title: 'Actors', prompt: 'Handsome Hausa actors in stylish modern clothing' }),
  right: createInitialStudioState({ title: 'Actresses', prompt: 'Beautiful Hausa actresses in elegant modern clothing' }),
});

const appReducer = (state: AppState, action: Action): AppState => {
  const { type, payload } = action;
  
  switch (type) {
    case 'HYDRATE_STATE':
        return {
            left: { ...state.left, ...payload.left },
            right: { ...state.right, ...payload.right },
        };
    case 'SET_VALUE':
      return { ...state, [payload.studio]: { ...state[payload.studio], [payload.key]: payload.value } };
    
    case 'ADD_IMAGES':
      return { ...state, [payload.studio]: { ...state[payload.studio], images: [...payload.images, ...state[payload.studio].images] } };

    case 'SET_IMAGES':
      // This will replace all images, used for hydration
      return { ...state, [payload.studio]: { ...state[payload.studio], images: payload.images } };
      
    case 'CLEAR_IMAGES': {
      const studioState = state[payload.studio];
      studioState.images.forEach(img => URL.revokeObjectURL(img.url));
      db.clearStudioImagesFromDB(payload.studio);
      return { ...state, [payload.studio]: { ...studioState, images: [] } };
    }

    case 'SET_GENERATING':
      return { ...state, [payload.studio]: { ...state[payload.studio], isGenerating: payload.isGenerating, error: null } };
      
    case 'SET_ERROR':
      return { ...state, [payload.studio]: { ...state[payload.studio], isGenerating: false, error: payload.error } };
    
    default:
      return state;
  }
};

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, getInitialState());
  
  useEffect(() => {
    const hydrateState = async () => {
        const loadStudioFromDB = async (studioName: StudioName): Promise<Partial<StudioState>> => {
            try {
                const stored = await db.getSetting(`${studioName}StudioState`);
                if (stored) {
                    delete stored.images; // images are hydrated from their own DB store
                    stored.isGenerating = false;
                    stored.error = null;
                    return stored;
                }
            } catch(e) { console.error(`Failed to load studio state for ${studioName} from DB`, e); }
            return {};
        };
        
        const leftDbImages = await db.getItemsByStudio('left');
        const rightDbImages = await db.getItemsByStudio('right');

        const leftImages = leftDbImages.map(img => ({ ...img, url: URL.createObjectURL(img.file) }));
        const rightImages = rightDbImages.map(img => ({ ...img, url: URL.createObjectURL(img.file) }));

        dispatch({
            type: 'HYDRATE_STATE',
            payload: {
                left: { ...(await loadStudioFromDB('left')), images: leftImages },
                right: { ...(await loadStudioFromDB('right')), images: rightImages },
            }
        });
    };
    hydrateState();
  }, []);

  useEffect(() => {
    const saveStateToDB = async () => {
        try {
          const leftStateToSave = { ...state.left, images: undefined, isGenerating: undefined, error: undefined };
          const rightStateToSave = { ...state.right, images: undefined, isGenerating: undefined, error: undefined };
          await db.setSetting('leftStudioState', leftStateToSave);
          await db.setSetting('rightStudioState', rightStateToSave);
        } catch (error) {
          console.error('Failed to save state to IndexedDB:', error);
        }
    };
    saveStateToDB();
  }, [state.left, state.right]);


  return <StudioContext.Provider value={{ state, dispatch }}>{children}</StudioContext.Provider>;
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
};