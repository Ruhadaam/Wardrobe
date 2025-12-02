import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OutfitPage() {
  const { top } = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-slate-900" style={{ paddingTop: top }}>
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-2xl font-bold font-inter-bold mb-4 text-white">Combine</Text>
        <Text className="text-slate-400 text-center">
          Create and manage your outfits here
        </Text>
      </View>
    </View>
  );
}




