import { supabase } from '../lib/supabase';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// WardrobeItem tipi - Yeni format
export interface WardrobeItem {
  item_id: string;
  image_url: string;
  success?: boolean;
  analysis: {
    basic_info: {
      category: string;
      sub_category: string;
    };
    visual_details: {
      pattern?: string;
      primary_color?: string;
      secondary_colors?: string[];
    };
    attributes?: {
      fit?: string;
      style?: string;
      material?: string;
      features?: string[];
      // Eski format desteği
      style_tags?: string[];
      pattern?: string;
    };
    context?: {
      formality?: string;
      seasons?: string[];
      // Eski format desteği
      formality_level?: number;
      occasions?: string[];
    };
  };
  // Eski format desteği (backward compatibility)
  basic_info?: {
    category: string;
    sub_category: string;
  };
  visual_details?: {
    pattern?: string;
    primary_color?: string;
    secondary_colors?: string[];
  };
  attributes?: {
    fit?: string;
    style?: string;
    material?: string;
    features?: string[];
  };
  context?: {
    formality?: string;
    seasons?: string[];
  };
  classification?: {
    main_category?: string;
    sub_category?: string;
    detail_type?: string;
  };
  color_analysis?: {
    dominant_color_name?: string;
    dominant_hex?: string;
    accent_hex?: string;
  };
}

interface UploadAndAnalyzeOptions {
  setLoading?: (loading: boolean) => void;
  setResult?: (result: any) => void;
  showAlert?: boolean;
}

/**
 * Fotoğrafı Supabase Edge Function'a gönderir ve analiz sonucunu döndürür
 * @param uri - Fotoğrafın URI'si (local file path)
 * @param options - Opsiyonel state setter'lar ve alert gösterimi
 * @returns Analiz sonucu veya hata
 */
interface EdgeFunctionResponse {
  image_url: string;
  analysis: any;
  success: boolean;
}

export const uploadAndAnalyze = async (
  uri: string,
  options?: UploadAndAnalyzeOptions
): Promise<{ data: EdgeFunctionResponse | null; error: any }> => {
  const { setLoading, setResult, showAlert = true } = options || {};

  setLoading?.(true);

  try {
    // 1. Image Optimization (keeping it for faster upload to Edge Function)
    // console.log('Orjinal fotoğraf:', uri); // Original line
    // Resmi resize ve compress et
    // 1024px genişlik/yükseklik yeterli kalitede analiz için, 
    // compress 0.7-0.8 ideal bir oran.
    const manipResult = await manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }], // Genişliği 1024 yap, yükseklik orantılı kalsın. (Veya height: 1024) - Genelde en uzun kenarı kısıtlamak daha iyi ama şimdilik width bazlı.
      // Not: Dikey fotolarda width 1024 ise height daha büyük olabilir. 
      // Ancak Expo manipulate resize işleminde sadece bir boyut verirseniz diğerini korur. 
      // Eğer çok büyük dikey foto ise (örn 3000x4000), 1024x1365'e düşer ki bu gayet iyidir.
      { compress: 0.8, format: SaveFormat.JPEG }
    );

    console.log('Optimize edilmiş fotoğraf:', manipResult.uri, 'width:', manipResult.width, 'height:', manipResult.height);

    // React Native'de FormData oluşturma
    const formData = new FormData();

    formData.append('file', {
      uri: manipResult.uri, // Optimize edilmiş URI kullanılıyor
      name: 'photo.jpg', // Sunucuda benzersiz isim zaten veriyoruz, burası önemsiz
      type: 'image/jpeg',
    } as any); // TypeScript kullanıyorsanız 'as any' gerekebilir

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-photo', {
      body: formData,
    });

    if (error) {
      console.error('Edge Function Error detected:', error);
      let errorMessage = error.message;

      if (error.context instanceof Response) {
        try {
          const text = await error.context.clone().text();
          try {
            const json = JSON.parse(text);
            errorMessage = json.message || json.error || errorMessage;
          } catch (jsonErr) {
            // If not JSON, use raw text if it's reasonably short and not HTML
            if (text && text.length < 500 && !text.includes('<html>')) {
              errorMessage = text;
            }
          }
        } catch (readErr) {
          console.error('Failed to read error response:', readErr);
        }
      }

      throw new Error(errorMessage);
    }

    console.log('Vision API Data:', data);
    setResult?.(data);

    return { data: data as EdgeFunctionResponse, error: null };
  } catch (error: any) {
    console.error('uploadAndAnalyze catch:', error);
    // If it's already an error with a message we want, keep it. 
    // Otherwise, ensure we return something useful.
    return { data: null, error };
  } finally {
    setLoading?.(false);
  }
};

/**
 * Fotoğrafı analiz edip WardrobeItem formatına dönüştürür
 */
export const analyzeImage = async (uri: string): Promise<WardrobeItem> => {
  const { data, error } = await uploadAndAnalyze(uri, { showAlert: false });

  if (error || !data) {
    throw new Error(error?.message || 'Fotoğraf analiz edilemedi');
  }

  // Edge Function returns { image_url, analysis, success }
  // We map it to WardrobeItem ensuring compatibility with both old and new formats
  return {
    analysis: data.analysis,
    image_url: data.image_url,
    item_id: '',
    // Spread for top-level backward compatibility in WardrobePage/wardrobeService
    ...(data.analysis || {})
  } as WardrobeItem;
};

// Service objesi
export const visionService = {
  analyzeImage,
  uploadAndAnalyze,
};

