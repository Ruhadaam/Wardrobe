import { supabase } from '../lib/supabase';
import { WardrobeItem } from './visionApi';

export interface StylistSelection {
    top_id: string;
    bottom_id: string;
    shoes_id?: string | null;
    accessory_ids?: string[];
    reason?: string;
}

export const stylistService = {
    /**
     * Consults the AI Stylist (Gemini) to pick the best outfit from candidate items.
     * @param items - List of filtered wardrobe items
     * @param context - Description of the desired look or context
     */
    generateOutfit: async (
        items: WardrobeItem[],
        context: string = ""
    ): Promise<StylistSelection | null> => {
        try {
            console.log(`Consulting Stylist with ${items.length} items`);

            // Prepare lightweight payload with all relevant tags
            const candidates = items.map(item => ({
                id: item.item_id,
                category: item.analysis?.basic_info?.category || item.basic_info?.category || 'unknown',
                sub_category: item.analysis?.basic_info?.sub_category,
                primary_color: item.analysis?.visual_details?.primary_color,
                secondary_colors: item.analysis?.visual_details?.secondary_colors,
                style: item.analysis?.attributes?.style,
                season: item.analysis?.context?.seasons,
                formality: item.analysis?.context?.formality,
                material: item.analysis?.attributes?.material,
                fit: item.analysis?.attributes?.fit
            }));

            // Payload to send to Supabase Edge Function
            const payload = {
                candidates,
                context,
                // We can add user preferences here if available
            };

            const { data, error } = await supabase.functions.invoke('consult-stylist', {
                body: payload
            });

            if (error) {
                console.error("Stylist Function Error:", error);
                throw error;
            }

            if (data?.selection) {
                return data.selection as StylistSelection;
            }

            return null;

        } catch (error) {
            console.error("Stylist Service Exception:", error);
            throw error;
        }
    },

    // Legacy method kept for reference/compatibility if needed
    selectBestOutfit: async (
        tops: WardrobeItem[],
        bottoms: WardrobeItem[],
        context: string = "Stylish and coordinated"
    ): Promise<StylistSelection | null> => {
        // Re-route to new method by combining arrays
        return stylistService.generateOutfit([...tops, ...bottoms], context);
    }
};
