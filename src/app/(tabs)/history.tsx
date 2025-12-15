import React, { useState, useCallback } from "react";
import { View, Text, Platform, FlatList, TouchableOpacity, Image, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from 'expo-router';
import { useAuth } from "../../providers/AuthProvider";
import { wardrobeService } from "../../services/wardrobeService";
import { WardrobeItem } from "../../services/visionApi";
import Header from "../../components/Header";
import OutfitViewModal from "../../components/OutfitViewModal";
import { format } from 'date-fns';

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

  const renderOutfitItem = ({ item }: { item: Outfit }) => {
    // Create a 2x2 grid preview of items
    const previewItems = item.items.slice(0, 4);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedOutfit(item)}
        className="bg-slate-800 m-2 rounded-2xl overflow-hidden shadow-lg border border-slate-700/50"
        style={{ width: '45%', aspectRatio: 0.8 }}
      >
        <View className="flex-1 flex-row flex-wrap justify-between p-2">
          {previewItems.map((outfitItem, index) => (
            <Image
              key={index}
              source={{ uri: outfitItem.image_url }}
              className="w-[48%] h-[48%] mb-1 rounded-lg bg-slate-700"
              resizeMode="cover"
            />
          ))}
        </View>
        <View className="p-3 bg-slate-800/90">
          <Text className="text-slate-400 text-xs font-inter mb-1">
            {format(new Date(item.created_at), 'MMMM d, yyyy')}
          </Text>
          <Text className="text-white font-bold text-sm">
            {item.items.length} Items
          </Text>
        </View>
      </TouchableOpacity>
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

  return (
    <View className="flex-1 bg-slate-900">
      {Platform.OS === 'ios' && <Header />}

      <View className="flex-1 px-2">
        <Text className="text-2xl font-black font-inter-black text-white mt-4 mb-6 px-2 tracking-tight">
          History
        </Text>

        {outfits.length === 0 && !loading ? (
          <View className="flex-1 items-center justify-center -mt-20">
            <Text className="text-slate-500 text-lg font-inter-medium text-center">
              No outfits yet.
            </Text>
            <Text className="text-slate-600 text-sm mt-2 text-center px-10">
              Visit the Combine tab to create your first look!
            </Text>
          </View>
        ) : (
          <FlatList
            data={outfits}
            renderItem={renderOutfitItem}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={{ paddingBottom: 100 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={loadOutfits} tintColor="#fff" />
            }
          />
        )}
      </View>

      {/* Modal for viewing details */}
      <OutfitViewModal
        visible={!!selectedOutfit}
        onClose={() => setSelectedOutfit(null)}
        items={selectedOutfit ? selectedOutfit.items : []}
        confetti={false}
        onDelete={selectedOutfit ? () => handleDelete(selectedOutfit.id) : undefined}
      />
    </View>
  );
}
