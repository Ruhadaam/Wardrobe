// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FAL_KEY = Deno.env.get('FAL_KEY')

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', } })
    }

    try {
        const { human_image_url, garment_top_url, garment_bottom_url } = await req.json()

        // Log for debugging
        console.log("Received request:", { human_image_url, garment_top_url, garment_bottom_url })

        if (!FAL_KEY) {
            throw new Error("Missing FAL_KEY in Edge Function Environment Variables")
        }

        // Call Fal.ai IDM-VTON
        // Documentation: https://fal.ai/models/fal-ai/idm-vton
        // We use "fal.run" (Sync) instead of "queue.fal.run" so we wait for the result here.
        const response = await fetch("https://fal.run/fal-ai/idm-vton", {
            method: "POST",
            headers: {
                "Authorization": `Key ${FAL_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                human_image_url: human_image_url,
                garment_image_url: garment_top_url,
                description: "model wearing the garment, keeping original face and identity unchanged, high quality, photorealistic",
            }),
        });

        const result = await response.json();
        console.log("Fal.ai response:", result);

        // Parse the actual image URL from Fal.ai (IDM-VTON usually returns 'image.url')
        const generatedImageUrl = result.image?.url || result.images?.[0]?.url;

        if (!generatedImageUrl) {
            throw new Error("Fal.ai returned success but no image URL found.");
        }

        return new Response(
            JSON.stringify({
                success: true,
                image_url: generatedImageUrl
            }),
            { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }, status: 400 },
        )
    }
})
