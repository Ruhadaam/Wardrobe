import { View, Text, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../providers/AuthProvider";
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfilePage() {
  const { top } = useSafeAreaInsets();
  const { signOut, user } = useAuth();

  return (
    <View className="flex-1 bg-slate-900" style={{ paddingTop: top }}>
      <View className="flex-1 px-4">
        <View className="items-center mt-8 mb-8">
          <View className="w-24 h-24 bg-slate-800 rounded-full items-center justify-center mb-4 border border-slate-700">
            <MaterialCommunityIcons name="account" size={48} color="#94a3b8" />
          </View>
          <Text className="text-xl font-bold text-white">{user?.email}</Text>
          <Text className="text-slate-400">User ID: {user?.id?.slice(0, 8)}...</Text>
        </View>

        <TouchableOpacity
          onPress={signOut}
          className="bg-slate-800/50 border border-slate-700 py-4 rounded-xl flex-row items-center justify-center space-x-2"
        >
          <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
          <Text className="text-red-500 font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}




