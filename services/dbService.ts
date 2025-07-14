

import { openDB } from 'idb';

const DB_NAME = 'KannywoodStudioDB';
const DB_VERSION = 4; // Version bumped for new key
const IMAGE_STORE = 'images';
const APP_SETTINGS_STORE = 'app_settings';
const AUDIO_MESSAGES_STORE = 'audio_messages';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade: async (db, oldVersion, newVersion, tx) => {
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
            const imageStore = db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
            imageStore.createIndex('studio', 'studio', { unique: false });
        }
        if (db.objectStoreNames.contains('videos')) {
            db.deleteObjectStore('videos');
        }
        if (!db.objectStoreNames.contains(APP_SETTINGS_STORE)) {
            db.createObjectStore(APP_SETTINGS_STORE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(AUDIO_MESSAGES_STORE)) {
            db.createObjectStore(AUDIO_MESSAGES_STORE, { keyPath: 'id' });
        }

        // Migration for renaming bookTitle to featureTitle
        if (oldVersion < 4) {
            // Use the provided transaction `tx` and `await` promises.
            // This prevents starting a new transaction during a version change
            // and ensures the migration completes before the transaction is committed.
            try {
                const store = tx.objectStore(APP_SETTINGS_STORE);
                const oldEntry = await store.get('bookTitle');
                if (oldEntry) {
                    await store.put({ key: 'featureTitle', value: oldEntry.value });
                    await store.delete('bookTitle');
                }
            } catch (error) {
                console.error('Migration failed:', error);
                // Abort the transaction if migration fails
                tx.abort();
            }
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
export const storeItem = async (storeName: 'images' | 'audio_messages', item: any): Promise<any> => {
    const db = await dbPromise;
    return db.put(storeName, item);
};

export const getAllItems = async (storeName: 'images' | 'audio_messages'): Promise<any[]> => {
    const db = await dbPromise;
    return db.getAll(storeName);
};

export const getItemsByStudio = async (studio: 'left' | 'right'): Promise<any[]> => {
    const db = await dbPromise;
    return db.getAllFromIndex(IMAGE_STORE, 'studio', studio);
};

export const deleteItem = async (storeName: 'images' | 'audio_messages', id: string): Promise<void> => {
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
