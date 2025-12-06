import * as SQLite from 'expo-sqlite';
import { WardrobeItem } from './visionApi';

const DB_NAME = 'wardrobe.db';

// Singleton instance to prevent multiple connections/race conditions
let dbInstance: SQLite.SQLiteDatabase | null = null;

const getDb = async () => {
    if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
        // Ensure table exists on every init to be safe, or just rely on initDatabase being called first.
        // For robustness, let's just return the instance, assuming initDatabase was called effectively,
        // or we can lazily init the table here too.
        // Let's stick to the current pattern but reuse the instance.
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

            // Clear existing items for these IDs or all? 
            // For simplicity/sync: Replace logic or Insert or Replace.
            // But we generally sync by fetching all remotely. 
            // Let's implement bulk replace for simplicity if fetching all, 
            // or upsert for individual. 

            // If we are syncing ALL items for a user, we might want to clear old ones first,
            // but that risks wiping offline data if sync fails partially? 
            // Safer: Loop and UPSERT.

            for (const item of items) {
                const params = [
                    item.id ?? null,
                    item.user_id ?? null,
                    item.image_url ?? null,
                    JSON.stringify(item.analysis_json || {}),
                    item.created_at || new Date().toISOString()
                ];

                // Validate params to ensure no undefined values slip through (though ?? null handles most)
                if (params.some(p => p === undefined)) {
                    console.warn('Undefined parameter found in saveItems', item);
                }

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
            const db = await getDb();
            const params = [
                item.id ?? null,
                item.user_id ?? null,
                item.image_url ?? null,
                JSON.stringify(item.analysis_json ?? {}),
                item.created_at || new Date().toISOString()
            ];

            console.log('Adding item to local DB:', item.id);

            await db.runAsync(
                `INSERT OR REPLACE INTO clothes (id, user_id, image_url, analysis_json, created_at) VALUES (?, ?, ?, ?, ?)`,
                params
            );
        } catch (error) {
            console.error('Error adding local item:', error);
            // Don't rethrow to avoid blocking the UI if local save fails, 
            // but log it clearly.
        }
    },

    // Delete item
    deleteItem: async (id: string) => {
        try {
            const db = await getDb();
            await db.runAsync('DELETE FROM clothes WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error deleting local item:', error);
        }
    },

    // Get all items for a user
    getItems: async (userId: string) => {
        try {
            const db = await getDb();
            const allRows = await db.getAllAsync('SELECT * FROM clothes WHERE user_id = ? ORDER BY created_at DESC', [userId]);

            // Map back to expected structure
            return allRows.map((row: any) => ({
                ...row,
                analysis_json: JSON.parse(row.analysis_json)
            }));
        } catch (error) {
            console.error('Error getting local items:', error);
            return [];
        }
    }
};
