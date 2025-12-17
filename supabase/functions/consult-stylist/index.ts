// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', } })
    }
    try {
        // Debugging Request
        console.log("Request Method:", req.method);
        console.log("Content-Type:", req.headers.get("content-type"));

        const rawBody = await req.text();
        console.log("Raw Request Body (First 500 chars):", rawBody.substring(0, 500));

        // Attempt to parse
        let candidates, context;
        try {
            const body = JSON.parse(rawBody);
            candidates = body.candidates;
            context = body.context;
        } catch (e) {
            console.error("JSON Parse Error on Request Body:", e);
            throw new Error(`Invalid JSON Body: ${e.message}`);
        }
        if (!GEMINI_API_KEY) {
            throw new Error("Missing GEMINI_API_KEY")
        }
        // Construct Prompt
        const prompt = `
      You are a professional fashion stylist. I have a list of clothing items (Tops, Bottoms, Shoes, Accessories, etc.).
      
      Your Goal: 
      1. MANDATORY: Select exactly one Top and one Bottom to create the base outfit.
      2. OPTIONAL: If available and suitable, select one pair of Shoes and any number of Accessories to complete the look.
      
      Context/Occasion: "${context}"
      
      Rules:
      1. CRITICAL: You MUST strictly adhere to the "Context/Occasion" requirements.
         - If the context specifies a "Color Preference", you MUST prioritize items that match that color family.
         - If the context specifies a "Season", you MUST select items appropriate for that season (or "all_seasons").
      2. Color coordination is key.
      3. Style matching is key.
      4. If you CANNOT find a valid Top and Bottom combination that works well together AND satisfies the Context/Occasion, return "selection": null and provide a "message" explanation.
      5. Do NOT force a bad combination just to return something.
      6. Return ONLY a JSON object. No markdown.
      7. Do NOT provide any explanation or reason for the selection. Only the IDs.
      
      Candidates:
      ${JSON.stringify(candidates)}
      
      Response Format (Success):
      {
        "selection": {
          "top_id": "ID_OF_TOP",
          "bottom_id": "ID_OF_BOTTOM",
          "shoes_id": "ID_OF_SHOES (or null)",
          "accessory_ids": ["ID_1", "ID_2"] (or [])
        }
      }
      Response Format (Failure):
      {
        "selection": null,
        "message": "Reason why no outfit could be created (e.g., 'No matching bottom found for the available tops')."
      }
    `;
        // Call Gemini API (using the REST API for simplicity without SDK dependency issues in Deno)
        // Updated to Gemini 2.0 Flash as requested
        // Updated to Gemini 1.5 Flash for stability
        const modelVersion = "gemini-1.5-flash";
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const result = await response.json();
        // Parse Gemini Response
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("Gemini Raw Response Object:", JSON.stringify(result));
        if (!textResponse) {
            throw new Error(`Gemini API Error: ${JSON.stringify(result)}`);
        }
        console.log("Gemini Text:", textResponse);

        // Robust JSON extraction: Find the first '{' and last '}'
        const firstBrace = textResponse.indexOf('{');
        const lastBrace = textResponse.lastIndexOf('}');

        let jsonStr = textResponse;
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = textResponse.substring(firstBrace, lastBrace + 1);
        } else {
            // Fallback cleanup if braces not found (unlikely for valid JSON)
            jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        }

        const selectionData = JSON.parse(jsonStr);
        return new Response(
            JSON.stringify(selectionData),
            { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' } },
        )
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' }, status: 400 },
        )
    }
})