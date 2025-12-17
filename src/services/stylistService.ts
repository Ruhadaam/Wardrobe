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

            // Helper to remove empty keys
            const cleanObj = (obj: any) => {
                return Object.fromEntries(
                    Object.entries(obj).filter(([_, v]) =>
                        v != null &&
                        v !== '' &&
                        !(Array.isArray(v) && v.length === 0)
                    )
                );
            };

            // Prepare lightweight payload with all relevant tags
            const candidates = items.map(item => {
                const raw = {
                    id: item.item_id,
                    // Combine category/subcategory for brevity: "top/tshirt"
                    type: [
                        item.analysis?.basic_info?.category || item.basic_info?.category,
                        item.analysis?.basic_info?.sub_category || item.basic_info?.sub_category
                    ].filter(Boolean).join('/'),

                    // Colors
                    colors: [
                        item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color,
                        ...(item.analysis?.visual_details?.secondary_colors || item.visual_details?.secondary_colors || [])
                    ].filter(Boolean),

                    // Key attributes
                    style: item.analysis?.attributes?.style || item.attributes?.style,
                    season: item.analysis?.context?.seasons || item.context?.seasons,
                    formality: item.analysis?.context?.formality || item.context?.formality,
                    fit: item.analysis?.attributes?.fit || item.attributes?.fit
                };
                return cleanObj(raw);
            });

            console.log(`[Stylist] Payload size: ${JSON.stringify(candidates).length} chars for ${candidates.length} items`);

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
