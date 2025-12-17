import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
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

// Define available filter categories
type FilterCategory = 'season' | 'formality' | 'style' | 'color';

interface FilterGroup {
  id: FilterCategory;
  label: string;
  tags: string[];
}

const DEFAULT_FILTER_GROUPS: FilterGroup[] = [
  { id: 'season', label: 'Season', tags: ['All Seasons', 'spring', 'summer', 'autumn', 'winter'] },
  { id: 'formality', label: 'Formality', tags: ['casual', 'formal', 'smart_casual', 'business', 'party', 'sport'] },
  { id: 'style', label: 'Style', tags: ['basic', 'vintage', 'streetwear', 'classic', 'boho', 'minimalist'] },
  { id: 'color', label: 'Color', tags: ['black', 'white', 'grey', 'blue', 'red', 'green', 'beige', 'brown', 'colorful'] },
];

export default function OutfitPage() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const { items, loading } = useWardrobe(); // Use global state
  const router = useRouter();

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
    // If no filters at all, show total
    const hasAnyFilter = Object.values(selectedFilters).some(tags => tags.length > 0);
    if (!hasAnyFilter) return items;

    return items.filter(item => {
      // Check filtering for each category
      // Logic: OR (Union) between categories. If item matches ANY selected filter from ANY category, it passes.

      // 1. Season
      if (selectedFilters.season.length > 0) {
        const itemSeasons = (item.analysis?.context?.seasons || item.context?.seasons || []).map((s: string) => s.toLowerCase());

        // Match if one of the selected tags matches item season OR if item is 'all seasons'
        // Match if one of the selected tags matches item season
        // Special handling for "All Seasons" vs "All Season" mismatch
        const hasMatch = selectedFilters.season.some(tag => {
          const lowerTag = tag.toLowerCase();
          if (lowerTag === 'all seasons' || lowerTag === 'all_seasons') {
            return itemSeasons.includes('all seasons') || itemSeasons.includes('all season') || itemSeasons.includes('all_seasons') || itemSeasons.includes('all_season');
          }
          return itemSeasons.includes(lowerTag) || itemSeasons.includes(lowerTag.replace(' ', '_'));
        });

        // Always include "All Seasons" items regardless of specific season filter
        const isAllSeasonsItem = itemSeasons.includes('all seasons') || itemSeasons.includes('all season') || itemSeasons.includes('all_seasons') || itemSeasons.includes('all_season');

        if (hasMatch || isAllSeasonsItem) return true;
      }

      // 2. Formality
      if (selectedFilters.formality.length > 0) {
        const val = (item.analysis?.context?.formality || item.context?.formality || '').toLowerCase();
        if (selectedFilters.formality.includes(val)) return true;
      }

      // 3. Style
      if (selectedFilters.style.length > 0) {
        const val = (item.analysis?.attributes?.style || item.attributes?.style || '').toLowerCase();
        if (selectedFilters.style.includes(val)) return true;
      }

      // 4. Color
      if (selectedFilters.color.length > 0) {
        const val = (item.analysis?.visual_details?.primary_color || item.visual_details?.primary_color || '').toLowerCase();
        if (selectedFilters.color.includes(val)) return true;
      }

      // If it didn't match any active filter, return false
      return false;
    });
  }, [items, selectedFilters]);



  const handleGenerate = async () => {
    if (filteredItems.length === 0) {
      Alert.alert("No items", "Please select fewer filters or add more clothes.");
      return;
    }

    setIsGenerating(true);
    console.log(`Generating outfit with ${filteredItems.length} candidate items...`);

    try {
      // Construct a detailed context from selected filters
      const contextParts: string[] = [];
      if (selectedFilters.season.length > 0) contextParts.push(`Season: ${selectedFilters.season.map(s => formatLabel(s)).join(', ')}`);
      if (selectedFilters.formality.length > 0) contextParts.push(`Formality: ${selectedFilters.formality.map(f => formatLabel(f)).join(', ')}`);
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
    <View className="flex-1 bg-slate-900">
      {Platform.OS === 'ios' && <Header />}

      <View className="px-6 pt-6 pb-4">
        <Text className="text-4xl font-black font-inter-black text-white mb-1 tracking-tight shadow-cyan-500/50 shadow-lg">
          Combine
        </Text>
        <Text className="text-sm font-medium font-inter-medium text-slate-400">
          Filter your wardrobe to create outfits
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 130 }}>

        {/* Filter Groups */}
        {filterGroups.map((group) => (
          <View key={group.id} className="mb-6">
            <Text className="px-6 text-lg font-bold font-inter-bold text-slate-300 mb-3 ml-1">
              {group.label}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
            >
              {group.tags.map((tag) => {
                const isSelected = selectedFilters[group.id].includes(tag);

                // Icon Mapping Logic
                let iconName: keyof typeof Ionicons.glyphMap | null = null;
                let customColor: string | null = null;

                if (group.id === 'season') {
                  if (tag.includes('spring')) iconName = 'flower-outline';
                  else if (tag.includes('summer')) iconName = 'sunny-outline';
                  else if (tag.includes('autumn')) iconName = 'leaf-outline';
                  else if (tag.includes('winter')) iconName = 'snow-outline';
                  else iconName = 'earth-outline'; // All seasons
                } else if (group.id === 'formality') {
                  if (tag.includes('business')) iconName = 'briefcase-outline';
                  else if (tag.includes('casual')) iconName = 'cafe-outline';
                  else if (tag.includes('party')) iconName = 'wine-outline';
                  else if (tag.includes('sport')) iconName = 'football-outline';
                  else if (tag.includes('smart')) iconName = 'glasses-outline';
                  else iconName = 'pricetag-outline';
                } else if (group.id === 'style') {
                  if (tag.includes('vintage')) iconName = 'time-outline';
                  else if (tag.includes('street')) iconName = 'bicycle-outline';
                  else if (tag.includes('classic')) iconName = 'ribbon-outline';
                  else if (tag.includes('minimal')) iconName = 'remove-circle-outline';
                  else iconName = 'shirt-outline';
                } else if (group.id === 'color') {
                  // Use specific colors for the dot
                  const colorMap: Record<string, string> = {
                    'black': '#000000', 'white': '#ffffff', 'grey': '#808080', 'blue': '#3b82f6',
                    'red': '#ef4444', 'green': '#22c55e', 'beige': '#f5f5dc', 'brown': '#a52a2a', 'colorful': 'rainbow'
                  };
                  customColor = colorMap[tag.toLowerCase()] || '#cbd5e1';
                }

                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleFilter(group.id, tag)}
                    className={`p-3 rounded-2xl border items-center justify-center gap-2 ${isSelected
                      ? 'bg-cyan-500/20 border-cyan-500'
                      : 'bg-slate-800 border-slate-700'
                      }`}
                    style={{ width: 100, height: 100 }} // Fixed square size for card look
                  >

                    {/* Color Circle for Color Category -> Larger for card view */}
                    {group.id === 'color' && customColor && (
                      <View className={`w-8 h-8 rounded-full border border-slate-600 mb-1 ${customColor === 'rainbow' ? 'bg-indigo-500' : ''}`} style={customColor !== 'rainbow' ? { backgroundColor: customColor } : {}} />
                    )}

                    {/* Icon for other categories -> Larger size */}
                    {group.id !== 'color' && iconName && (
                      <Ionicons
                        name={isSelected ? (iconName.replace('-outline', '') as any) : iconName}
                        size={32}
                        color={isSelected ? "#06b6d4" : "#94a3b8"}
                      />
                    )}

                    <Text className={`font-semibold font-inter-semibold text-xs text-center capitalize ${isSelected ? 'text-cyan-400' : 'text-slate-400'
                      }`}>
                      {formatLabel(tag)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ))}



        {/* Main Action Button - Now inside ScrollView */}
        <View className="px-6 mt-8 mb-8">
          <TouchableOpacity
            className={`w-full py-4 rounded-2xl items-center justify-center shadow-lg ${isGenerating ? 'bg-slate-700' : 'bg-cyan-500 shadow-cyan-500/30'}`}
            activeOpacity={0.8}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Text className="text-white font-bold font-inter-bold text-lg">
                Creating...
              </Text>
            ) : (
              <Text className="text-white font-bold font-inter-bold text-lg">
                Create Outfit
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
        <View className="absolute inset-0 bg-slate-900/95 z-40 items-center justify-center px-8">
          <View className="bg-slate-800 p-8 rounded-3xl border border-slate-700 w-full items-center shadow-2xl">
            <View className="w-20 h-20 bg-slate-700 rounded-full items-center justify-center mb-6">
              <Ionicons name="lock-closed" size={40} color="#94a3b8" />
            </View>

            <Text className="text-2xl font-black font-inter-black text-white text-center mb-3">
              Unlock Stylist
            </Text>

            <Text className="text-slate-400 text-center font-inter-medium mb-8 leading-6">
              To create the best outfits, the AI stylist needs a bit more variety in your wardrobe.
            </Text>

            <View className="w-full gap-4 mb-8">
              {/* Tops Progress */}
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-300 font-bold">Tops</Text>
                  <Text className={topsCount >= 3 ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>
                    {topsCount}/3
                  </Text>
                </View>
                <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${topsCount >= 3 ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min((topsCount / 3) * 100, 100)}%` }}
                  />
                </View>
              </View>

              {/* Bottoms Progress */}
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-300 font-bold">Bottoms</Text>
                  <Text className={bottomsCount >= 3 ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>
                    {bottomsCount}/3
                  </Text>
                </View>
                <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${bottomsCount >= 3 ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min((bottomsCount / 3) * 100, 100)}%` }}
                  />
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="w-full bg-cyan-500 py-4 rounded-xl flex-row items-center justify-center gap-2"
              onPress={() => router.push('/(tabs)/')} // Assuming this goes to home/camera
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text className="text-white font-bold font-inter-bold text-lg">Add Clothes</Text>
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
    </View>
  );
}
