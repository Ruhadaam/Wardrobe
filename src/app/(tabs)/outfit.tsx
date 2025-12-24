import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWardrobe } from '../../providers/WardrobeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { WardrobeItem } from '../../services/visionApi';
import LottieView from 'lottie-react-native';
import Header from "../../components/Header";

import { Ionicons } from '@expo/vector-icons';
import { Modal, Image, ActivityIndicator, Alert } from 'react-native';
import { stylistService, StylistSelection } from '../../services/stylistService';
import { wardrobeService } from '../../services/wardrobeService';
import { formatLabel } from '../../utils/textUtils';
import OutfitViewModal from '../../components/OutfitViewModal';

const { width } = Dimensions.get('window');
import { useRouter } from 'expo-router';
import { RevenueCatService } from '../../lib/revenuecat';

// Define available filter categories
type FilterCategory = 'season' | 'formality' | 'style' | 'color';

interface FilterGroup {
  id: FilterCategory;
  label: string;
  tags: string[];
}

const DEFAULT_FILTER_GROUPS: FilterGroup[] = [
  { id: 'season', label: 'SEASON', tags: ['Spring', 'Summer', 'Autumn', 'Winter', 'All Seasons'] },
  { id: 'style', label: 'STYLE', tags: ["casual", "smart_casual", "business_casual", "formal", "streetwear", "sport", "minimal", "bohemian", "vintage", "chic", "preppy"] },
  { id: 'color' as any, label: 'COLOR TONE', tags: ['Any', 'Black', 'White', 'Blue', 'Red', 'Beige', 'Grey'] },
];

const STYLE_IMAGES: Record<string, string> = {
  'casual': 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=500',
  'smart_casual': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=500',
  'business_casual': 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&q=80&w=500',
  'formal': 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=500',
  'streetwear': 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=500',
  'sport': 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&q=80&w=500',
  'minimal': 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=500',
  'bohemian': 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=500',
  'vintage': 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=500',
  'chic': 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&q=80&w=500',
  'preppy': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=500',
};

const COLOR_MAP: Record<string, string> = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Blue': '#3A1AEB',
  'Red': '#EF4444',
  'Beige': '#F5F5DC',
  'Grey': '#808080',
};

export default function OutfitPage() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, loading } = useWardrobe(); // Use global state
  const router = useRouter();

  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [todayOutfitCount, setTodayOutfitCount] = useState<number>(0);

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    const proStatus = await RevenueCatService.isPro();
    setIsPro(proStatus);

    if (!proStatus && user?.id) {
      const count = await wardrobeService.getTodayOutfitCount(user.id);
      setTodayOutfitCount(count);
    }
  };

  // State for all available tags grouped by category
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(DEFAULT_FILTER_GROUPS);

  // Check wardrobe counts
  const topsCount = items.filter(i => {
    const cat = (i.analysis?.basic_info?.category || i.basic_info?.category || '').toLowerCase();
    return cat === 'top' || cat === 'tops'; // Geniş kontrol
  }).length;

  const bottomsCount = items.filter(i => {
    const cat = (i.analysis?.basic_info?.category || i.basic_info?.category || '').toLowerCase();
    return cat === 'bottom' || cat === 'bottoms' || cat === 'pants' || cat === 'trousers' || cat === 'shorts' || cat === 'skirt';
  }).length;

  const isLocked = topsCount < 3 || bottomsCount < 3;

  // State for Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [selectedOutfitItems, setSelectedOutfitItems] = useState<WardrobeItem[]>([]);

  // State for selected tags: Record<Category, Set<Tag>>
  const [selectedFilters, setSelectedFilters] = useState<Record<FilterCategory, string[]>>({
    season: [],
    formality: [],
    style: [],
    color: []
  });

  const toggleFilter = (category: FilterCategory, tag: string) => {
    setSelectedFilters(prev => {
      const currentTags = prev[category];
      const isSelected = currentTags.includes(tag);

      // Single selection: if already selected, deselect. If not, replace entire array with new tag.
      let newTags: string[];
      if (isSelected) {
        newTags = [];
      } else {
        newTags = [tag];
      }

      return { ...prev, [category]: newTags };
    });
  };

  const filteredItems = React.useMemo(() => {
    const hasAnyFilter = Object.values(selectedFilters).some(tags => tags.length > 0);
    if (!hasAnyFilter) return items;

    return items.filter(item => {
      // 1. Season
      if (selectedFilters.season.length > 0) {
        const itemSeasons = (item.analysis?.context?.seasons || item.context?.seasons || []).map((s: string) => s.toLowerCase());
        const hasMatch = selectedFilters.season.some(tag => {
          const lowerTag = tag.toLowerCase();
          return itemSeasons.includes(lowerTag) || itemSeasons.includes(lowerTag.replace(' ', '_'));
        });
        const isAllSeasonsItem = itemSeasons.includes('all seasons') || itemSeasons.includes('all season') || itemSeasons.includes('all_seasons') || itemSeasons.includes('all_season');
        if (!hasMatch && !isAllSeasonsItem) return false;
      }

      // 2. Style
      if (selectedFilters.style.length > 0) {
        const val = (item.analysis?.attributes?.style || item.attributes?.style || '').toLowerCase();
        if (!selectedFilters.style.some(s => s.toLowerCase() === val)) return false;
      }

      // 4. Color Tone
      if (selectedFilters['color' as any]?.length > 0) {
        const selectedColor = selectedFilters['color' as any][0].toLowerCase();
        if (selectedColor !== 'any') {
          const itemColor = (item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color || '').toLowerCase();
          if (itemColor !== selectedColor) return false;
        }
      }

      return true;
    });
  }, [items, selectedFilters]);



  const handleGenerate = async () => {
    if (filteredItems.length === 0) {
      Alert.alert("No items", "Please select fewer filters or add more clothes.");
      return;
    }

    if (isPro === false && todayOutfitCount >= 2) {
      Alert.alert(
        "Daily Limit Reached",
        "Free accounts have a limit of 2 outfits per day. Upgrade to Pro for limitless creations!",
        [
          { text: "Later", style: "cancel" },
          { text: "Upgrade to Pro", onPress: () => router.push('/paywall') }
        ]
      );
      return;
    }

    setIsGenerating(true);
    console.log(`Generating outfit with ${filteredItems.length} candidate items...`);

    try {
      // Construct a detailed context from selected filters
      const contextParts: string[] = [];
      if (selectedFilters.season.length > 0) contextParts.push(`Season: ${selectedFilters.season.map(s => formatLabel(s)).join(', ')}`);
      if (selectedFilters.style.length > 0) contextParts.push(`Style: ${selectedFilters.style.map(s => formatLabel(s)).join(', ')}`);
      if (selectedFilters.color.length > 0) contextParts.push(`Color Preference: ${selectedFilters.color.map(c => formatLabel(c)).join(', ')}`);

      const contextString = contextParts.length > 0
        ? `User Preferences: ${contextParts.join('; ')}. Create a cohesive outfit based on these requirements.`
        : "Create a stylish and coordinated outfit.";

      // Call the stylist service with filtered items
      const selection = await stylistService.generateOutfit(filteredItems, contextString);

      if (selection) {
        console.log("Stylist Selection:", selection);

        // Resolve IDs to actual WardrobeItem objects
        const resolvedItems: WardrobeItem[] = [];
        const requiredIds = [selection.top_id, selection.bottom_id, selection.shoes_id, ...(selection.accessory_ids || [])].filter(Boolean);

        requiredIds.forEach(id => {
          const found = items.find(i => i.item_id === id);
          if (found) resolvedItems.push(found);
        });

        setSelectedOutfitItems(resolvedItems);
        setResultModalVisible(true);

        // Auto-save the generated outfit to history
        if (resolvedItems.length > 0) {
          try {
            if (user?.id) {
              console.log("Auto-saving outfit to history...");
              await wardrobeService.saveOutfit(user.id, resolvedItems);
            }
          } catch (err) {
            console.error("Failed to auto-save outfit:", err);
          }
        }
      } else {
        // The service (or backend) returned null, likely due to inability to match.
        // If the backend returns a specific "message" in the failure case, we should ideally catch it.
        // Current stylistService returns null on error/failure. 
        // We might need to update stylistService to return { selection: ..., error: ... } for better granularity later.
        // For now, generic message or we can assume it's a matching issue.
        Alert.alert("Notice", "Stylist could not find a suitable combination with these items/filters. Please add more items (e.g. Shoes or Bottoms) or relax filters.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to generate outfit.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getSubCategory = (item: WardrobeItem) => {
    return item.analysis?.basic_info?.sub_category || item.basic_info?.sub_category || 'Item';
  };

  return (
    <Animated.View entering={FadeInRight.duration(400)} className="flex-1 bg-white">
      {Platform.OS === 'ios' && <Header />}

      <View className="px-6 pt-6 pb-4">
        <Text className="text-3xl font-black font-inter-black text-slate-900 mb-1 tracking-tight">
          Outfit Preferences
        </Text>
        <Text className="text-base font-medium font-inter-medium text-slate-500">
          How do you want to look today?
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 130 }}>

        {/* Filter Groups */}
        {filterGroups.map((group) => (
          <View key={group.id} className="mb-8">
            <View className="px-6 flex-row items-center gap-2 mb-4">
              <Ionicons
                name={
                  group.id === 'season' ? 'cloudy-night-outline' :
                    group.id === 'style' ? 'shirt-outline' :
                      'color-palette-outline'
                }
                size={18}
                color="#64748b"
              />
              <Text className="text-sm font-black font-inter-black text-slate-400 uppercase tracking-widest">
                {group.label}
              </Text>
            </View>

            {group.id === 'season' ? (
              <View className="px-6 flex-row flex-wrap justify-between gap-y-4">
                {group.tags.map((tag) => {
                  const isSelected = selectedFilters[group.id].includes(tag);
                  let iconName: any = 'sunny-outline';
                  if (tag === 'Spring') iconName = 'flower-outline';
                  else if (tag === 'Summer') iconName = 'sunny-outline';
                  else if (tag === 'Autumn') iconName = 'leaf-outline';
                  else if (tag === 'Winter') iconName = 'snow-outline';
                  else if (tag === 'All Seasons') iconName = 'infinite-outline';

                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleFilter(group.id, tag)}
                      className={`flex-row items-center bg-white rounded-2xl border-2 p-4 ${isSelected ? 'border-[#3A1AEB]' : 'border-slate-100'
                        }`}
                      style={{
                        width: tag === 'All Seasons' ? '100%' : '48%',
                        shadowColor: isSelected ? '#3A1AEB' : '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isSelected ? 0.1 : 0.05,
                        shadowRadius: 10,
                        elevation: 2
                      }}
                    >
                      <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isSelected ? 'bg-[#3A1AEB]/10' : 'bg-slate-50'}`}>
                        <Ionicons name={iconName} size={24} color={isSelected ? "#3A1AEB" : "#64748b"} />
                      </View>
                      <Text className={`font-bold font-inter-bold text-base ${isSelected ? 'text-[#3A1AEB]' : 'text-slate-700'}`}>
                        {tag}
                      </Text>
                      {isSelected && (
                        <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#3A1AEB]" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : group.id === 'style' ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 16 }}
              >
                {group.tags.map((tag) => {
                  const isSelected = selectedFilters[group.id].includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => toggleFilter(group.id, tag)}
                      className="rounded-3xl overflow-hidden border-2"
                      style={{
                        width: 160,
                        height: 100,
                        borderColor: isSelected ? '#3A1AEB' : 'transparent',
                      }}
                    >
                      <Image
                        source={{ uri: STYLE_IMAGES[tag] || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=500&auto=format&fit=crop' }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <View className="absolute inset-0 bg-black/40 p-4 justify-end">
                        <Text className="text-white font-bold font-inter-bold text-lg">{formatLabel(tag)}</Text>
                      </View>
                      {isSelected && (
                        <View className="absolute top-2 right-2 bg-[#3A1AEB] rounded-full p-1">
                          <Ionicons name="checkmark" size={12} color="white" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 20 }}
              >
                {group.tags.map((tag) => {
                  const isSelected = selectedFilters[group.id].includes(tag);
                  const colorCode = COLOR_MAP[tag];

                  return (
                    <View key={tag} className="items-center gap-2">
                      <TouchableOpacity
                        onPress={() => toggleFilter(group.id, tag)}
                        className={`w-14 h-14 rounded-full items-center justify-center border-2 ${isSelected ? 'border-[#3A1AEB]' : 'border-slate-100'
                          }`}
                        style={{
                          backgroundColor: tag === 'Any' ? 'transparent' : colorCode,
                          padding: isSelected ? 3 : 0
                        }}
                      >
                        {tag === 'Any' ? (
                          <View className="w-full h-full rounded-full bg-slate-50 items-center justify-center border border-slate-200">
                            <Ionicons name="ban-outline" size={24} color="#64748b" />
                          </View>
                        ) : isSelected ? (
                          <View className="w-full h-full rounded-full items-center justify-center" style={{ backgroundColor: colorCode }}>
                            <Ionicons name="checkmark" size={24} color={tag === 'White' || tag === 'Beige' ? '#3A1AEB' : 'white'} />
                          </View>
                        ) : (
                          <View className="w-full h-full rounded-full shadow-sm" style={{ backgroundColor: colorCode }} />
                        )}
                      </TouchableOpacity>
                      <Text className={`text-xs font-bold font-inter-bold ${isSelected ? 'text-[#3A1AEB]' : 'text-slate-400'}`}>
                        {tag}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        ))}



        {/* Main Action Button - Now inside ScrollView */}
        <View className="px-6 mt-8 mb-8">
          <TouchableOpacity
            className={`w-full py-5 rounded-3xl items-center justify-center shadow-lg ${isGenerating ? 'bg-slate-700' : 'bg-[#3A1AEB] shadow-[#3A1AEB]/30'}`}
            activeOpacity={0.8}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Text className="text-white font-black font-inter-black text-lg">
                CREATING...
              </Text>
            ) : (
              <Text className="text-white font-black font-inter-black text-lg">
                CREATE OUTFIT
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Result Modal - Using Reusable Component */}
      <OutfitViewModal
        visible={resultModalVisible}
        onClose={() => setResultModalVisible(false)}
        items={selectedOutfitItems}
        confetti={true}
        animationSource={require('../../assets/animations/confetti.json')}
      />

      {/* Locked State Overlay */}
      {isLocked && !loading && (
        <View className="absolute inset-0 bg-white/95 z-40 items-center justify-center px-8">
          <View className="bg-white p-8 rounded-[40px] border border-slate-100 w-full items-center shadow-2xl">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
              <Ionicons name="lock-closed" size={40} color="#3A1AEB" />
            </View>

            <Text className="text-2xl font-black font-inter-black text-slate-900 text-center mb-3">
              Unlock Stylist
            </Text>

            <Text className="text-slate-500 text-center font-inter-medium mb-8 leading-6">
              To create the best outfits, the AI stylist needs a bit more variety in your wardrobe.
            </Text>

            <View className="w-full gap-4 mb-8">
              {/* Tops Progress */}
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-700 font-bold">Tops</Text>
                  <Text className={topsCount >= 3 ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                    {topsCount}/3
                  </Text>
                </View>
                <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${topsCount >= 3 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min((topsCount / 3) * 100, 100)}%` }}
                  />
                </View>
              </View>

              {/* Bottoms Progress */}
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-700 font-bold">Bottoms</Text>
                  <Text className={bottomsCount >= 3 ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                    {bottomsCount}/3
                  </Text>
                </View>
                <View className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${bottomsCount >= 3 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min((bottomsCount / 3) * 100, 100)}%` }}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="w-full bg-[#3A1AEB] py-5 rounded-3xl flex-row items-center justify-center gap-2 shadow-lg shadow-[#3A1AEB]/20"
              onPress={() => router.push('/wardrobe')}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text className="text-white font-black font-inter-black text-lg text-white">ADD CLOTHES</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {(loading || isGenerating) && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <LottieView
            source={require("../../assets/animations/loading-2.json")}
            autoPlay
            loop
            style={{ width: 100, height: 100 }}
          />
        </View>
      )}
    </Animated.View>
  );
}
