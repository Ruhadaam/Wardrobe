import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HistoryPage() {
  const { top } = useSafeAreaInsets();
  
  return (
    <View className="flex-1" style={{ paddingTop: top }}>
      <View className="flex-1 items-center justify-center px-4">
        <Text className="text-2xl font-bold mb-4">History</Text>
        <Text className="text-gray-500 text-center">
          View your outfit history here
        </Text>
      </View>
    </View>
  );
}




