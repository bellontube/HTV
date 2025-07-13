import { openDB } from 'idb';

const DB_NAME = 'KannywoodStudioDB';
const DB_VERSION = 2; // Version bumped
const IMAGE_STORE = 'images';
const VIDEO_STORE = 'videos';
const APP_SETTINGS_STORE = 'app_settings'; // New store for settings

const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
            // Store contains flexible objects for media items.
            // e.g., { id, file, prompt, source, studio, type, duration } for files
            // or { id, url, prompt, source, studio, type } for YouTube videos
            const imageStore = db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
            imageStore.createIndex('studio', 'studio', { unique: false });
        }
        if (!db.objectStoreNames.contains(VIDEO_STORE)) {
            // Store contains: MediaAsset object, where `file` is a File object.
            db.createObjectStore(VIDEO_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(APP_SETTINGS_STORE)) {
            db.createObjectStore(APP_SETTINGS_STORE, { keyPath: 'key' });
        }
    },
});

// --- Settings Functions ---
export const getSetting = async (key: string): Promise<any> => {
    const db = await dbPromise;
    const item = await db.get(APP_SETTINGS_STORE, key);
    return item ? item.value : undefined;
};

export const setSetting = async (key: string, value: any): Promise<void> => {
    const db = await dbPromise;
    await db.put(APP_SETTINGS_STORE, { key, value });
};

// --- Generic Functions ---
export const storeItem = async (storeName: 'images' | 'videos', item: any): Promise<any> => {
    const db = await dbPromise;
    return db.put(storeName, item);
};

export const getAllItems = async (storeName: 'images' | 'videos'): Promise<any[]> => {
    const db = await dbPromise;
    return db.getAll(storeName);
};

export const getItemsByStudio = async (studio: 'left' | 'right'): Promise<any[]> => {
    const db = await dbPromise;
    return db.getAllFromIndex(IMAGE_STORE, 'studio', studio);
};

export const deleteItem = async (storeName: 'images' | 'videos', id: string): Promise<void> => {
    const db = await dbPromise;
    return db.delete(storeName, id);
};

export const clearStudioImagesFromDB = async (studio: 'left' | 'right'): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    const store = tx.objectStore(IMAGE_STORE);
    const index = store.index('studio');
    let cursor = await index.openCursor(IDBKeyRange.only(studio));
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
};