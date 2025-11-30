import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import LottieView from "lottie-react-native";
import { visionService, WardrobeItem } from "../../services/visionApi"; // visionApi.ts'den import

// Kategori isimlerini Türkçe'ye çeviren fonksiyon
const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    'top': 'Üst Giyim',
    'bottom': 'Alt Giyim',
    'shoes': 'Ayakkabı',
    'accessories': 'Aksesuar',
    'outerwear': 'Dış Giyim',
    'underwear': 'İç Giyim',
    'other': 'Diğer',
  };
  return translations[category.toLowerCase()] || category;
};

// Alt kategori isimlerini Türkçe'ye çeviren fonksiyon
const translateSubCategory = (subCategory: string): string => {
  const translations: Record<string, string> = {
    'skirt': 'Etek',
    'pants': 'Pantolon',
    'jeans': 'Kot Pantolon',
    'shorts': 'Şort',
    'dress': 'Elbise',
    't-shirt': 'Tişört',
    'shirt': 'Gömlek',
    'blouse': 'Bluz',
    'sweater': 'Kazak',
    'hoodie': 'Kapüşonlu',
    'jacket': 'Ceket',
    'coat': 'Mont',
  };
  return translations[subCategory.toLowerCase()] || subCategory;
};

// Gardırop ögelerini ana kategoriye göre gruplayan yardımcı fonksiyon
const groupItemsByCategory = (items: WardrobeItem[]) => {
  return items.reduce((acc, item) => {
    const categoryValue = item.analysis?.basic_info?.category 
      || item.basic_info?.category 
      || item.classification?.main_category 
      || null;
    const category = categoryValue && categoryValue.trim() 
      ? translateCategory(categoryValue) 
      : 'Diğer';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);
};


export default function WardrobePage() {
  const { top } = useSafeAreaInsets();
  const [items, setItems] = useState<WardrobeItem[]>([]); // Başlangıçta boş array
  const [groupedItems, setGroupedItems] = useState<Record<string, WardrobeItem[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setGroupedItems(groupItemsByCategory(items));
  }, [items]);

  const handleAddItem = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Toast.show({
        type: 'error',
        text1: 'İzin Gerekli',
        text2: 'Kıyafet eklemek için galeriye erişim izni vermelisiniz.',
        position: 'top',
      });
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (pickerResult.canceled) {
      return;
    }

    const imageUri = pickerResult.assets[0].uri;
    
    setIsAnalyzing(true);
    
    Toast.show({
      type: 'info',
      text1: 'Analiz Başlatılıyor...',
      text2: 'AI sihirbazı kıyafetini inceliyor!',
      position: 'top',
      visibilityTime: 2000,
    });
    
    try {
      const newItem = await visionService.analyzeImage(imageUri);
      setItems(prevItems => [newItem, ...prevItems]);
      
      const categoryValue = newItem.analysis?.basic_info?.category || newItem.basic_info?.category || newItem.classification?.main_category || null;
      const subCategoryValue = newItem.analysis?.basic_info?.sub_category || newItem.basic_info?.sub_category || newItem.classification?.sub_category || null;
      
      const category = categoryValue ? translateCategory(categoryValue) : '';
      const subCategory = subCategoryValue ? translateSubCategory(subCategoryValue) : 'Kıyafet';
      const categoryText = category ? `${category} / ${subCategory}` : subCategory;
      
      Toast.show({
        type: 'success',
        text1: 'İşte Bu Kadar!',
        text2: `${categoryText} gardırobuna eklendi.`,
        position: 'top',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Görsel analizi sırasında hata oluştu:", error);
      Toast.show({
        type: 'error',
        text1: 'Ups! Bir Sorun Var',
        text2: 'Kıyafetin analiz edilirken bir hatayla karşılaştık. Tekrar dener misin?',
        position: 'top',
        visibilityTime: 4000,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const screenWidth = Dimensions.get("window").width;
  const itemWidth = screenWidth * 0.45; // Kart genişliğini biraz artıralım
  const gapBetweenItems = 16; // Kartlar arası boşluk


  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: top }}>
      {/* Header */}
      <View className="px-5 pt-6 pb-5 bg-transparent">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-4xl font-black text-slate-900 mb-1">
              Gardırop
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <Text className="text-sm font-medium text-slate-500">
                {items.length} {items.length === 1 ? 'parça' : 'parça'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleAddItem}
            className="flex-row items-center justify-center bg-indigo-600 rounded-2xl px-5 py-3.5"
            activeOpacity={0.85}
            style={{
              // iOS shadow
              shadowColor: '#6366f1',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              // Android shadow
              elevation: 6,
            }}
          >
            <Ionicons name="add-circle" size={22} color="white" />
            <Text className="text-white font-bold ml-2 text-base">Yeni</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gardırop İçeriği */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {Object.keys(groupedItems).length === 0 && !isAnalyzing ? (
          <View className="flex-1 justify-center items-center px-6 mt-32">
            <View className="w-32 h-32 rounded-full bg-indigo-100 items-center justify-center mb-6">
              <MaterialIcons name="checkroom" size={64} color="#6366f1" />
            </View>
            <Text className="text-2xl font-bold text-slate-800 mb-2">Gardırobun Boş</Text>
            <Text className="text-base text-slate-500 text-center leading-6">
              İlk kıyafetini ekleyerek{'\n'}güzel bir gardırop oluşturmaya başla!
            </Text>
            <TouchableOpacity
              onPress={handleAddItem}
              className="mt-8 bg-indigo-600 rounded-xl px-6 py-3"
              style={{
                // iOS shadow
                shadowColor: '#6366f1',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                // Android shadow
                elevation: 4,
              }}
            >
              <Text className="text-white font-semibold text-base">İlk Kıyafeti Ekle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-4">
            {Object.entries(groupedItems).map(([category, categoryItems], categoryIndex) => (
              <View key={category} className="mb-10">
                <View className="px-5 mb-5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View 
                      className="h-1 w-8 rounded-full"
                      style={{
                        backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b'][categoryIndex % 4]
                      }}
                    />
                    <Text className="text-2xl font-black text-slate-900">{category}</Text>
                  </View>
                  <View className="bg-slate-100 rounded-full px-3 py-1.5">
                    <Text className="text-xs font-bold text-slate-600">
                      {categoryItems.length} {categoryItems.length === 1 ? 'parça' : 'parça'}
                    </Text>
                  </View>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
                >
                  {categoryItems.map((item, index) => (
                    <TouchableOpacity 
                      key={item.item_id} 
                      className="rounded-3xl overflow-hidden bg-white m-2"
                      style={{ 
                        width: itemWidth,
                        marginRight: index < categoryItems.length - 1 ? gapBetweenItems : 0,
                        // Çok hafif gölge
                        borderWidth: 1,
                        borderColor: '#f1f5f9',
                        // iOS shadow - minimal
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        // Android shadow - minimal
                        elevation: 1,
                      }}
                      activeOpacity={0.9}
                    >
                      <View className="relative">
                        <Image 
                          source={{ uri: item.image_url }} 
                          className="w-full"
                          style={{ aspectRatio: 3/4 }}
                          resizeMode="cover" 
                        />
                        <View className="absolute top-3 right-3 bg-black/40 rounded-full px-2.5 py-1">
                          {(item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color) && (
                            <Text className="text-white text-xs font-semibold capitalize">
                              {item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color}
                            </Text>
                          )}
                        </View>
                      </View>
                      
                      <View className="p-4 bg-white">
                        <Text className="text-lg font-bold text-slate-900 mb-2" numberOfLines={1}>
                          {translateSubCategory(item.analysis?.basic_info?.sub_category || item.basic_info?.sub_category || item.classification?.sub_category || 'Kıyafet')}
                        </Text>
                        
                        <View className="flex-row flex-wrap gap-1.5">
                          {(item.analysis?.attributes?.material || item.attributes?.material) && (
                            <View className="bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold text-indigo-700 capitalize">
                                {item.analysis?.attributes?.material || item.attributes?.material}
                              </Text>
                            </View>
                          )}
                          {(item.analysis?.attributes?.style || item.attributes?.style) && (
                            <View className="bg-pink-50 border border-pink-100 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold text-pink-700 capitalize">
                                {item.analysis?.attributes?.style || item.attributes?.style}
                              </Text>
                            </View>
                          )}
                          {((item.analysis?.visual_details?.pattern && item.analysis.visual_details.pattern !== 'plain') || (item.visual_details?.pattern && item.visual_details.pattern !== 'plain')) && (
                            <View className="bg-cyan-50 border border-cyan-100 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold text-cyan-700 capitalize">
                                {item.analysis?.visual_details?.pattern || item.visual_details?.pattern}
                              </Text>
                            </View>
                          )}
                          {(item.analysis?.context?.formality || item.context?.formality) && (
                            <View className="bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold text-amber-700 capitalize">
                                {item.analysis?.context?.formality || item.context?.formality}
                              </Text>
                            </View>
                          )}
                          {((item.analysis?.context?.seasons || item.context?.seasons || []).filter(s => s !== 'all_seasons').slice(0, 1)).map((season, idx) => (
                            <View key={idx} className="bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold text-emerald-700 capitalize">
                                {season}
                              </Text>
                            </View>
                          ))}
                          {(item.analysis?.context?.seasons || item.context?.seasons || []).includes('all_seasons') && (
                            <View className="bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold text-emerald-700 capitalize">
                                Tüm Mevsimler
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Analiz Loading Overlay */}
      {isAnalyzing && (
        <View 
          className="absolute inset-0 justify-center items-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
        >
          <View 
            className="bg-white rounded-3xl p-8 items-center mx-8"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.3,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            <LottieView
              source={require("../../assets/animations/loading.json")}
              autoPlay
              loop
              style={{ width: 140, height: 140 }}
            />
            <Text className="text-slate-900 font-black text-xl mt-2">Kıyafet İnceleniyor</Text>
            <Text className="text-slate-500 text-sm mt-2 text-center leading-relaxed px-2">
              Yapay zeka kıyafetinizi analiz ediyor...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}