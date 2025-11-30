import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
        <Label>Outfit</Label>
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
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1976D2",
        tabBarInactiveTintColor: "#757575",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          paddingBottom: Math.max(bottom, 8),
          paddingTop: 8,
          height: 64 + Math.max(bottom - 8, 0),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: "Wardrobe",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="checkroom" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfit"
        options={{
          title: "Outfit",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
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

