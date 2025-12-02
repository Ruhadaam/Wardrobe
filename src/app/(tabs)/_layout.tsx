import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// iOS Tab Bar - NativeTabs kullanıyor (eski hali)
function IOSTabBar() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="wardrobe">
        <Icon sf="tshirt.fill" />
        <Label>Wardrobe</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="outfit">
        <Icon sf="square.stack.fill" />
        <Label>Combine</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Icon sf="clock.fill" />
        <Label>History</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// Android Tab Bar - Standart Tabs kullanıyor
function AndroidTabBar() {
  const { bottom } = useSafeAreaInsets();

  // Tailwind CSS değerleri
  const tabBarStyle = {
    position: 'absolute' as const,
    bottom: Math.max(bottom, 30),
    backgroundColor: '#0f172a', // bg-slate-900
    borderRadius: 30, // rounded-3xl
    borderTopWidth: 0,
    height: 60, // h-15
    elevation: 10,
    shadowColor: '#06b6d4', // shadow-cyan-500
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginLeft: 20, // mx-5
    marginRight: 20, // mx-5
  };

  const tabBarItemStyle = {
    height: 60, // h-15
    paddingVertical: 5, // py-1.5
  };

  const tabBarLabelStyle = {
    fontSize: 10, // text-xs
    fontWeight: '600' as const, // font-semibold
    fontFamily: Platform.OS === 'android' ? 'Inter_600SemiBold' : undefined,
    marginBottom: 4, // mb-1
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#06b6d4', // text-cyan-500
        tabBarInactiveTintColor: '#94a3b8', // text-slate-400
        tabBarStyle,
        tabBarItemStyle,
        tabBarLabelStyle,
      }}
    >
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: "Wardrobe",
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-800' : ''}`}>
              <MaterialCommunityIcons name={focused ? "wardrobe" : "wardrobe-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="outfit"
        options={{
          title: "Combine",
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-800' : ''}`}>
              <MaterialIcons name="checkroom" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-800' : ''}`}>
              <MaterialIcons name="history" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <View className={`items-center justify-center w-10 h-10 rounded-full ${focused ? 'bg-slate-800' : ''}`}>
              <MaterialIcons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  if (Platform.OS === "ios") {
    return <IOSTabBar />;
  }
  return <AndroidTabBar />;
}

