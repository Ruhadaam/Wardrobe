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
import { wardrobeService } from "../../services/wardrobeService";
import { useAuth } from "../../providers/AuthProvider";



// Gardırop ögelerini ana kategoriye göre gruplayan yardımcı fonksiyon
const groupItemsByCategory = (items: WardrobeItem[]) => {
  return items.reduce((acc, item) => {
    const categoryValue = item.analysis?.basic_info?.category
      || item.basic_info?.category
      || item.classification?.main_category
      || null;
    const category = categoryValue && categoryValue.trim()
      ? categoryValue
      : 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);
};


export default function WardrobePage() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]); // Başlangıçta boş array
  const [groupedItems, setGroupedItems] = useState<Record<string, WardrobeItem[]>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadItems();
    }
  }, [user]);

  useEffect(() => {
    setGroupedItems(groupItemsByCategory(items));
  }, [items]);

  const loadItems = async () => {
    try {
      if (!user) return;
      setIsLoading(true);
      const data = await wardrobeService.fetchItems(user.id);

      // Map DB rows back to WardrobeItem shape for UI compatibility
      const mappedItems: WardrobeItem[] = data.map((row: any) => {
        // Use the saved JSON but ensure ID and Image URL are from DB
        const analysis = row.analysis_json.analysis || row.analysis_json; // Handle potential wrapping
        return {
          ...row.analysis_json,
          item_id: row.id,
          image_url: row.image_url,
          analysis: analysis
        };
      });

      setItems(mappedItems);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error loading wardrobe',
        text2: 'Could not fetch your items.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!user) {
      Toast.show({ type: 'error', text1: 'Please sign in to add items.' });
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'You must grant access to the gallery to add clothes.',
        position: 'top',
      });
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8, // Slightly reduced quality for faster uploads
    });

    if (pickerResult.canceled) {
      return;
    }

    const imageUri = pickerResult.assets[0].uri;

    setIsAnalyzing(true);

    Toast.show({
      type: 'info',
      text1: 'Processing...',
      text2: 'Analyzing and saving to your wardrobe.',
      position: 'top',
      visibilityTime: 4000,
    });

    try {
      // 1. Analyze
      const visionItem = await visionService.analyzeImage(imageUri);

      // 2. Upload Image
      const publicUrl = await wardrobeService.uploadImage(user.id, imageUri);

      // 3. Save to DB
      const savedItem = await wardrobeService.addItem(user.id, visionItem, publicUrl);

      // 4. Update UI
      // Construct the item for local state immediately
      const newItem: WardrobeItem = {
        ...visionItem,
        item_id: savedItem.id,
        image_url: publicUrl,
      };

      setItems(prevItems => [newItem, ...prevItems]);

      const categoryValue = newItem.analysis?.basic_info?.category || newItem.basic_info?.category || newItem.classification?.main_category || null;
      const subCategoryValue = newItem.analysis?.basic_info?.sub_category || newItem.basic_info?.sub_category || newItem.classification?.sub_category || null;

      const category = categoryValue ? categoryValue : '';
      const subCategory = subCategoryValue ? subCategoryValue : 'Clothing';
      const categoryText = category ? `${category} / ${subCategory}` : subCategory;

      Toast.show({
        type: 'success',
        text1: 'Saved!',
        text2: `${categoryText} added to your wardrobe.`,
        position: 'top',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error("Error occurred during process:", error);
      Toast.show({
        type: 'error',
        text1: 'Oops! Something went wrong',
        text2: 'Could not save the item. Please try again.',
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
    <View className="flex-1 bg-slate-900" style={{ paddingTop: top }}>
      {/* Header */}
      <View className="px-5 pt-6 pb-5 bg-transparent">
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-4xl font-black font-inter-black text-white mb-1 tracking-tight shadow-cyan-500/50 shadow-lg">
              Wardrobe
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <Text className="text-sm font-medium font-inter-medium text-slate-400">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleAddItem}
            className="flex-row items-center justify-center bg-cyan-500 rounded-2xl px-5 py-3.5"
            activeOpacity={0.85}
            style={{
              // iOS shadow
              shadowColor: '#06b6d4',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 15,
              // Android shadow
              elevation: 10,
              // Glow effect simulation
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            <Ionicons name="add-circle" size={22} color="white" />
            <Text className="text-white font-bold font-inter-bold ml-2 text-base">New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Gardırop İçeriği */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }} // Increased padding for floating tab bar
      >
        {Object.keys(groupedItems).length === 0 && !isAnalyzing ? (
          <View className="flex-1 justify-center items-center px-6 mt-32">
            <View
              className="w-32 h-32 rounded-full bg-slate-800 items-center justify-center mb-6 border border-slate-700"
              style={{
                shadowColor: '#06b6d4',
                shadowOffset: { width: 10, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <MaterialIcons name="checkroom" size={64} color="#22d3ee" />
            </View>
            <Text className="text-2xl font-bold font-inter-bold text-white mb-2">Your Wardrobe is Empty</Text>
            <Text className="text-base text-slate-400 text-center leading-6">
              Start building a beautiful wardrobe{'\n'}by adding your first item!
            </Text>
            <TouchableOpacity
              onPress={handleAddItem}
              className="mt-8 bg-cyan-500 rounded-xl px-6 py-3"
              style={{
                // iOS shadow
                shadowColor: '#06b6d4',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                // Android shadow
                elevation: 8,
              }}
            >
              <Text className="text-white font-semibold font-inter-semibold text-base">Add First Item</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-4">
            {Object.entries(groupedItems).map(([category, categoryItems], categoryIndex) => (
              <View key={category} className="mb-10">
                <View className="px-5 mb-5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      className="h-8 w-1.5 rounded-full"
                      style={{
                        backgroundColor: ['#22d3ee', '#e879f9', '#34d399', '#facc15'][categoryIndex % 4],
                        shadowColor: ['#22d3ee', '#e879f9', '#34d399', '#facc15'][categoryIndex % 4],
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 6,
                      }}
                    />
                    <Text className="text-2xl font-black font-inter-black text-white tracking-tight shadow-sm">{category}</Text>
                  </View>
                  <View className="bg-slate-800 border border-slate-700 rounded-full px-3 py-1.5 shadow-sm">
                    <Text className="text-xs font-bold font-inter-bold text-slate-300">
                      {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
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
                      className="rounded-3xl overflow-hidden bg-slate-800 m-2"
                      style={{
                        width: itemWidth,
                        marginRight: index < categoryItems.length - 1 ? gapBetweenItems : 0,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        // Enhanced shadow for premium feel
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 6,
                      }}
                      activeOpacity={0.9}
                    >
                      <View className="relative">
                        <Image
                          source={{ uri: item.image_url }}
                          className="w-full"
                          style={{ aspectRatio: 3 / 4 }}
                          resizeMode="cover"
                        />
                        <View className="absolute top-3 right-3 bg-black/60 rounded-full px-2.5 py-1 backdrop-blur-md border border-white/10">
                          {(item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color) && (
                            <Text className="text-white text-xs font-semibold font-inter-semibold capitalize">
                              {item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color}
                            </Text>
                          )}
                        </View>
                      </View>

                      <View className="p-4 bg-slate-800">
                        <Text className="text-lg font-bold font-inter-bold text-white mb-2" numberOfLines={1}>
                          {item.analysis?.basic_info?.sub_category || item.basic_info?.sub_category || item.classification?.sub_category || 'Clothing'}
                        </Text>

                        <View className="flex-row flex-wrap gap-1.5">
                          {(item.analysis?.attributes?.material || item.attributes?.material) && (
                            <View className="bg-cyan-900/50 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold font-inter-bold text-cyan-300 capitalize">
                                {item.analysis?.attributes?.material || item.attributes?.material}
                              </Text>
                            </View>
                          )}
                          {(item.analysis?.attributes?.style || item.attributes?.style) && (
                            <View className="bg-fuchsia-900/50 border border-fuchsia-500/30 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold font-inter-bold text-fuchsia-300 capitalize">
                                {item.analysis?.attributes?.style || item.attributes?.style}
                              </Text>
                            </View>
                          )}
                          {((item.analysis?.visual_details?.pattern && item.analysis.visual_details.pattern !== 'plain') || (item.visual_details?.pattern && item.visual_details.pattern !== 'plain')) && (
                            <View className="bg-violet-900/50 border border-violet-500/30 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold font-inter-bold text-violet-300 capitalize">
                                {item.analysis?.visual_details?.pattern || item.visual_details?.pattern}
                              </Text>
                            </View>
                          )}
                          {(item.analysis?.context?.formality || item.context?.formality) && (
                            <View className="bg-amber-900/50 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold font-inter-bold text-amber-300 capitalize">
                                {item.analysis?.context?.formality || item.context?.formality}
                              </Text>
                            </View>
                          )}
                          {((item.analysis?.context?.seasons || item.context?.seasons || []).filter(s => s !== 'all_seasons').slice(0, 1)).map((season, idx) => (
                            <View key={idx} className="bg-emerald-900/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold font-inter-bold text-emerald-300 capitalize">
                                {season}
                              </Text>
                            </View>
                          ))}
                          {(item.analysis?.context?.seasons || item.context?.seasons || []).includes('all_seasons') && (
                            <View className="bg-emerald-900/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                              <Text className="text-xs font-bold font-inter-bold text-emerald-300 capitalize">
                                All Seasons
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
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
        >
          <View
            className="bg-slate-800 rounded-3xl p-8 items-center mx-8 border border-slate-700"
            style={{
              shadowColor: '#06b6d4',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            <LottieView
              source={require("../../assets/animations/loading-2.json")}
              autoPlay
              loop
              style={{ width: 140, height: 140 }}
            />
            <Text className="text-white font-black font-inter-black text-xl mt-2">Analyzing Outfit</Text>
            <Text className="text-slate-400 text-sm mt-2 text-center leading-relaxed px-2">
              AI is analyzing your outfit...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}