import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Saf Veri Analiz Fonksiyonu Başlatıldı!")

// --- 1. YARDIMCI: RGB'den HEX Koda ---
function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// --- 2. YARDIMCI: RGB'den Renk İsmine (Basit Algoritma) ---
function getColorName(r: number, g: number, b: number) {
  // Temel renk paleti
  const colors = [
    { name: "Siyah", r: 0, g: 0, b: 0 },
    { name: "Beyaz", r: 255, g: 255, b: 255 },
    { name: "Gri", r: 128, g: 128, b: 128 },
    { name: "Kırmızı", r: 255, g: 0, b: 0 },
    { name: "Yeşil", r: 0, g: 255, b: 0 },
    { name: "Mavi", r: 0, g: 0, b: 255 },
    { name: "Sarı", r: 255, g: 255, b: 0 },
    { name: "Turuncu", r: 255, g: 165, b: 0 },
    { name: "Mor", r: 128, g: 0, b: 128 },
    { name: "Lacivert", r: 0, g: 0, b: 128 },
    { name: "Kahverengi", r: 165, g: 42, b: 42 },
    { name: "Bej", r: 245, g: 245, b: 220 },
    { name: "Pembe", r: 255, g: 192, b: 203 }
  ];

  // En yakın rengi bul (Euclidean Distance yöntemi)
  let closestName = null;
  let minDistance = Infinity;

  for (const color of colors) {
    const distance = Math.sqrt(
      Math.pow(r - color.r, 2) +
      Math.pow(g - color.g, 2) +
      Math.pow(b - color.b, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestName = color.name;
    }
  }
  return closestName;
}

// --- 3. YARDIMCI: Etiket İşleme (Null dönecek şekilde) ---
function processLabels(labels: any[]) {
  const descriptions = labels.map(l => l.description.toLowerCase());
  
  // Başlangıç değerleri NULL (Varsayılan değer yok)
  let main = null;
  let sub = null;
  let detail = null;
  let material = null;
  let pattern = null;
  let fit = null;

  // --- KATEGORİ MANTIĞI ---
  if (descriptions.some(d => d.includes('top') || d.includes('shirt') || d.includes('blouse') || d.includes('sweater') || d.includes('jacket') || d.includes('hoodie'))) {
    main = "Üst Giyim";
    if (descriptions.includes('t-shirt') || descriptions.includes('tee')) sub = "Tişört";
    else if (descriptions.includes('shirt') || descriptions.includes('button')) sub = "Gömlek";
    else if (descriptions.includes('sweater') || descriptions.includes('jumper')) sub = "Kazak";
    else if (descriptions.includes('hoodie')) sub = "Kapüşonlu";
    else if (descriptions.includes('jacket') || descriptions.includes('coat')) sub = "Ceket/Mont";
    else if (descriptions.includes('blouse')) sub = "Bluz";
  } 
  else if (descriptions.some(d => d.includes('pant') || d.includes('jean') || d.includes('trouser') || d.includes('short') || d.includes('skirt'))) {
    main = "Alt Giyim";
    if (descriptions.includes('jeans') || descriptions.includes('denim')) sub = "Kot Pantolon";
    else if (descriptions.includes('shorts')) sub = "Şort";
    else if (descriptions.includes('skirt')) sub = "Etek";
    else sub = "Pantolon";
  }
  else if (descriptions.some(d => d.includes('shoe') || d.includes('sneaker') || d.includes('boot') || d.includes('sandal') || d.includes('heel'))) {
    main = "Ayakkabı";
    if (descriptions.includes('sneaker')) sub = "Spor Ayakkabı";
    else if (descriptions.includes('boot')) sub = "Bot";
    else if (descriptions.includes('sandal')) sub = "Sandalet";
    else sub = "Ayakkabı";
  }
  else if (descriptions.includes('bag') || descriptions.includes('handbag') || descriptions.includes('backpack')) {
    main = "Aksesuar";
    sub = "Çanta";
  }

  // Detay Tespiti
  if (descriptions.some(d => d.includes('v-neck'))) detail = "V Yaka";
  else if (descriptions.some(d => d.includes('crew neck') || d.includes('round neck'))) detail = "Bisiklet Yaka";
  else if (descriptions.some(d => d.includes('polo'))) detail = "Polo Yaka";
  else if (descriptions.some(d => d.includes('sleeveless'))) detail = "Kolsuz";
  else if (descriptions.some(d => d.includes('long sleeve'))) detail = "Uzun Kol";

  // --- MATERYAL ---
  if (descriptions.includes('denim')) material = "Denim";
  else if (descriptions.includes('leather')) material = "Deri";
  else if (descriptions.includes('cotton')) material = "Pamuk";
  else if (descriptions.includes('wool') || descriptions.includes('knitwear')) material = "Yün/Örgü";
  else if (descriptions.includes('silk')) material = "İpek";
  else if (descriptions.includes('linen')) material = "Keten";
  else if (descriptions.includes('polyester')) material = "Polyester";

  // --- DESEN ---
  if (descriptions.includes('plaid') || descriptions.includes('tartan')) pattern = "Ekose";
  else if (descriptions.includes('stripe') || descriptions.includes('striped')) pattern = "Çizgili";
  else if (descriptions.includes('floral') || descriptions.includes('flower')) pattern = "Çiçekli";
  else if (descriptions.includes('dot') || descriptions.includes('polka')) pattern = "Puantiye";
  else if (descriptions.includes('camouflage')) pattern = "Kamuflaj";
  // Vision API genelde "Pattern" kelimesini düz renk olmayan her şey için kullanır, bu yüzden "Solid" yoksa desenli diyemeyiz, null bırakıyoruz.

  // --- FIT (KESİM) ---
  if (descriptions.includes('slim fit')) fit = "Slim Fit";
  else if (descriptions.includes('oversized') || descriptions.includes('baggy')) fit = "Oversize";
  else if (descriptions.includes('skinny')) fit = "Skinny";

  return { 
    classification: { main, sub, detail }, 
    attributes: { material, pattern, fit } 
  };
}

// --- ANA FONKSİYON ---

serve(async (req) => {
  // CORS Headerları
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }})
  }

  try {
    const formData = await req.formData()
    const imageFile = formData.get('file') as File 

    if (!imageFile) throw new Error('Dosya bulunamadı');

    // Base64 Hazırlığı
    const arrayBuffer = await imageFile.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let binaryString = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    const base64Image = btoa(binaryString);

    // Supabase Upload
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const uniqueId = crypto.randomUUID();
    const fileName = `${uniqueId}_${imageFile.name || 'img.jpg'}`
    
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('uploads')
      .upload(fileName, imageFile, { contentType: imageFile.type, upsert: false })

    if (storageError) throw storageError

    // Resim URL'ini al
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);

    // Google Vision API İsteği
    const googleApiKey = Deno.env.get('GOOGLE_VISION_API_KEY')
    const googleApiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`

    const googleResponse = await fetch(googleApiUrl, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: "LABEL_DETECTION", maxResults: 20 },
              { type: "IMAGE_PROPERTIES" }
            ]
          }
        ]
      })
    })

    const googleJson = await googleResponse.json()
    const result = googleJson.responses[0];
    const labels = result.labelAnnotations || [];

    // --- VERİYİ İŞLEME ---
    
    // 1. Etiket Analizi
    const processed = processLabels(labels);

    // 2. Renk Analizi
    const dominantColors = result.imagePropertiesAnnotation?.dominantColors?.colors || [];
    const primaryColorObj = dominantColors.sort((a, b) => b.score - a.score)[0]?.color;
    const accentColorObj = dominantColors[1]?.color;

    // Renk verisi yoksa null dönmeli
    let colorAnalysis = {
        dominant_color_name: null,
        dominant_hex: null,
        accent_hex: null
    };

    if (primaryColorObj) {
        const r = primaryColorObj.red || 0;
        const g = primaryColorObj.green || 0;
        const b = primaryColorObj.blue || 0;
        colorAnalysis.dominant_hex = rgbToHex(r, g, b);
        colorAnalysis.dominant_color_name = getColorName(r, g, b);
    }

    if (accentColorObj) {
        colorAnalysis.accent_hex = rgbToHex(accentColorObj.red || 0, accentColorObj.green || 0, accentColorObj.blue || 0);
    }

    // 3. Final JSON
    const finalResponse = {
      item_id: uniqueId,
      image_url: publicUrl,
      classification: {
        main_category: processed.classification.main,
        sub_category: processed.classification.sub,
        detail_type: processed.classification.detail
      },
      color_analysis: colorAnalysis,
      attributes: {
        material: processed.attributes.material,
        pattern: processed.attributes.pattern,
        fit: processed.attributes.fit
      },
      raw_tags: labels.map(l => l.description)
    };

    return new Response(JSON.stringify(finalResponse), {
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
      status: 500,
    })
  }
})