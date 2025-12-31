import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Gemini Gardırop Analizörü V8 (BG Removal + V7 Optimized Analysis) Başlatıldı");

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- 1. KISITLAMA LİSTELERİ (V7 YAPISI) ---
// --- 1. KISITLAMA LİSTELERİ (V7 YAPISI - OPTIMIZED) ---
const SUB_CATEGORIES = {
    top: [
        "tshirt", "longsleeve", "shirt", "polo", "hoodie", "sweatshirt", "knitwear",
        "tanktop", "blouse", "vest", "crop_top", "bodysuit", "tunic"
    ],
    bottom: [
        "jeans", "trousers", "shorts", "sweatpants", "leggings", "skirt",
        "cargo_pants", "joggers", "chinos", "skort"
    ],
    outerwear: [
        "jacket", "coat", "parka", "blazer", "cardigan", "windbreaker",
        "trench_coat", "puffer", "denim_jacket", "leather_jacket", "bomber_jacket"
    ],
    shoes: [
        "sneakers", "boots", "loafers", "sandals", "heels", "running_shoes",
        "flats", "oxford", "slippers", "hiking_boots"
    ],
    accessory: [
        "cap", "beanie", "scarf", "bag", "watch", "belt", "sunglasses",
        "jewelry", "tie", "gloves", "socks", "hat"
    ],
    one_piece: [
        "dress", "jumpsuit", "romper"
    ]
};

const FORMALITY = [
    "casual", "smart_casual", "business_casual", "formal"
];

const VALID_OPTIONS = {
    category: Object.keys(SUB_CATEGORIES),
    sub_category: SUB_CATEGORIES,
    colors: [
        "black", "white", "grey", "charcoal", "blue", "navy", "teal",
        "red", "burgundy", "green", "olive", "yellow", "gold",
        "brown", "beige", "cream", "pink", "purple", "orange",
        "silver", "multicolor"
    ],
    style: [
        ...FORMALITY,
        "streetwear", "sport", "minimal", "bohemian", "vintage", "chic", "preppy"
    ],
    season: [
        "summer", "winter", "spring", "autumn", "all_seasons"
    ],
    material: [
        "cotton", "denim", "wool", "leather", "polyester", "linen", "synthetic",
        "nylon", "knit", "silk", "velvet", "satin", "suede", "viscose", "fleece", "corduroy"
    ],
    fit: [
        "oversize", "regular", "slim", "wide", "relaxed", "skinny", "cropped"
    ],
    formality: FORMALITY,
    pattern: [
        "plain", "striped", "checked", "graphic", "logo", "camouflage",
        "floral", "polka_dot", "plaid", "animal_print", "tie_dye"
    ],
    features: [
        "hoodie", "zipper", "buttons", "pockets", "drawstring", "collar",
        "elastic", "sleeveless", "v_neck", "round_neck", "embroidery"
    ]
};

serve(async (req) => {
    console.log(`[Diagnostic] Request received: ${req.method} ${req.url}`)
    console.log(`[Diagnostic] Auth Header exists: ${!!req.headers.get('Authorization')}`)

    if (req.method === 'OPTIONS') {
        console.log('[Diagnostic] Handling OPTIONS request')
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            throw new Error('No file uploaded')
        }

        if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing environment variables')
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Convert file to base64 (Safer Way for Edge Functions)
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        let binaryString = ''
        for (let i = 0; i < uint8Array.byteLength; i++) {
            binaryString += String.fromCharCode(uint8Array[i])
        }
        const base64Image = btoa(binaryString)

        // Get User ID from Auth Header (for storage path)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Authorization header is missing');
        }
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError) {
            throw new Error(`Failed to get user from token: ${userError.message}`);
        }
        const userId = user?.id || 'anonymous';

        // --- PARALLEL EXECUTION: BACKGROUND REMOVAL & ANALYSIS ---
        console.log('Starting parallel background removal & analysis...')

        const editModel = "gemini-2.5-flash-image"
        const editUrl = `https://generativelanguage.googleapis.com/v1beta/models/${editModel}:generateContent?key=${GEMINI_API_KEY}`

        const analysisModel = "gemini-2.0-flash"
        const analysisUrl = `https://generativelanguage.googleapis.com/v1beta/models/${analysisModel}:generateContent?key=${GEMINI_API_KEY}`

        const promptText = `
      Sen uzman bir moda asistanısın. Bu fotoğraftaki kıyafeti analiz et.
      
      GÖREV:
      1. ÖNCE görselin gerçekten bir KIYAFET (üst, alt, ayakkabı, aksesuar vb.) içerip içermediğini kontrol et.
      2. Eğer görsel KIYAFET DEĞİLSE (örneğin klavye, kedi, ağaç, eşya vb.), sadece şu JSON'u döndür: {"is_clothing": false, "error": "NOT_CLOTHING"}
      3. Eğer kıyafetse, aşağıdaki JSON şemasını doldur. Değerleri SADECE "VALID_OPTIONS" listelerinden seç.

      KURALLAR:
      1. "is_clothing" alanını her zaman en üste ekle (true/false).
      2. "category" alanını seçtikten sonra, "sub_category" alanını sadece o kategoriye ait listeden seçmelisin.
      3. Markdown block kullanma, sadece saf JSON.

      KULLANABİLECEĞİN DEĞERLER (REFERANS):
      ${JSON.stringify(VALID_OPTIONS)}

      İSTENEN JSON FORMATI:
      {
        "is_clothing": true,
        "basic_info": { 
          "category": "string (VALID_OPTIONS.category listesinden)", 
          "sub_category": "string (VALID_OPTIONS.sub_category içinden uygun olan)" 
        },
        "visual_details": { 
          "primary_color": "string (VALID_OPTIONS.colors listesinden)", 
          "secondary_colors": ["string (varsa diğer renkler)"], 
          "pattern": "string (VALID_OPTIONS.pattern listesinden)" 
        },
        "context": { 
          "seasons": ["string (VALID_OPTIONS.season listesinden)"], 
          "formality": "string (VALID_OPTIONS.formality listesinden)" 
        },
        "attributes": { 
          "fit": "string (VALID_OPTIONS.fit listesinden)", 
          "style": "string (VALID_OPTIONS.style listesinden)",
          "material": "string (VALID_OPTIONS.material listesinden)",
          "features": ["string (VALID_OPTIONS.features listesinden)"]
        }
      }
    `;

        const [editRes, analysisRes] = await Promise.all([
            // Stage 1: Editor (BG Removal)
            fetch(editUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Isolate the clothing item from this photo on a solid, pure white background. If there is NO clothing item in the photo, do NOT generate any image and instead return exactly this text: 'ERROR: NO_CLOTHING_FOUND'. Do not include humans, mannequins, or background objects." },
                            { inline_data: { mime_type: file.type || "image/jpeg", data: base64Image } }
                        ]
                    }],
                    safetySettings: [
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
                    ]
                })
            }),
            // Stage 2: Analysis (Multimodal)
            fetch(analysisUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: promptText },
                            { inline_data: { mime_type: file.type || "image/jpeg", data: base64Image } }
                        ]
                    }],
                    generationConfig: { response_mime_type: "application/json", temperature: 0.2 },
                    safetySettings: [
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }
                    ]
                })
            })
        ]);

        // --- HANDLE RESULTS ---
        const [editResultData, analysisResultData] = await Promise.all([editRes.json(), analysisRes.json()]);

        // Error checking for Stage 1 (Edit)
        if (editResultData.error) {
            console.error("Gemini Edit API Error:", JSON.stringify(editResultData.error))
            throw new Error(`Gemini Edit API Error: ${editResultData.error.message || 'Unknown API Error'}`)
        }

        // Error checking for Stage 2 (Analysis)
        if (analysisResultData.error) {
            console.error("Gemini Analysis API Error:", JSON.stringify(analysisResultData.error))
            throw new Error(`Gemini Analysis API Error: ${analysisResultData.error.message || 'Unknown API Error'}`)
        }

        const editCandidate = editResultData.candidates?.[0]
        const analysisText = analysisResultData.candidates?.[0]?.content?.parts?.[0]?.text

        // --- VALIDATION LAYER 1: BG REMOVAL RESULT ---
        const editCandidateText = editCandidate?.content?.parts?.[0]?.text || ""
        const editFinishReason = editCandidate?.finishReason

        if (editCandidateText.includes("Please specify what clothing item") || editCandidateText.includes("NO_CLOTHING_FOUND")) {
            return new Response(
                JSON.stringify({ success: false, error: "NO_CLOTHING", message: "No clothing item detected in the image." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        if (editFinishReason === "IMAGE_OTHER") {
            return new Response(
                JSON.stringify({ success: false, error: "FACE_DETECTED", message: "Human face detected in the image. For security and quality, please upload a photo focusing only on the clothing, without faces." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // --- VALIDATION LAYER 2: ANALYSIS RESULT ---
        if (!analysisText) {
            throw new Error(`Analysis failed to return text: ${JSON.stringify(analysisResultData)}`)
        }
        const cleanJSONText = analysisText.replace(/```json|```/g, '').trim()
        const parsedAnalysis = JSON.parse(cleanJSONText)

        if (parsedAnalysis.is_clothing === false || parsedAnalysis.error === "NOT_CLOTHING") {
            return new Response(
                JSON.stringify({ success: false, error: "NO_CLOTHING", message: "No clothing item detected in the image. Please upload a clear photo of the garment." }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // --- FINALIZE IMAGE ---
        const editContentParts = editCandidate?.content?.parts || []
        const imagePart = editContentParts.find((p: any) => p.inline_data || p.inlineData)
        const processedBase64 = imagePart?.inline_data?.data || imagePart?.inlineData?.data

        if (!processedBase64) {
            console.error("Gemini Edit Image Extraction Error:", JSON.stringify(editResultData))
            throw new Error(`Background removal image not found in response.`)
        }

        // --- IMAGE OPTIMIZATION: Convert to WebP and resize ---
        console.log(`Optimizing image before upload...`)

        // Decode base64 to binary
        const binaryProcessed = Uint8Array.from(atob(processedBase64), c => c.charCodeAt(0))

        // Use ImageMagick via Deno for optimization (WebP conversion + resize)
        // Since we're in Edge Function with limited libraries, we'll use a simpler approach:
        // Store as optimized JPEG instead of PNG (smaller size, white background works fine)

        // Convert PNG to JPEG using canvas-like approach
        // For Deno Edge Functions, we'll use a more compatible method
        let optimizedImage = binaryProcessed
        let contentType = 'image/png'
        let fileExtension = 'png'

        // Try to convert to JPEG using ImageScript (more compatible than WebP)
        try {
            // Import ImageScript for image processing
            const { Image } = await import('https://deno.land/x/imagescript@1.3.0/mod.ts')

            // Decode the PNG
            const img = await Image.decode(binaryProcessed)

            // Resize to max 800px (maintaining aspect ratio)
            const maxSize = 800
            if (img.width > maxSize || img.height > maxSize) {
                const scale = Math.min(maxSize / img.width, maxSize / img.height)
                img.resize(Math.round(img.width * scale), Math.round(img.height * scale))
                console.log(`Resized to ${img.width}x${img.height}`)
            }

            // Encode as JPEG with 85% quality (widely supported, good compression)
            // ImageScript uses encodeJPEG(quality) where quality is 1-100
            optimizedImage = await img.encodeJPEG(85)
            contentType = 'image/jpeg' 
            fileExtension = 'jpg'
            console.log(`Converted to JPEG. Size: ${optimizedImage.length} bytes`)
        } catch (imgError) {
            // Fallback: use original PNG if ImageScript fails
            console.warn('ImageScript optimization failed, using original PNG:', imgError)
            optimizedImage = binaryProcessed
        }

        console.log(`Uploading optimized image to Supabase Storage for user: ${userId}...`)
        const fileName = `${Date.now()}_refined.${fileExtension}`
        const filePath = `${userId}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('uploads')
            .upload(filePath, optimizedImage, {
                contentType: contentType,
                upsert: false
            })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(filePath)

        return new Response(
            JSON.stringify({
                success: true,
                item_id: crypto.randomUUID(),
                image_url: publicUrl,
                analysis: parsedAnalysis
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Final Error Payload:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
