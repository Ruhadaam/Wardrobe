import { View, Text, TouchableOpacity, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../providers/AuthProvider";
import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function ProfilePage() {
  const { signOut, profile, user } = useAuth();

  const settingsItems = [
    { id: 'account', label: 'Account Info', icon: 'account-outline', color: '#3A1AEB' },
    { id: 'wardrobe', label: 'Wardrobe Data', icon: 'wardrobe-outline', color: '#EC4899' },
    { id: 'settings', label: 'App Settings', icon: 'cog-outline', color: '#F59E0B' },
    { id: 'support', label: 'Help & Support', icon: 'help-circle-outline', color: '#10B981' },
  ];

  return (
    <View className="flex-1 bg-white">


      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* User Header */}
        <View className="items-center mt-10 mb-8 px-6">
          <View className="w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-6 border-4 border-slate-50 shadow-sm">
            <MaterialCommunityIcons
              name={profile?.gender === 'female' ? "face-woman" : "face-man"}
              size={60}
              color="#3A1AEB"
            />
          </View>

          <Text className="text-2xl font-black font-inter-black text-slate-900 text-center">
            {profile?.name} {profile?.surname}
          </Text>
          <Text className="text-slate-500 font-inter-medium text-base mb-6">
            {user?.email}
          </Text>

          <TouchableOpacity className="bg-[#3A1AEB]/10 px-8 py-3.5 rounded-2xl">
            <Text className="text-[#3A1AEB] font-black font-inter-black text-sm uppercase tracking-widest">
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plan Card */}
        <View className="px-6 mb-10">
          <View
            className="bg-white rounded-[40px] p-8 border border-slate-100 flex-row items-center justify-between"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.08,
              shadowRadius: 30,
              elevation: 8
            }}
          >
            <View className="flex-1 mr-4">
              <View className="flex-row items-center mb-3">
                <View className="bg-[#3A1AEB]/10 p-2 rounded-xl mr-2">
                  <MaterialCommunityIcons name="diamond-outline" size={20} color="#3A1AEB" />
                </View>
                <Text className="text-slate-900 font-black font-inter-black text-lg">
                  Wardrobe Free
                </Text>
              </View>
              <Text className="text-slate-500 font-inter-medium text-sm leading-5 mb-6">
                Limited AI suggestions and wardrobe analysis.
              </Text>

              <TouchableOpacity className="bg-[#3A1AEB] py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-[#3A1AEB]/30">
                <MaterialCommunityIcons name="arrow-up-circle-outline" size={20} color="white" />
                <Text className="text-white font-black font-inter-black text-sm ml-2 uppercase tracking-widest">
                  Upgrade to Pro
                </Text>
              </TouchableOpacity>
            </View>

            <View className="w-28 h-28 bg-[#3A1AEB]/5 rounded-3xl items-center justify-center overflow-hidden">
              <View className="w-16 h-16 bg-[#3A1AEB]/10 rounded-full absolute -top-4 -right-4" />
              <View className="w-20 h-20 bg-[#3A1AEB]/10 rounded-full absolute -bottom-8 -left-8" />
              <MaterialCommunityIcons name="star-outline" size={40} color="#3A1AEB" />
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View className="px-6 mb-10">
          <Text className="text-slate-400 font-black font-inter-black text-xs uppercase tracking-[3px] mb-6 ml-2">
            Account Settings
          </Text>

          <View className="bg-white rounded-[40px] border border-slate-100 overflow-hidden">
            {settingsItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                className={`flex-row items-center p-5 active:bg-slate-50 ${index !== settingsItems.length - 1 ? 'border-b border-slate-50' : ''
                  }`}
              >
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text className="flex-1 text-slate-800 font-black font-inter-black text-base">
                  {item.label}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            onPress={signOut}
            className="flex-row items-center justify-center py-6 active:opacity-60"
          >
            <MaterialCommunityIcons name="logout-variant" size={24} color="#ef4444" />
            <Text className="text-red-500 font-black font-inter-black text-lg ml-3 uppercase tracking-wider">
              Log Out
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <Text className="text-slate-300 font-inter-medium text-xs">
            Wardrobe v1.2.0 (Build 1024)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}




