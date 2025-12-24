import React, { useState, useCallback } from "react";
import { View, Text, Platform, FlatList, TouchableOpacity, Image, RefreshControl, Alert, ScrollView } from "react-native";
import Animated, { FadeInRight, FadeInDown } from "react-native-reanimated";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from 'expo-router';
import { useAuth } from "../../providers/AuthProvider";
import { wardrobeService } from "../../services/wardrobeService";
import { WardrobeItem } from "../../services/visionApi";
import Header from "../../components/Header";
import OutfitViewModal from "../../components/OutfitViewModal";
import { format, isToday, isYesterday, isSameDay, subDays, eachDayOfInterval } from 'date-fns';

interface Outfit {
  id: string;
  items: WardrobeItem[];
  created_at: string;
}

export default function HistoryPage() {
  const { top } = useSafeAreaInsets();
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Generate last 14 days
  const calendarDays = eachDayOfInterval({
    start: subDays(new Date(), 14),
    end: new Date(),
  }).reverse();

  const loadOutfits = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await wardrobeService.getOutfits(user.id);
      setOutfits(data);
    } catch (error) {
      console.error("Error loading outfits:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOutfits();
    }, [user?.id])
  );

  const formatOutfitDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'd MMM');
  };

  const renderOutfitItem = ({ item, index }: { item: Outfit, index: number }) => {
    // Determine how many items to show in the preview grid
    const hasMore = item.items.length > 4;
    const previewItems = item.items.slice(0, hasMore ? 3 : 4);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(400)}
        style={{ width: '46%', margin: '2%' }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedOutfit(item)}
          className="bg-white rounded-[32px] overflow-hidden w-full"
          style={{
            aspectRatio: 0.75,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 6,
            borderWidth: 1,
            borderColor: '#f8fafc'
          }}
        >
          <View className="flex-1 flex-row flex-wrap bg-slate-50">
            {previewItems.map((outfitItem, index) => (
              <View
                key={index}
                style={{
                  width: previewItems.length === 1 ? '100%' : '50%',
                  height: previewItems.length <= 2 ? '100%' : '50%',
                  borderWidth: 0.5,
                  borderColor: 'white'
                }}
              >
                <Image
                  source={{ uri: outfitItem.image_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            ))}
            {/* Show the plus box ONLY if there are MORE than 4 items */}
            {hasMore && (
              <View className="w-1/2 h-1/2 bg-slate-100 items-center justify-center border-[0.5px] border-white">
                <Text className="text-slate-400 font-black text-xs">+{item.items.length - 3}</Text>
              </View>
            )}
          </View>
          <View className="p-4 bg-white border-t border-slate-50">
            <View className="flex-row justify-between items-center mb-0.5">
              <Text className="text-slate-500 text-[10px] font-black font-inter-black uppercase tracking-widest">
                {formatOutfitDate(item.created_at)}
              </Text>
            </View>
            <Text className="text-slate-900 font-black font-inter-black text-sm uppercase">
              {item.items.length} {item.items.length === 1 ? 'Item' : 'Items'}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleDelete = (outfitId: string) => {
    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to delete this outfit? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              setSelectedOutfit(null); // Close modal
              await wardrobeService.deleteOutfit(outfitId);
              setOutfits(prev => prev.filter(o => o.id !== outfitId));
            } catch (error) {
              Alert.alert("Error", "Failed to delete outfit.");
              console.error(error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredOutfits = outfits.filter(o =>
    isSameDay(new Date(o.created_at), selectedDate)
  );

  return (
    <Animated.View entering={FadeInRight.duration(400)} className="flex-1 bg-white">
      {Platform.OS === 'ios' && <Header />}

      <View className="flex-1">
        <View className="px-6">
          <Text className="text-3xl font-black font-inter-black text-slate-900 mt-6 mb-4 tracking-tight">
            History
          </Text>

          {/* Horizontal Calendar Picker */}
          <View className="bg-white rounded-[32px] border border-slate-100 shadow-sm mb-6 overflow-hidden">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}
            >
              {calendarDays.map((date) => {
                const isSelected = isSameDay(date, selectedDate);
                const dayName = format(date, 'EEE').toUpperCase();
                const dayNum = format(date, 'd');
                const isWeekend = dayName === 'SAT' || dayName === 'SUN';

                return (
                  <TouchableOpacity
                    key={date.toISOString()}
                    onPress={() => setSelectedDate(date)}
                    className={`items-center justify-center rounded-2xl p-3 w-14 ${isSelected ? 'bg-[#3A1AEB]' : 'bg-transparent'
                      }`}
                    style={isSelected ? {
                      shadowColor: '#3A1AEB',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 5
                    } : {}}
                  >
                    <Text className={`text-[10px] font-black font-inter-black mb-1 ${isSelected ? 'text-white/70' : isWeekend ? 'text-red-400' : 'text-slate-400'
                      }`}>
                      {dayName}
                    </Text>
                    <Text className={`text-lg font-black font-inter-black ${isSelected ? 'text-white' : 'text-slate-900'
                      }`}>
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View className="flex-1 px-4">
          {filteredOutfits.length === 0 && !loading ? (
            <View className="flex-1 items-center justify-center -mt-20">
              <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-4">
                <MaterialCommunityIcons name="calendar-blank" size={40} color="#cbd5e1" />
              </View>
              <Text className="text-slate-500 text-lg font-inter-medium text-center">
                Nothing for this day.
              </Text>
              <Text className="text-slate-400 text-sm mt-2 text-center px-10">
                You didn't generate any outfits on this date.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredOutfits}
              renderItem={renderOutfitItem}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={{ paddingBottom: 100 }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              refreshControl={
                <RefreshControl refreshing={loading} onRefresh={loadOutfits} tintColor="#3A1AEB" />
              }
            />
          )}
        </View>
      </View>

      {/* Modal for viewing details */}
      <OutfitViewModal
        visible={!!selectedOutfit}
        onClose={() => setSelectedOutfit(null)}
        items={selectedOutfit ? selectedOutfit.items : []}
        confetti={false}
        onDelete={selectedOutfit ? () => handleDelete(selectedOutfit.id) : undefined}
      />
    </Animated.View>
  );
}
