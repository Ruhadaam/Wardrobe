import * as SQLite from 'expo-sqlite';
import { WardrobeItem } from './visionApi';

const DB_NAME = 'wardrobe.db';

// Singleton instance to prevent multiple connections/race conditions
let dbInstance: SQLite.SQLiteDatabase | null = null;

const getDb = async () => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    }
    return dbInstance;
};

export const databaseService = {
    // Initialize the database
    initDatabase: async () => {
        try {
            const db = await getDb();

            // Create clothes table
            await db.execAsync(`
        CREATE TABLE IF NOT EXISTS clothes (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          image_url TEXT NOT NULL,
          analysis_json TEXT NOT NULL, -- Storing full JSON for simplicity
          created_at TEXT NOT NULL
        );
      `);

            // Create outfits table
            await db.execAsync(`
        CREATE TABLE IF NOT EXISTS outfits (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          items_json TEXT NOT NULL, -- JSON array of item objects
          created_at TEXT NOT NULL
        );
      `);

            console.log('Database initialized successfully');
            return db;
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    },

    // Save items to local cache
    saveItems: async (items: any[]) => {
        try {
            const db = await getDb();

            for (const item of items) {
                // Skip invalid items that would cause DB errors
                if (!item.id || !item.user_id) {
                    console.warn('Skipping invalid item in saveItems:', item);
                    continue;
                }

                const params = [
                    String(item.id),
                    String(item.user_id),
                    String(item.image_url || ''), // Provide default for not-null string
                    JSON.stringify(item.analysis_json || {}),
                    String(item.created_at || new Date().toISOString())
                ];

                await db.runAsync(
                    `INSERT OR REPLACE INTO clothes (id, user_id, image_url, analysis_json, created_at) VALUES (?, ?, ?, ?, ?)`,
                    params
                );
            }
        } catch (error) {
            console.error('Error saving items to local DB:', error);
        }
    },

    // Add single item
    addItem: async (item: any) => {
        try {
            if (!item.id || !item.user_id) {
                console.error('Cannot add item with missing id or user_id:', item);
                return;
            }

            const db = await getDb();
            const params = [
                String(item.id),
                String(item.user_id),
                String(item.image_url || ''),
                JSON.stringify(item.analysis_json || {}),
                String(item.created_at || new Date().toISOString())
            ];

            console.log('Adding item to local DB:', item.id);

            await db.runAsync(
                `INSERT OR REPLACE INTO clothes (id, user_id, image_url, analysis_json, created_at) VALUES (?, ?, ?, ?, ?)`,
                params
            );
        } catch (error) {
            console.error('Error adding local item:', error);
            // Don't rethrow to avoid blocking the UI if local save fails
        }
    },

    // Delete item
    deleteItem: async (id: string) => {
        try {
            if (!id) return;
            const db = await getDb();
            await db.runAsync('DELETE FROM clothes WHERE id = ?', [String(id)]);
        } catch (error) {
            console.error('Error deleting local item:', error);
        }
    },

    // Sync user items (Full Sync: Delete missing, Upsert new)
    syncUserItems: async (userId: string, remoteItems: any[]) => {
        try {
            if (!userId) return;

            const db = await getDb();

            // 1. Get all local IDs for this user
            const localRows = await db.getAllAsync<{ id: string }>('SELECT id FROM clothes WHERE user_id = ?', [String(userId)]);
            const localIds = new Set(localRows.map(r => r.id));
            const remoteIds = new Set(remoteItems.map(i => i.id));

            // 2. Identify items to delete (present locally but not remotely)
            const idsToDelete = [...localIds].filter(id => !remoteIds.has(id));

            if (idsToDelete.length > 0) {
                console.log(`[Sync] Deleting ${idsToDelete.length} obsolete items from local DB sequentially to avoid NPE`);
                for (const id of idsToDelete) {
                    try {
                        // Delete individually to be safer against native binding errors
                        await db.runAsync('DELETE FROM clothes WHERE id = ?', [String(id)]);
                    } catch (err) {
                        console.error(`[Sync] Error deleting individual item ${id}:`, err);
                    }
                }
            }

            // 3. Upsert remote items
            if (remoteItems.length > 0) {
                await databaseService.saveItems(remoteItems);
            }

        } catch (error) {
            console.error('Error syncing items:', error);
            // Don't throw, just log. Sync failure shouldn't crash app
        }
    },

    // Get all items for a user
    getItems: async (userId: string) => {
        try {
            const db = await getDb();
            const allRows = await db.getAllAsync('SELECT * FROM clothes WHERE user_id = ? ORDER BY created_at DESC', [String(userId)]);

            // Map back to expected structure
            return allRows.map((row: any) => ({
                ...row,
                analysis_json: JSON.parse(row.analysis_json)
            }));
        } catch (error) {
            console.error('Error getting local items:', error);
            return [];
        }
    },

    // --- Outfits ---

    saveOutfit: async (outfit: { id: string, user_id: string, items_json: string, created_at: string }) => {
        try {
            const db = await getDb();
            await db.runAsync(
                `INSERT OR REPLACE INTO outfits (id, user_id, items_json, created_at) VALUES (?, ?, ?, ?)`,
                [String(outfit.id), String(outfit.user_id), String(outfit.items_json), String(outfit.created_at)]
            );
            console.log('Saved outfit to local DB:', outfit.id);
        } catch (error) {
            console.error('Error saving outfit:', error);
        }
    },

    getOutfits: async (userId: string) => {
        try {
            const db = await getDb();
            const allRows = await db.getAllAsync('SELECT * FROM outfits WHERE user_id = ? ORDER BY created_at DESC', [String(userId)]);
            return allRows.map((row: any) => ({
                ...row,
                items: JSON.parse(row.items_json)
            }));
        } catch (error) {
            console.error('Error getting outfits:', error);
            return [];
        }
    },

    deleteOutfit: async (id: string) => {
        try {
            const db = await getDb();
            await db.runAsync('DELETE FROM outfits WHERE id = ?', [String(id)]);
        } catch (error) {
            console.error('Error deleting outfit:', error);
        }
    },

    saveOutfits: async (outfits: any[]) => {
        try {
            const db = await getDb();
            for (const outfit of outfits) {
                if (!outfit.id || !outfit.user_id) continue;

                // If items_json is an object (from Supabase), stringify it
                let itemsJsonStr = outfit.items_json;
                if (typeof itemsJsonStr !== 'string') {
                    itemsJsonStr = JSON.stringify(itemsJsonStr);
                }

                await db.runAsync(
                    `INSERT OR REPLACE INTO outfits (id, user_id, items_json, created_at) VALUES (?, ?, ?, ?)`,
                    [String(outfit.id), String(outfit.user_id), itemsJsonStr, String(outfit.created_at)]
                );
            }
        } catch (error) {
            console.error('Error saving bulk outfits:', error);
        }
    },

    syncUserOutfits: async (userId: string, remoteOutfits: any[]) => {
        try {
            if (!userId) return;
            const db = await getDb();

            // 1. Get all local IDs
            const localRows = await db.getAllAsync<{ id: string }>('SELECT id FROM outfits WHERE user_id = ?', [String(userId)]);
            const localIds = new Set(localRows.map(r => r.id));
            const remoteIds = new Set(remoteOutfits.map(o => o.id));

            // 2. Delete obsolete
            const idsToDelete = [...localIds].filter(id => !remoteIds.has(id));
            if (idsToDelete.length > 0) {
                for (const id of idsToDelete) {
                    await db.runAsync('DELETE FROM outfits WHERE id = ?', [String(id)]);
                }
            }

            // 3. Upsert remote
            if (remoteOutfits.length > 0) {
                await databaseService.saveOutfits(remoteOutfits);
            }
        } catch (error) {
            console.error('Error syncing outfits:', error);
        }
    }
};
