import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Platform, Image, Modal, ActivityIndicator, Alert, InteractionManager, RefreshControl } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWardrobe } from '../../providers/WardrobeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { WardrobeItem } from '../../services/visionApi';
import LottieView from 'lottie-react-native';
import Header from "../../components/Header";

import { Ionicons } from '@expo/vector-icons';
import { stylistService, StylistSelection } from '../../services/stylistService';
import { wardrobeService } from '../../services/wardrobeService';
import { formatLabel } from '../../utils/textUtils';
import OutfitViewModal from '../../components/OutfitViewModal';

const { width } = Dimensions.get('window');
import { useRouter, useFocusEffect } from 'expo-router';
import { RevenueCatService } from '../../lib/revenuecat';
import { adMobService } from '../../lib/admob';
import { useTranslation } from 'react-i18next';

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

// Style configuration with icons and gradient colors - no remote images needed
const STYLE_CONFIG: Record<string, { icon: string; colors: [string, string] }> = {
  'casual': { icon: 'shirt-outline', colors: ['#60A5FA', '#3B82F6'] },
  'smart_casual': { icon: 'glasses-outline', colors: ['#34D399', '#10B981'] },
  'business_casual': { icon: 'briefcase-outline', colors: ['#A78BFA', '#8B5CF6'] },
  'formal': { icon: 'diamond-outline', colors: ['#1E293B', '#0F172A'] },
  'streetwear': { icon: 'flame-outline', colors: ['#FB923C', '#F97316'] },
  'sport': { icon: 'fitness-outline', colors: ['#F87171', '#EF4444'] },
  'minimal': { icon: 'remove-outline', colors: ['#94A3B8', '#64748B'] },
  'bohemian': { icon: 'flower-outline', colors: ['#F472B6', '#EC4899'] },
  'vintage': { icon: 'time-outline', colors: ['#D4A574', '#B8956F'] },
  'chic': { icon: 'sparkles-outline', colors: ['#C084FC', '#A855F7'] },
  'preppy': { icon: 'school-outline', colors: ['#2DD4BF', '#14B8A6'] },
};

const COLOR_MAP: Record<string, string> = {
  'Black': '#000000',
  'White': '#FFFFFF',
  'Blue': '#3A1AEB',
  'Red': '#EF4444',
  'Beige': '#F5F5DC',
  'Grey': '#808080',
};

interface FilterProps {
  selectedTags: string[];
  onToggle: (tag: string) => void;
  shouldAnimate?: boolean;
}

// --- Separate Components ---

const SeasonFilter = memo(({ selectedTags, onToggle, shouldAnimate = true }: FilterProps) => {
  const { t } = useTranslation();
  const tags = ['Spring', 'Summer', 'Autumn', 'Winter', 'All Seasons'];

  return (
    <Animated.View entering={shouldAnimate ? FadeInUp.duration(500) : undefined} className="mb-8">
      <View className="px-6 flex-row items-center gap-2 mb-4">
        <Ionicons name="cloudy-night-outline" size={18} color="#64748b" />
        <Text className="text-sm font-black font-inter-black text-slate-400 uppercase tracking-widest">
          {t('outfit.season')}
        </Text>
      </View>
      <View className="px-6 flex-row flex-wrap justify-between gap-y-4">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          let iconName: any = 'sunny-outline';
          if (tag === 'Spring') iconName = 'flower-outline';
          else if (tag === 'Summer') iconName = 'sunny-outline';
          else if (tag === 'Autumn') iconName = 'leaf-outline';
          else if (tag === 'Winter') iconName = 'snow-outline';
          else if (tag === 'All Seasons') iconName = 'infinite-outline';

          return (
            <TouchableOpacity
              key={tag}
              onPress={() => onToggle(tag)}
              className={`flex-row items-center bg-white rounded-2xl border-2 p-4 ${isSelected ? 'border-[#3A1AEB]' : 'border-slate-100'}`}
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
                {t(`filters.${tag}`)}
              </Text>
              {isSelected && (
                <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#3A1AEB]" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
});

const StyleFilter = memo(({ selectedTags, onToggle, shouldAnimate = true }: FilterProps) => {
  const { t } = useTranslation();
  const tags = ["casual", "smart_casual", "business_casual", "formal", "streetwear", "sport", "minimal", "bohemian", "vintage", "chic", "preppy"];

  return (
    <Animated.View entering={shouldAnimate ? FadeInUp.duration(500) : undefined} className="mb-8">
      <View className="px-6 flex-row items-center gap-2 mb-4">
        <Ionicons name="shirt-outline" size={18} color="#64748b" />
        <Text className="text-sm font-black font-inter-black text-slate-400 uppercase tracking-widest">
          {t('outfit.style')}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 12 }}
      >
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const config = STYLE_CONFIG[tag] || { icon: 'ellipse-outline', colors: ['#94A3B8', '#64748B'] };

          return (
            <TouchableOpacity
              key={tag}
              onPress={() => onToggle(tag)}
              className="rounded-3xl overflow-hidden"
              style={{
                width: 160,
                height: 120,
                borderWidth: 3,
                borderColor: isSelected ? '#3A1AEB' : 'transparent',
              }}
            >
              {/* Gradient Background using View layers */}
              <View
                className="absolute inset-0"
                style={{ backgroundColor: config.colors[0] }}
              />
              <View
                className="absolute inset-0"
                style={{
                  backgroundColor: config.colors[1],
                  opacity: 0.7,
                }}
              />

              {/* Content */}
              <View className="flex-1 p-4 justify-between">
                <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center">
                  <Ionicons name={config.icon as any} size={22} color="white" />
                </View>
                <Text className="text-white font-bold font-inter-bold text-base">
                  {t(`filters.${tag}`)}
                </Text>
              </View>

              {/* Selected indicator */}
              {isSelected && (
                <View className="absolute top-2 right-2 bg-[#3A1AEB] rounded-full p-1.5">
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
});

const ColorFilter = memo(({ selectedTags, onToggle, shouldAnimate = true }: FilterProps) => {
  const { t } = useTranslation();
  const tags = ['Any', 'Black', 'White', 'Blue', 'Red', 'Beige', 'Grey'];

  return (
    <Animated.View entering={shouldAnimate ? FadeInUp.duration(500) : undefined} className="mb-8">
      <View className="px-6 flex-row items-center gap-2 mb-4">
        <Ionicons name="color-palette-outline" size={18} color="#64748b" />
        <Text className="text-sm font-black font-inter-black text-slate-400 uppercase tracking-widest">
          {t('outfit.colorTone')}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 20 }}
      >
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const colorCode = COLOR_MAP[tag];

          return (
            <View key={tag} className="items-center gap-2">
              <TouchableOpacity
                onPress={() => onToggle(tag)}
                className={`w-14 h-14 rounded-full items-center justify-center border-2 ${isSelected ? 'border-[#3A1AEB]' : 'border-slate-100'}`}
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
                {t(`filters.${tag}`)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
});

export default function OutfitPage() {
  const { top } = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, isPremium } = useAuth();
  const { items, loading } = useWardrobe(); // Use global state
  const router = useRouter();

  const [todayOutfitCount, setTodayOutfitCount] = useState<number>(0);
  const [watchedAdsCount, setWatchedAdsCount] = useState(0);
  const [isLoadingAd, setIsLoadingAd] = useState(false);

  // Track if this is the first render to control animations
  const isFirstRender = useRef(true);
  const hasInitialized = useRef(false);

  // Sequential Rendering State - sections stay visible after first render
  const [visibleSections, setVisibleSections] = useState(3); // Start with all visible
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize on first mount only
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // Start with sections hidden, then show them sequentially with animation
      setVisibleSections(0);
      setShouldAnimate(true);

      InteractionManager.runAfterInteractions(() => {
        setVisibleSections(1);
        setTimeout(() => setVisibleSections(2), 100);
        setTimeout(() => {
          setVisibleSections(3);
          // After initial animation completes, disable animations for future
          setTimeout(() => {
            isFirstRender.current = false;
            setShouldAnimate(false);
          }, 600);
        }, 300);
      });
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset filters
    setSelectedFilters({
      season: [],
      formality: [],
      style: [],
      color: []
    });

    // Don't restart animations, just reset filters
    setTimeout(() => {
      setRefreshing(false);
    }, 300);
  }, []);

  // useFocusEffect - no longer unmounts components
  useFocusEffect(
    useCallback(() => {
      // Screen focused - components stay mounted, no animation restart
      return () => {
        // Screen unfocused - keep components mounted for instant return
      };
    }, [])
  );

  useEffect(() => {
    const fetchUsage = async () => {
      if (!isPremium && user?.id) {
        const count = await wardrobeService.getTodayOutfitCount(user.id);
        setTodayOutfitCount(count);
      }
    };
    fetchUsage();
  }, [user, isPremium]);

  // Preload rewarded ad if reaching limit
  useEffect(() => {
    if (!isPremium && todayOutfitCount >= 2 && watchedAdsCount < 2) {
      adMobService.loadRewarded();
    }
  }, [isPremium, todayOutfitCount, watchedAdsCount]);

  const handleWatchAd = async () => {
    setIsLoadingAd(true);
    try {
      if (!adMobService.isRewardedAdLoaded()) {
        await adMobService.loadRewarded();
      }

      const rewardEarned = await adMobService.showRewarded();
      if (rewardEarned) {
        const newCount = watchedAdsCount + 1;
        setWatchedAdsCount(newCount);

        if (newCount >= 2) {
          // Grant bonus - reset today count effectively (or allow 1 more)
          // Simplest way: just decrement local count or set a "bonus" flag.
          // Let's decrement local count by 1 to allow 1 more generation.
          // BUT: BE is truth. We rely on BE count. 
          // So we must allow handleGenerate to proceed locally.
          // We will update logic in handleGenerate to check (todayOutfitCount >= 2 && watchedAdsCount < 2)
          Alert.alert(t('outfit.bonusUnlocked'), t('outfit.bonusUnlockedDesc'));
        } else {
          Alert.alert(t('outfit.adWatched'), t('outfit.watchOneMore'));
          // Load next ad
          adMobService.loadRewarded();
        }
      }
    } catch (e) {
      console.error("Ad error", e);
      Alert.alert(t('common.error'), t('outfit.adLoadError'));
    } finally {
      setIsLoadingAd(false);
    }
  };


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

  const toggleFilter = useCallback((category: FilterCategory, tag: string) => {
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
  }, []);

  const toggleSeason = useCallback((tag: string) => toggleFilter('season', tag), [toggleFilter]);
  const toggleStyle = useCallback((tag: string) => toggleFilter('style', tag), [toggleFilter]);
  const toggleColor = useCallback((tag: string) => toggleFilter('color' as any, tag), [toggleFilter]);

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
      Alert.alert(t('outfit.noItems'), t('outfit.noItemsDesc'));
      return;
    }

    // Limit Logic: 2 per day OR (Watch 2 ads -> +1 generation)
    // If user watched 2 ads, we allow generation even if count >= 2.
    // BUT we need to reset watchedAdsCount after consumption? 
    // Let's assume user watched 2 ads -> they get 1 free generation.
    // Logic: if (!isPremium && count >= 2 && watchedAdsCount < 2) -> BLOCK.

    if (isPremium === false && todayOutfitCount >= 2 && watchedAdsCount < 2) {
      Alert.alert(
        t('outfit.dailyLimitTitle'),
        t('outfit.dailyLimitDesc'),
        [
          { text: t('wardrobe.later'), style: "cancel" },
          {
            text: t('outfit.watchAds'),
            onPress: handleWatchAd
          },
          { text: t('wardrobe.upgradeToPro'), onPress: () => router.push('/paywall') }
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
              console.log("Auto-save outfit to history...");
              await wardrobeService.saveOutfit(user.id, resolvedItems);
              // Refresh count if free
              if (!isPremium) {
                const count = await wardrobeService.getTodayOutfitCount(user.id);
                setTodayOutfitCount(count);
                // If they used a bonus (watched 2 ads), reset ad count?
                if (watchedAdsCount >= 2) {
                  setWatchedAdsCount(0); // Consumption
                }
              }
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
        Alert.alert(t('outfit.stylistError'), t('outfit.stylistErrorDesc'));
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error'), t('outfit.genError'));
    } finally {
      setIsGenerating(false);
    }
  };

  const getSubCategory = (item: WardrobeItem) => {
    return item.analysis?.basic_info?.sub_category || item.basic_info?.sub_category || 'Item';
  };

  return (
    <View className="flex-1 bg-white">
      {Platform.OS === 'ios' && (
        <Animated.View entering={FadeIn.duration(400)}>
          <Header />
        </Animated.View>
      )}

      <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-6 pt-6 pb-4">
        <Text className="text-3xl font-black font-inter-black text-slate-900 mb-1 tracking-tight">
          {t('outfit.preferences')}
        </Text>
        <Text className="text-base font-medium font-inter-medium text-slate-500">
          {t('outfit.howToLook')}
        </Text>
      </Animated.View>

      {/* Free Plan Progress Bar */}
      {!isPremium && (
        <Animated.View entering={FadeInDown.duration(500).delay(200)} className="px-6 mb-4">
          <View
            className="bg-white rounded-2xl p-4 border border-slate-100"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="flash" size={16} color="#3A1AEB" />
                <Text className="text-sm font-bold font-inter-bold text-slate-700">
                  {t('outfit.dailyGenerations')}
                </Text>
              </View>
              <Text className="text-sm font-bold font-inter-bold text-slate-500">
                {Math.min(todayOutfitCount, 2)}/2
              </Text>
            </View>

            <View className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
              <View
                className="h-full bg-[#3A1AEB] rounded-full"
                style={{ width: `${Math.min((todayOutfitCount / 2) * 100, 100)}%` }}
              />
            </View>

            {todayOutfitCount >= 2 && watchedAdsCount < 2 && (
              <TouchableOpacity
                onPress={handleWatchAd}
                className="flex-row items-center justify-center bg-slate-900 py-2.5 rounded-xl mt-1"
              >
                {isLoadingAd ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="play-circle" size={18} color="white" style={{ marginRight: 6 }} />
                    <Text className="text-white text-xs font-bold font-inter-bold">
                      {t('outfit.watchAdsToUnlock')} ({watchedAdsCount}/2)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3A1AEB" />
        }
      >

        {/* 1. Season Filter */}
        {visibleSections >= 1 && (
          <SeasonFilter
            selectedTags={selectedFilters.season}
            onToggle={toggleSeason}
            shouldAnimate={shouldAnimate}
          />
        )}

        {/* 2. Style Filter */}
        {visibleSections >= 2 && (
          <StyleFilter
            selectedTags={selectedFilters.style}
            onToggle={toggleStyle}
            shouldAnimate={shouldAnimate}
          />
        )}

        {/* 3. Color Filter */}
        {visibleSections >= 3 && (
          <ColorFilter
            selectedTags={selectedFilters.color}
            onToggle={toggleColor}
            shouldAnimate={shouldAnimate}
          />
        )}

        {/* Main Action Button - Now inside ScrollView */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(600)}
          className="px-6 mt-8 mb-8"
        >
          <TouchableOpacity
            className={`w-full py-5 rounded-3xl items-center justify-center shadow-lg ${isGenerating ? 'bg-slate-700' : 'bg-[#3A1AEB] shadow-[#3A1AEB]/30'}`}
            activeOpacity={0.8}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Text className="text-white font-black font-inter-black text-lg">
                {t('outfit.creating')}
              </Text>
            ) : (
              <Text className="text-white font-black font-inter-black text-lg">
                {t('outfit.createOutfit')}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
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
              {t('outfit.unlockStylist')}
            </Text>

            <Text className="text-slate-500 text-center font-inter-medium mb-8 leading-6">
              {t('outfit.unlockStylistDesc')}
            </Text>

            <View className="w-full gap-4 mb-8">
              {/* Tops Progress */}
              <View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-700 font-bold">{t('outfit.tops')}</Text>
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
                  <Text className="text-slate-700 font-bold">{t('outfit.bottoms')}</Text>
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
              <Text className="text-white font-black font-inter-black text-lg text-white">{t('outfit.addClothes')}</Text>
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
