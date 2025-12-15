import { supabase } from '../lib/supabase';
import { WardrobeItem } from './visionApi';
import { stylistService } from './stylistService';

// Default model image if user doesn't provide one
// Using a high-quality, neutral mannequin or model image
const DEFAULT_MODEL_IMAGE = "https://raw.githubusercontent.com/idm-vton/idm-vton/main/examples/model.jpg";

export interface GenerationResult {
    success: boolean;
    imageUrl?: string;
    error?: string;
}

export const outfitGenerationService = {
    /**
     * Composes an outfit from the provided items and generates a VTON image.
     * @param validItems - The list of items matching the user's filters.
     * @param allItems - The entire wardrobe (used for fallback if outfit is incomplete).
     * @param userPhotoUrl - Optional URL of the user's full-body photo.
     */
    generateOutfit: async (
        validItems: WardrobeItem[],
        allItems: WardrobeItem[],
        userPhotoUrl?: string
    ): Promise<GenerationResult> => {
        try {
            // 1. Select Items (Auto-Compose Logic)
            let tops = validItems.filter(i =>
                isCategory(i, ['top', 'shirt', 't-shirt', 'blouse', 'sweater', 'hoodie', 'jacket', 'coat'])
            );
            let bottoms = validItems.filter(i =>
                isCategory(i, ['bottom', 'pants', 'trousers', 'jeans', 'skirt', 'shorts'])
            );

            // --- SMART FALLBACK LOGIC ---
            // If strictly filtered items are missing a piece, search in the FULL wardrobe.

            // Fallback for Top
            if (tops.length === 0) {
                // Strategy: Find a Neutral Top (White/Black/Grey) or any Top
                const allTops = allItems.filter(i => isCategory(i, ['top', 'shirt', 't-shirt', 'blouse', 'sweater', 'hoodie']));

                // Try to find neutral colors first
                const neutrals = allTops.filter(i => {
                    const color = (i.analysis?.visual_details?.primary_color || '').toLowerCase();
                    return ['white', 'black', 'grey', 'gray', 'beige'].some(c => color.includes(c));
                });

                if (neutrals.length > 0) tops = neutrals;
                else if (allTops.length > 0) tops = allTops; // Any top is better than error
            }

            // Fallback for Bottom
            if (bottoms.length === 0) {
                const allBottoms = allItems.filter(i => isCategory(i, ['bottom', 'pants', 'trousers', 'jeans', 'skirt']));

                const neutrals = allBottoms.filter(i => {
                    const color = (i.analysis?.visual_details?.primary_color || '').toLowerCase();
                    return ['black', 'blue', 'navy', 'grey', 'gray', 'denim'].some(c => color.includes(c));
                });

                if (neutrals.length > 0) bottoms = neutrals;
                else if (allBottoms.length > 0) bottoms = allBottoms;
            }
            // -----------------------------

            // -----------------------------

            if (tops.length === 0 || bottoms.length === 0) {
                return {
                    success: false,
                    error: "To create an outfit, we need at least one Top and one Bottom matching your filters."
                };
            }

            // --- STYLIST SELECTION (GEMINI) ---
            // Instead of random, we ask Gemini to pick the best pair
            let selectedTop: WardrobeItem | undefined;
            let selectedBottom: WardrobeItem | undefined;
            let styleReason = "";

            try {
                const suggestion = await stylistService.selectBestOutfit(tops, bottoms, "Create a stylish look based on these items.");

                if (suggestion) {
                    selectedTop = tops.find(t => t.item_id === suggestion.top_id);
                    selectedBottom = bottoms.find(b => b.item_id === suggestion.bottom_id);
                    styleReason = suggestion.reason;
                    console.log("Stylist Choice:", styleReason);
                }
            } catch (e) {
                console.warn("Stylist failed, falling back to auto-random:", e);
            }

            // Fallback to random if Stylist explicitly failed or returned invalid IDs
            if (!selectedTop) selectedTop = tops[Math.floor(Math.random() * tops.length)];
            if (!selectedBottom) selectedBottom = bottoms[Math.floor(Math.random() * bottoms.length)];

            console.log("Final Outfit Composition:", {
                top: selectedTop.item_id,
                bottom: selectedBottom.item_id,
                reason: styleReason || "Randomly selected"
            });

            // 2. Prepare Payload
            const humanImage = userPhotoUrl || DEFAULT_MODEL_IMAGE;

            // 3. Call Edge Function (which calls Fal.ai)
            const { data, error } = await supabase.functions.invoke('virtual-try-on', {
                body: {
                    human_image_url: humanImage,
                    garment_top_url: selectedTop.image_url,
                    garment_bottom_url: selectedBottom.image_url,
                    // If we had a dress, we'd pass it as garment_url or similar depending on API
                }
            });

            if (error) {
                console.error("VTON Function Error:", error);
                // Extract more details if possible
                const detailedMsg = error.message || JSON.stringify(error);
                throw new Error(`VTON Error: ${detailedMsg}`);
            }

            if (!data?.success) {
                throw new Error(data?.error || "Generation failed.");
            }

            return {
                success: true,
                imageUrl: data.image_url
            };

        } catch (error: any) {
            console.error("Outfit Generation Service Error:", error);
            return {
                success: false,
                error: error.message || "An unexpected error occurred."
            };
        }
    }
};

// Helper to check categories safely
const isCategory = (item: WardrobeItem, categories: string[]): boolean => {
    const cat1 = item.analysis?.basic_info?.category?.toLowerCase() || '';
    const cat2 = item.analysis?.basic_info?.sub_category?.toLowerCase() || '';
    const cat3 = item.basic_info?.category?.toLowerCase() || '';
    const cat4 = item.basic_info?.sub_category?.toLowerCase() || '';

    // Check all potential category fields
    return categories.some(c =>
        cat1.includes(c) || cat2.includes(c) || cat3.includes(c) || cat4.includes(c)
    );
};
