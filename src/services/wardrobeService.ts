import { supabase } from '../lib/supabase';
import { WardrobeItem } from './visionApi';
import * as FileSystem from 'expo-file-system/legacy';
import { toByteArray } from 'base64-js';

export const wardrobeService = {
    // Fetch all items for the user
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

        return data;
    },

    // Upload image to Supabase Storage
    uploadImage: async (userId: string, imageUri: string): Promise<string> => {
        try {
            const ext = imageUri.substring(imageUri.lastIndexOf('.') + 1);
            const fileName = `${userId}/${Date.now()}.${ext}`;
            const filePath = `${fileName}`;

            // Read file as base64
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
        const safeAnalysis = analysis || {};
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

        return data;
    },

    // Delete an item
    deleteItem: async (itemId: string) => {
        const { error } = await supabase
            .from('clothes')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
    }
};
