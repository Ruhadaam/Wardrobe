import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Gemini Gardırop Analizörü V7 (Model: Gemini 2.0 Flash Exp) Başlatıldı");

// --- 1. KISITLAMA LİSTELERİ (SENİN BELİRLEDİĞİN YAPIDA) ---
const VALID_OPTIONS = {
  category: [
    "top",
    "bottom",
    "outerwear",
    "shoes",
    "accessory"
  ],
  sub_category: {
    top: [
      "tshirt",
      "longsleeve",
      "shirt",
      "polo",
      "hoodie",
      "sweatshirt",
      "knitwear",
      "tanktop"
    ],
    bottom: [
      "jeans",
      "trousers",
      "shorts",
      "sweatpants",
      "leggings",
      "skirt"
    ],
    outerwear: [
      "jacket",
      "coat",
      "parka",
      "blazer",
      "cardigan",
      "windbreaker"
    ],
    shoes: [
      "sneakers",
      "boots",
      "loafers",
      "sandals",
      "heels",
      "running_shoes"
    ],
    accessory: [
      "cap",
      "beanie",
      "scarf",
      "bag",
      "watch",
      "belt",
      "sunglasses"
    ]
  },
  colors: [
    "black",
    "white",
    "grey",
    "blue",
    "navy",
    "red",
    "green",
    "yellow",
    "brown",
    "beige",
    "cream",
    "pink",
    "purple",
    "orange"
  ],
  style: [
    "casual",
    "streetwear",
    "sport",
    "formal",
    "smart_casual",
    "minimal"
  ],
  season: [
    "summer",
    "winter",
    "spring",
    "autumn",
    "all_seasons"
  ],
  material: [
    "cotton",
    "denim",
    "wool",
    "leather",
    "polyester",
    "linen",
    "synthetic",
    "nylon",
    "knit"
  ],
  fit: [
    "oversize",
    "regular",
    "slim",
    "wide",
    "relaxed"
  ],
  formality: [
    "casual",
    "smart_casual",
    "formal"
  ],
  pattern: [
    "plain",
    "striped",
    "checked",
    "graphic",
    "logo",
    "camouflage"
  ],
  features: [
    "hoodie",
    "zipper",
    "buttons",
    "pockets",
    "drawstring",
    "collar",
    "elastic"
  ]
};

serve(async (req) => {
  // CORS Yönetimi
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) throw new Error("GEMINI_API_KEY eksik!");

    // --- Dosya Alma ve Base64 Çevirme ---
    const formData = await req.formData();
    const imageFile = formData.get('file');

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error('Dosya yüklenemedi veya geçersiz format.');
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';

    // Büyük dosyalar için chunking gerekebilir ama Edge Function limitleri dahilinde bu yöntem çalışır
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64Image = btoa(binaryString);

    // --- GEMINI API PROMPT HAZIRLIĞI ---
    const modelVersion = "gemini-2.0-flash";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent?key=${geminiKey}`;

    // Prompt içinde listeleri JSON string olarak veriyoruz ki model ne seçeceğini bilsin
    const promptText = `
      Sen uzman bir moda asistanısın. Bu fotoğraftaki kıyafeti analiz et.
      
      GÖREV:
      Aşağıdaki JSON şemasını doldur. Ancak değerleri kafana göre yazma, SADECE aşağıda verdiğim "VALID_OPTIONS" listelerinden seç.

      KURALLAR:
      1. "category" alanını seçtikten sonra, "sub_category" alanını sadece o kategoriye ait listeden seçmelisin. (Örn: category "top" ise, sub_category "jeans" OLAMAZ).
      2. "colors" ve "season" için çoklu seçim yapabilirsin (Array).
      3. Renkler için "colors" listesinden en baskın olanları seç.
      4. Sadece saf JSON döndür. Markdown block kullanma.

      KULLANABİLECEĞİN DEĞERLER (REFERANS):
      ${JSON.stringify(VALID_OPTIONS)}

      İSTENEN JSON FORMATI:
      {
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

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: promptText
            },
            {
              inline_data: {
                mime_type: imageFile.type || "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.2 // Daha tutarlı seçimler için temperature'ı düşürdüm
      }
    };

    // --- API Request ---
    const googleResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      throw new Error(`Google API Hatası (${googleResponse.status}): ${errorText}`);
    }

    const googleJson = await googleResponse.json();
    const candidate = googleJson.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidate) throw new Error("Google boş cevap döndü.");

    // Temizlik
    const cleanText = candidate.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanText);

    console.log("--- GEMINI ANALİZ SONUCU (RAW) ---");
    console.log(JSON.stringify(parsedData, null, 2)); // Okunaklı yazdırmak için stringify kullanıyoruz

    // -------------------
    // --- Yanıt ---
    return new Response(JSON.stringify({
      success: true,
      item_id: crypto.randomUUID(), // Rastgele bir ID verelim
      image_url: "", // Resim yüklemedik, gerekirse frontend zaten kendi yüklüyor
      analysis: parsedData
    }), {
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error("Backend Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*'
      },
      status: 500
    });
  }
});