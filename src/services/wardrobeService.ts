import { supabase } from '../lib/supabase';
import { WardrobeItem } from './visionApi';
import * as FileSystem from 'expo-file-system/legacy';
import { toByteArray } from 'base64-js';
import { databaseService } from './databaseService';
import * as Crypto from 'expo-crypto';

export const wardrobeService = {
    // Initialize Local DB
    initialize: async () => {
        await databaseService.initDatabase();
    },

    // Get items from Local DB (Instant)
    getLocalItems: async (userId: string) => {
        return await databaseService.getItems(userId);
    },

    // Fetch from Supabase and Sync to Local DB
    fetchItems: async (userId: string) => {
        const { data, error } = await supabase
            .from('clothes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching wardrobe items:', error);
            throw error;
        }

        // Sync to local DB
        if (data) {
            await databaseService.syncUserItems(userId, data);
        }

        return data;
    },

    // Upload image to Supabase Storage
    uploadImage: async (userId: string, imageUri: string): Promise<string> => {
        try {
            const ext = imageUri.substring(imageUri.lastIndexOf('.') + 1);
            const fileName = `${userId}/${Date.now()}.${ext}`;
            const filePath = `${fileName}`;

            // Read file as base64
            // Using string 'base64' directly to avoid deprecation/undefined issues with EncodingType
            const fileBase64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: 'base64',
            });

            const arrayBuffer = toByteArray(fileBase64);

            const { data, error } = await supabase.storage
                .from('uploads') // Assuming this bucket exists
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${ext}`,
                    upsert: false,
                });

            if (error) throw error;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('uploads')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },

    // Add a new item to the database
    addItem: async (userId: string, visionItem: WardrobeItem, publicImageUrl: string) => {
        const analysis = visionItem.analysis;
        // Helper to avoid TS errors on empty objects
        const safeAnalysis: any = analysis || {};
        const basicInfo = safeAnalysis.basic_info || {};
        const visual = safeAnalysis.visual_details || {};
        const context = safeAnalysis.context || {};
        const attributes = safeAnalysis.attributes || {};

        const dbItem = {
            user_id: userId,
            image_url: publicImageUrl,

            // Mapped fields
            category: (basicInfo as any).category || null,
            sub_category: (basicInfo as any).sub_category || null,

            primary_color: (visual as any).primary_color || null,
            secondary_colors: (visual as any).secondary_colors || null,

            seasons: (context as any).seasons || [],
            formality: (context as any).formality || null,

            pattern: (visual as any).pattern || null,

            style: (attributes as any).style || null,
            material: (attributes as any).material || null,
            fit: (attributes as any).fit || null,
            features: (attributes as any).features || [],

            // Store full JSON for future proofing
            analysis_json: visionItem,
        };

        const { data, error } = await supabase
            .from('clothes')
            .insert([dbItem])
            .select()
            .single();

        if (error) {
            console.error('Error insert clothes:', error);
            throw error;
        }

        // Add to local DB
        if (data) {
            await databaseService.addItem(data);
        }

        return data;
    },

    // Delete an item
    deleteItem: async (itemId: string) => {
        try {
            // 1. Get image URL first to delete from storage
            const { data: item, error: fetchError } = await supabase
                .from('clothes')
                .select('image_url')
                .eq('id', itemId)
                .single();

            if (fetchError) {
                console.warn('Error fetching item for image deletion (continuing with record delete):', fetchError);
            }

            // 2. Delete from Storage
            if (item?.image_url) {
                try {
                    // Extract path from URL. Adjust based on your actual URL structure if needed.
                    // Assuming format includes '/uploads/' segment.
                    // decodeURIComponent is important if the URL has special characters.
                    const decodedUrl = decodeURIComponent(item.image_url);
                    const urlParts = decodedUrl.split('/uploads/');

                    if (urlParts.length > 1) {
                        // Take the part after /uploads/ and strip any query parameters
                        let filePath = urlParts[1];
                        if (filePath.includes('?')) {
                            filePath = filePath.split('?')[0];
                        }

                        console.log(`Attempting to delete file from storage via Edge Function. Path: ${filePath}`);

                        const { data: removeData, error: deleteError } = await supabase.functions.invoke('delete-image', {
                            body: { path: filePath }
                        });

                        if (deleteError) {
                            console.error('Error calling delete-image function:', deleteError);
                        } else if (removeData && !removeData.success) {
                            console.error('Delete function returned error:', removeData.error);
                        } else {
                            console.log('Delete function response:', removeData);
                        }
                    } else {
                        console.warn('Could not extract file path from URL:', item.image_url);
                    }
                } catch (e) {
                    console.error('Error processing image deletion:', e);
                }
            }

            // 3. Delete from Supabase DB
            const { error } = await supabase
                .from('clothes')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            // 4. Delete from local DB
            await databaseService.deleteItem(itemId);
        } catch (error) {
            console.error('Error in deleteItem service:', error);
            throw error;
        }
    },



    // --- Outfits ---
    saveOutfit: async (userId: string, items: WardrobeItem[]) => {
        const outfit = {
            id: Crypto.randomUUID(),
            user_id: userId,
            items_json: JSON.stringify(items),
            created_at: new Date().toISOString()
        };

        // 1. Save to Local DB (Priority for UI)
        await databaseService.saveOutfit(outfit);

        // 2. Sync to Supabase (Background)
        try {
            const { error } = await supabase
                .from('outfits')
                .insert([{
                    id: outfit.id,
                    user_id: outfit.user_id,
                    items_json: items, // Supabase expects JSON object for jsonb column, client handles stringify
                    created_at: outfit.created_at
                }]);

            if (error) {
                console.error('Error saving outfit to Supabase:', error);
            } else {
                console.log('Saved outfit to Supabase:', outfit.id);
            }
        } catch (e) {
            console.error('Supabase sync error:', e);
        }

        return outfit;
    },

    getOutfits: async (userId: string) => {
        // Fetch from Supabase
        const { data, error } = await supabase
            .from('outfits')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (data) {
            // Sync to local
            await databaseService.syncUserOutfits(userId, data);
        } else if (error) {
            console.warn('Error fetching outfits from Supabase, failing over to local:', error);
        }

        return await databaseService.getOutfits(userId);
    },

    deleteOutfit: async (id: string) => {
        // Delete from Supabase
        const { error } = await supabase
            .from('outfits')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting outfit from Supabase:', error);
            throw error;
        }

        // Delete from Local
        await databaseService.deleteOutfit(id);
    },

    getTodayOutfitCount: async (userId: string): Promise<number> => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('outfits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', today.toISOString());

        if (error) {
            console.error('Error getting today outfit count:', error);
            return 0;
        }

        return count || 0;
    }
};
